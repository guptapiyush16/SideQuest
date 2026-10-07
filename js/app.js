// SideQuest IRL — Master Application Controller
// Field-Journal Editorial Aesthetic (Manus Style)

import { store, XP_RULES } from './storage.js';
import { generateDailyQuests } from './questMaster.js';
import { ScannerEngine } from './scanner.js';
import { FIELD_GUIDE, categoryMeta, findFieldGuideMatch } from './fieldGuide.js';
import { 
  getAnonymousDeviceId, 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  initSupabaseClient,
  testSupabaseConnection, 
  SUPABASE_SETUP_SQL 
} from './supabaseClient.js';

// Initialize Scanner & Global State
const scanner = new ScannerEngine();
let activeView = 'home';
let currentDexCategory = 'all';
let currentDexMode = 'mine'; // 'mine' | 'guide'
let currentCapturedPhoto = null;
let currentScanAnalysis = null;
let questTimerInterval = null;
let userCoords = null;
let toastTimeout = null;

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  });
}

// Global Startup
document.addEventListener('DOMContentLoaded', async () => {
  initSupabaseClient();
  initGeolocationTracker();
  bindEventHandlers();
  
  // Seed demo state if brand new
  const state = store.getState();
  if (state.xp === 0 && Object.keys(state.pokedex).length === 0) {
    seedInitialDemoState();
  }

  // Ensure quests are generated
  if (!state.todayQuests || state.todayQuests.length === 0) {
    await refreshQuests();
  }

  // Check URL hash for initial navigation
  const hash = window.location.hash.replace('#', '');
  if (['home', 'scan', 'pokedex', 'adventures', 'profile', 'quest'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('home');
  }

  // Listen for hash changes (e.g. browser back/forward or programmatic hash navigation)
  window.addEventListener('hashchange', () => {
    const raw = window.location.hash.replace('#', '') || 'home';
    if (['home', 'scan', 'pokedex', 'adventures', 'profile', 'quest'].includes(raw)) {
      if (activeView !== raw) navigateTo(raw, false);
    }
  });

  // Initial UI Render
  renderAll();

  // Try loading cloud data if Supabase is connected
  store.loadFromCloud();

  // Subscribe to store updates
  store.subscribe(() => {
    renderAll();
  });
});

function seedInitialDemoState() {
  const seedNames = [
    { name: 'Snake Plant', scientific: 'Dracaena trifasciata', cat: 'plant', place: 'Gurugram', rarity: 1 },
    { name: 'Rose-ringed Parakeet', scientific: 'Psittacula krameri', cat: 'bird', place: 'Gurugram', rarity: 2 },
    { name: 'Bougainvillea', scientific: 'Bougainvillea glabra', cat: 'flower', place: 'Gurugram', rarity: 1 },
    { name: 'Quartz Crystal', scientific: 'Silicon dioxide', cat: 'rock', place: 'Aravalli trail', rarity: 2 },
    { name: 'Neem', scientific: 'Azadirachta indica', cat: 'plant', place: 'Gurugram', rarity: 1 },
  ];

  seedNames.forEach(s => {
    store.addDiscovery({
      candidate: { name: s.name, scientific: s.scientific, category: s.cat, rarity: s.rarity, confidence: 92 },
      locationName: s.place
    });
  });

  // Seed baseline XP and initial outings
  store.state.xp = 620;
  store.state.name = 'Arjun K.';
  
  const todayKey = new Date().toISOString().split('T')[0];
  const yesterdayKey = new Date(Date.now() - 864e5).toISOString().split('T')[0];
  const twoDaysAgoKey = new Date(Date.now() - 864e5 * 3).toISOString().split('T')[0];

  store.state.history[todayKey] = { distanceKm: 2.4, minutes: 38, discoveries: 4, newDiscoveries: 2, questsCompleted: 3, points: [] };
  store.state.history[yesterdayKey] = { distanceKm: 1.8, minutes: 27, discoveries: 2, newDiscoveries: 1, questsCompleted: 2, points: [] };
  store.state.history[twoDaysAgoKey] = { distanceKm: 3.1, minutes: 51, discoveries: 6, newDiscoveries: 2, questsCompleted: 3, points: [] };
  
  store.save();
}

// View Navigation Router
function navigateTo(viewId, updateHash = true) {
  activeView = viewId;
  if (updateHash) {
    if (viewId === 'home') {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      window.location.hash = viewId;
    }
  }

  // Toggle active view screen
  document.querySelectorAll('.screen-view').forEach(el => {
    el.classList.remove('active');
  });
  const target = document.getElementById(`view-${viewId}`);
  if (target) target.classList.add('active');

  // Update Sidebar active state
  document.querySelectorAll('.side-nav .nav-item').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  // Update Mobile Nav active state
  document.querySelectorAll('.mobile-nav button').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.view === viewId);
  });

  // Update Topbar Breadcrumb Kicker
  const breadcrumb = document.getElementById('topbar-breadcrumb');
  if (breadcrumb) {
    const titles = {
      home: 'Your field notes',
      quest: 'Active Quest',
      scan: 'Field Guide Scanner',
      pokedex: 'My IRL Pokédex',
      adventures: 'Trail Log',
      profile: 'Field Kit & Settings'
    };
    breadcrumb.textContent = titles[viewId] || 'Your field notes';
  }

  // Handle camera lifecycle
  const video = document.getElementById('camera-preview-video');
  if (viewId === 'scan') {
    startCameraFeed();
  } else {
    scanner.stopCamera();
    if (video) video.style.display = 'none';
  }

  // Handle active quest timer
  if (viewId === 'quest') {
    startQuestTimerLoop();
  } else {
    clearInterval(questTimerInterval);
  }

  // Re-render specific view canvas or state
  if (viewId === 'adventures') {
    renderExplorationCanvas();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.navigateTo = navigateTo;

// Geolocation Tracking (Distance & Discovery coordinates)
function initGeolocationTracker() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    pos => {
      userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    },
    err => console.log('Location info:', err.message),
    { enableHighAccuracy: false, timeout: 6000 }
  );

  let lastCoord = null;
  navigator.geolocation.watchPosition(
    pos => {
      const current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      userCoords = current;

      if (lastCoord) {
        const km = calculateHaversineKm(lastCoord, current);
        if (km >= 0.004 && km <= 0.12) {
          const xpEvent = store.addWalkingDistance(km, current);
          if (xpEvent) showToast(`1 km walk logged · +${xpEvent.amount} XP`);
        }
      }
      lastCoord = current;
    },
    err => console.log('WatchPosition notice:', err.message),
    { enableHighAccuracy: true, maximumAge: 3000 }
  );
}

function calculateHaversineKm(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLon = (p2.lng - p1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Master Render
function renderAll() {
  renderHeader();
  renderHomeScreen();
  renderActiveQuestScreen();
  renderPokedexScreen();
  renderAdventuresScreen();
  renderProfileScreen();
}

// 1. Header & Sidebar Stats Render
function renderHeader() {
  const state = store.getState();
  const cityLabel = document.getElementById('sidebar-city-label');
  if (cityLabel) cityLabel.textContent = `${(state.currentLocationName || 'GURUGRAM').toUpperCase()}, IN`;

  const avatar = document.getElementById('btn-topbar-profile');
  const avatarLetters = document.getElementById('profile-avatar-letters');
  const initials = (state.name || 'AK').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatar) avatar.textContent = initials;
  if (avatarLetters) avatarLetters.textContent = initials;
}

// 2. Home Screen Render
function renderHomeScreen() {
  const state = store.getState();
  const lvl = store.getLevelInfo();
  
  // Level Panel
  document.getElementById('home-level-num').textContent = String(lvl.level).padStart(2, '0');
  document.getElementById('home-explorer-title').textContent = lvl.title;
  document.getElementById('home-xp-current-needed').textContent = `${lvl.totalXp} / 1,000 XP to Level ${lvl.level + 1}`;
  
  const progressPercent = Math.min(100, Math.round(lvl.progress * 100));
  document.getElementById('home-xp-progress').style.width = `${progressPercent}%`;
  document.getElementById('home-xp-to-next').textContent = `+${Math.max(0, 1000 - lvl.totalXp)} XP to next level`;

  // Render Quests List
  const container = document.getElementById('home-quests-container');
  container.innerHTML = '';

  const tones = ['sage', 'orange', 'lilac'];

  state.todayQuests.forEach((q, index) => {
    const isDone = q.status === 'done';
    const isActive = q.status === 'active';
    const tone = tones[index % tones.length];

    const card = document.createElement('article');
    card.className = `quest-card ${isActive ? 'is-started' : ''} ${isDone ? 'is-complete' : ''}`;

    let tagLabel = 'Observant';
    if (q.kind === 'walk') tagLabel = 'Wanderer';
    if (q.kind === 'observe') tagLabel = 'Attentive';

    card.innerHTML = `
      <div class="quest-index ${tone}">${String(index + 1).padStart(2, '0')}</div>
      <div class="quest-icon ${tone}">${isDone ? '✓' : q.emoji}</div>
      <div class="quest-main">
        <div class="quest-label-row">
          <span class="quest-label">${q.title.toUpperCase()}</span>
          <span class="quest-tag">${tagLabel}</span>
        </div>
        <h3>${q.title}</h3>
        <p>${q.description}</p>
        <div class="quest-foot">
          <span>⏱ ${q.minutes} min</span>
          <span class="xp-reward">⚡ +${q.xp} XP</span>
        </div>
      </div>
      <div class="quest-action">
        ${isDone ? `
          <span class="completed-mark">✓ Done</span>
        ` : isActive ? `
          <button class="button button-primary small btn-complete-quest" data-id="${q.id}">
            Mark complete ✓
          </button>
        ` : `
          <button class="quest-start btn-start-quest" data-id="${q.id}">
            Start ↗
          </button>
        `}
      </div>
    `;

    // Click handler on button or card
    const startBtn = card.querySelector('.btn-start-quest');
    if (startBtn) {
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.startQuest(q.id);
        showToast(`Quest started · ${q.minutes} min outside`);
        navigateTo('quest');
      });
    }

    const completeBtn = card.querySelector('.btn-complete-quest');
    if (completeBtn) {
      completeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const res = store.completeQuest(q.id);
        if (res?.xpEvent) {
          showToast(`Quest complete · +${q.xp} XP`);
          if (res.xpEvent.leveledUp) triggerConfetti();
        }
      });
    }

    card.addEventListener('click', () => {
      if (!isDone) {
        if (!isActive) store.startQuest(q.id);
        navigateTo('quest');
      }
    });

    container.appendChild(card);
  });
}

// 3. Active Quest Screen Render
function renderActiveQuestScreen() {
  const state = store.getState();
  const q = state.activeQuestData;

  if (!q) {
    if (activeView === 'quest') navigateTo('home');
    return;
  }

  document.getElementById('active-quest-emoji').textContent = q.emoji || '⚔️';
  document.getElementById('active-quest-title').textContent = q.title;
  document.getElementById('active-quest-desc').textContent = q.description;
  document.getElementById('active-quest-xp').textContent = `+${q.xp} XP`;
  document.getElementById('quest-budget-display').textContent = `Budget: ${q.minutes} min`;

  const walkCard = document.getElementById('quest-walk-progress-card');
  const actionBtn = document.getElementById('btn-quest-primary-action');

  if (q.kind === 'walk') {
    walkCard.style.display = 'block';
    const dist = q.distanceKm || 0;
    const target = q.targetKm || 1.0;
    document.getElementById('quest-walk-target-text').textContent = `${dist.toFixed(2)} / ${target.toFixed(2)} km`;
    document.getElementById('quest-walk-fill').style.width = `${Math.min(100, (dist / target) * 100)}%`;
    actionBtn.textContent = '📸 Scan Discovery on Walk';
  } else if (q.kind === 'scan') {
    walkCard.style.display = 'none';
    actionBtn.textContent = '📸 Open Field Guide Scanner';
  } else {
    walkCard.style.display = 'none';
    actionBtn.textContent = '✓ I Did It! (Mark Complete)';
  }
}

function startQuestTimerLoop() {
  clearInterval(questTimerInterval);
  const state = store.getState();
  const startedAt = state.activeQuestData ? state.activeQuestData.startedAt : Date.now();

  const update = () => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    const timerEl = document.getElementById('quest-timer-display');
    if (timerEl) timerEl.textContent = `${mm}:${ss}`;

    const distEl = document.getElementById('quest-distance-display');
    if (distEl && state.activeQuestData) {
      distEl.textContent = `${(state.activeQuestData.distanceKm || 0).toFixed(2)} km`;
    }
  };

  update();
  questTimerInterval = setInterval(update, 1000);
}

// 4. Scanner Lifecycle & Analysis
async function startCameraFeed() {
  const video = document.getElementById('camera-preview-video');
  const img = document.getElementById('captured-preview-img');
  const orbit = document.getElementById('scan-orbit-graphic');
  const instruction = document.getElementById('scan-instruction-text');
  const subcopy = document.getElementById('scan-subcopy-text');
  const emptyState = document.getElementById('scan-empty-state-view');
  const resultBox = document.getElementById('scan-active-result-box');

  img.style.display = 'none';
  resultBox.style.display = 'none';
  emptyState.style.display = 'block';
  orbit.style.display = 'grid';
  instruction.textContent = 'Place a find inside the frame';
  subcopy.textContent = 'Plants · birds · flowers · mushrooms · insects · rocks · other';
  video.style.display = 'block';

  try {
    await scanner.startCamera(video);
  } catch (err) {
    console.warn('Camera feed unavailable:', err.message);
  }
}

async function analyzeCapturedPhoto(dataUrl) {
  const video = document.getElementById('camera-preview-video');
  const img = document.getElementById('captured-preview-img');
  const orbit = document.getElementById('scan-orbit-graphic');
  const instruction = document.getElementById('scan-instruction-text');
  const subcopy = document.getElementById('scan-subcopy-text');
  const emptyState = document.getElementById('scan-empty-state-view');
  const resultBox = document.getElementById('scan-active-result-box');

  scanner.stopCamera();
  video.style.display = 'none';
  img.src = dataUrl;
  img.style.display = 'block';
  orbit.style.display = 'none';

  instruction.textContent = 'Analyzing leaves & textures…';
  subcopy.textContent = 'Field Guide AI is comparing field notes';

  emptyState.style.display = 'none';
  resultBox.style.display = 'block';
  resultBox.innerHTML = `
    <div class="result-card" style="text-align: center; padding: 32px 20px;">
      <div style="font-size: 32px; animation: rotate 4s linear infinite; display: inline-block;">🧭</div>
      <h3 style="font-family: 'Fraunces', serif; margin: 12px 0 6px;">Field Guide is searching…</h3>
      <p style="color: var(--muted); font-size: 12px;">Reading natural patterns against 100 species.</p>
    </div>
  `;

  currentCapturedPhoto = dataUrl;
  const state = store.getState();

  const res = await scanner.analyzePhoto(dataUrl, {
    aiSettings: state.aiSettings
  });

  currentScanAnalysis = res;
  instruction.textContent = 'Field Guide matched your find';
  subcopy.textContent = 'One possible story, never the only one';
  renderScanResult(res);
}

function renderScanResult(analysis) {
  const resultBox = document.getElementById('scan-active-result-box');
  const top = analysis.topCandidate;
  const cat = categoryMeta[top.category] || categoryMeta.other;
  const existing = store.getState().pokedex[top.id];

  if (analysis.status === 'identified') {
    // Confident Result
    resultBox.innerHTML = `
      <div class="result-card confident-result">
        <div class="result-top">
          <span class="result-state"><span class="confidence-dot"></span> IDENTIFIED / CONFIDENT</span>
          <span class="result-confidence">${top.confidence}% <small>confidence</small></span>
        </div>
        <div class="result-species">
          <div class="result-species-icon sage">🌳</div>
          <div>
            <h2>${top.name}</h2>
            <p>${top.scientific || ''}</p>
          </div>
        </div>
        <div class="result-details">
          <div><span class="eyebrow">CATEGORY</span><strong>${cat.singular}</strong></div>
          <div><span class="eyebrow">NATIVE REGION</span><strong>${top.region || 'Indian subcontinent'}</strong></div>
          <div><span class="eyebrow">FIELD NOTE</span><strong>${top.fact || 'Often recognized by its distinctive leaves.'}</strong></div>
        </div>
        <div class="result-disclaimer">
          <span>ℹ️</span>
          <span>Confidence is a guide, not a guarantee. Confirm what you can in a trusted field guide.</span>
        </div>
        <button class="button button-primary full" id="btn-add-pokedex">
          ${existing ? 'Already discovered · +5 XP' : 'Add to Pokédex · +50 XP'}
        </button>
      </div>
    `;

    document.getElementById('btn-add-pokedex').addEventListener('click', () => {
      confirmDiscovery(top);
    });

  } else {
    // Possible Match (Uncertainty visible)
    let candidatesHtml = '';
    analysis.candidates.forEach((c, idx) => {
      candidatesHtml += `
        <div class="match-row" data-idx="${idx}">
          <span class="match-rank">0${idx + 1}</span>
          <strong>${c.name}</strong>
          <span>${c.confidence}%</span>
          <div class="match-bar"><i style="width: ${c.confidence}%;"></i></div>
        </div>
      `;
    });

    if (analysis.otherPercentage > 0) {
      candidatesHtml += `
        <div class="match-row" style="cursor: default;">
          <span class="match-rank">03</span>
          <strong>Other natural species</strong>
          <span>${analysis.otherPercentage}%</span>
          <div class="match-bar"><i style="width: ${analysis.otherPercentage}%;"></i></div>
        </div>
      `;
    }

    resultBox.innerHTML = `
      <div class="result-card uncertain-result">
        <div class="result-top">
          <span class="result-state possible-state"><span class="confidence-dot"></span> POSSIBLE MATCH</span>
          <span class="result-confidence">${top.confidence}% <small>best guess</small></span>
        </div>
        <div class="possible-heading">
          <div class="result-species-icon lilac">✨</div>
          <div>
            <h2>A few stories fit.</h2>
            <p>The angle or light makes this one worth another look.</p>
          </div>
        </div>
        <div class="match-list">
          ${candidatesHtml}
        </div>
        <div class="result-disclaimer">
          <span>ℹ️</span>
          <span>Possible matches stay possible until you get a clearer view. Tap a match if you're sure.</span>
        </div>
        <button class="button button-outline full" id="btn-scan-retry">
          📷 Try another photo
        </button>
      </div>
    `;

    resultBox.querySelectorAll('.match-row[data-idx]').forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.dataset.idx, 10);
        confirmDiscovery(analysis.candidates[idx]);
      });
    });

    document.getElementById('btn-scan-retry').addEventListener('click', startCameraFeed);
  }
}

window.renderScanResult = renderScanResult;

function confirmDiscovery(candidate) {
  const result = store.addDiscovery({
    candidate,
    photoData: currentCapturedPhoto,
    locationName: store.getState().currentLocationName,
    coords: userCoords
  });

  if (result.isNew) {
    showToast(`Added to your Pokédex · +50 XP`);
    triggerConfetti();
  } else {
    showToast(`Already discovered · +5 XP for going back`);
  }

  navigateTo('pokedex');
}

// 5. Pokédex Screen Render
function renderPokedexScreen() {
  const state = store.getState();
  const entries = Object.values(state.pokedex);
  const total = entries.length;

  document.getElementById('dex-total-discovered').textContent = total;
  document.getElementById('dex-count-heading').textContent = total;
  document.getElementById('dex-progress-bar').style.width = `${Math.min(100, total)}%`;

  // Update Category Count Badges
  const counts = { plant: 0, bird: 0, insect: 0, flower: 0, other: 0 };
  entries.forEach(e => {
    if (counts[e.category] !== undefined) counts[e.category]++;
    else counts.other++;
  });

  const catMap = {
    'cat-count-plant': counts.plant,
    'cat-count-bird': counts.bird,
    'cat-count-insect': counts.insect,
    'cat-count-flower': counts.flower,
    'cat-count-other': counts.other
  };
  Object.entries(catMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });

  const grid = document.getElementById('pokedex-entries-grid');
  grid.innerHTML = '';

  let items = [];

  if (currentDexMode === 'mine') {
    items = entries.filter(e => currentDexCategory === 'all' || e.category === currentDexCategory);

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-discovery-card" style="grid-column: 1 / -1;">
          <div class="plus-ring">+</div>
          <strong>Something new is waiting.</strong>
          <p>Go outside and look for the detail you usually miss.</p>
        </div>
      `;
      return;
    }

    const tones = ['sage', 'sky', 'orange', 'pink', 'stone', 'mint'];

    items.forEach((e, idx) => {
      const tone = tones[idx % tones.length];
      const cat = categoryMeta[e.category] || categoryMeta.other;
      const card = document.createElement('article');
      card.className = 'discovery-card';
      card.innerHTML = `
        <div class="discovery-art ${tone}">
          ${e.photoData ? `<img src="${e.photoData}" alt="${e.name}">` : cat.emoji}
          <span class="discovery-rarity">${e.rarity ? '★'.repeat(e.rarity) : 'Common'}</span>
          ${e.count > 1 ? `<span class="discovery-count-badge">×${e.count}</span>` : ''}
        </div>
        <div class="discovery-content">
          <span class="quest-label">${cat.label}</span>
          <h3>${e.name}</h3>
          <p>${e.scientific || ''}</p>
          <div class="discovery-meta">
            <span>📍 ${e.place || 'Gurugram'}</span>
            <span>${new Date(e.firstSeen).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openSpeciesDetailSheet(e));
      grid.appendChild(card);
    });

    // Add empty placeholder card at end
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-discovery-card';
    emptyCard.innerHTML = `
      <div class="plus-ring">+</div>
      <strong>Something new is waiting.</strong>
      <p>Go outside and look for the detail you usually miss.</p>
    `;
    emptyCard.addEventListener('click', () => navigateTo('scan'));
    grid.appendChild(emptyCard);

  } else {
    // 100 Field Guide mode
    items = FIELD_GUIDE.filter(s => currentDexCategory === 'all' || s.category === currentDexCategory);

    items.forEach((s, idx) => {
      const found = state.pokedex[s.id];
      const cat = categoryMeta[s.category] || categoryMeta.other;
      const card = document.createElement('article');
      card.className = `discovery-card ${found ? '' : 'locked'}`;

      if (found) {
        card.innerHTML = `
          <div class="discovery-art sage">
            ${found.photoData ? `<img src="${found.photoData}" alt="${s.name}">` : cat.emoji}
            <span class="discovery-rarity">#${String(s.number).padStart(3, '0')}</span>
            ${found.count > 1 ? `<span class="discovery-count-badge">×${found.count}</span>` : ''}
          </div>
          <div class="discovery-content">
            <span class="quest-label">${cat.label}</span>
            <h3>${s.name}</h3>
            <p>${s.scientific}</p>
            <div class="discovery-meta">
              <span>📍 ${found.place || 'Discovered'}</span>
              <span>${'★'.repeat(s.rarity)}</span>
            </div>
          </div>
        `;
        card.addEventListener('click', () => openSpeciesDetailSheet(found));
      } else {
        card.innerHTML = `
          <div class="discovery-art" style="background: #eef1ea; opacity: 0.6;">
            <span style="opacity: 0.3;">${cat.emoji}</span>
            <span class="discovery-rarity">#${String(s.number).padStart(3, '0')}</span>
          </div>
          <div class="discovery-content">
            <span class="quest-label">${cat.label}</span>
            <h3 style="color: var(--muted);">???</h3>
            <p>${s.region || 'Wild'}</p>
            <div class="discovery-meta">
              <span>Rarity: ${'★'.repeat(s.rarity)}</span>
              <span>Unfound</span>
            </div>
          </div>
        `;
      }
      grid.appendChild(card);
    });
  }
}

function openSpeciesDetailSheet(entry) {
  const sheet = document.getElementById('species-detail-sheet');
  const content = document.getElementById('sheet-species-content');
  const cat = categoryMeta[entry.category] || categoryMeta.other;

  content.innerHTML = `
    <div style="display: flex; gap: 18px; align-items: flex-start; margin-bottom: 20px;">
      <div class="quest-icon sage" style="font-size: 32px; width: 64px; height: 64px;">
        ${cat.emoji}
      </div>
      <div>
        <span class="eyebrow" style="color: var(--sage);">${cat.label}</span>
        <h2 style="font-family: 'Fraunces', serif; font-size: 26px; margin: 4px 0 2px;">${entry.name}</h2>
        <div style="font-style: italic; color: var(--muted); font-size: 13px;">${entry.scientific || ''}</div>
      </div>
    </div>

    ${entry.photoData ? `
      <div style="width: 100%; height: 200px; border-radius: 12px; overflow: hidden; margin-bottom: 18px; border: 1px solid var(--rule);">
        <img src="${entry.photoData}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    ` : ''}

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 18px;">
      <div style="border: 1px solid var(--rule); border-radius: 9px; padding: 12px; background: rgba(255,255,255,0.4);">
        <span class="eyebrow" style="font-size: 9px;">DISCOVERED</span>
        <div style="font-weight: 700; margin-top: 4px;">${new Date(entry.firstSeen).toLocaleDateString()}</div>
      </div>
      <div style="border: 1px solid var(--rule); border-radius: 9px; padding: 12px; background: rgba(255,255,255,0.4);">
        <span class="eyebrow" style="font-size: 9px;">LOCATION</span>
        <div style="font-weight: 700; margin-top: 4px;">${entry.place || 'Gurugram'}</div>
      </div>
      <div style="border: 1px solid var(--rule); border-radius: 9px; padding: 12px; background: rgba(255,255,255,0.4);">
        <span class="eyebrow" style="font-size: 9px;">SIGHTINGS</span>
        <div style="font-weight: 700; margin-top: 4px;">${entry.count || 1} time(s)</div>
      </div>
      <div style="border: 1px solid var(--rule); border-radius: 9px; padding: 12px; background: rgba(255,255,255,0.4);">
        <span class="eyebrow" style="font-size: 9px;">RARITY</span>
        <div style="font-weight: 700; margin-top: 4px; color: var(--orange);">${'★'.repeat(entry.rarity || 1)}</div>
      </div>
    </div>

    ${entry.fact ? `
      <div style="border: 1px solid var(--rule); border-radius: 9px; padding: 14px; background: #edf2ea; font-size: 13px; line-height: 1.6;">
        💡 <strong>Field Note:</strong> ${entry.fact}
      </div>
    ` : ''}
  `;

  sheet.classList.add('open');
}

// 6. Adventure History Screen Render
function renderAdventuresScreen() {
  const state = store.getState();
  const days = Object.entries(state.history || {});

  const totals = days.reduce((acc, [, d]) => {
    acc.km += d.distanceKm || 0;
    acc.min += d.minutes || 0;
    acc.disc += d.discoveries || 0;
    acc.quests += d.questsCompleted || 0;
    return acc;
  }, { km: 0, min: 0, disc: 0, quests: 0 });

  document.getElementById('adv-stat-km').textContent = totals.km.toFixed(1);
  document.getElementById('adv-stat-min').textContent = `${Math.floor(totals.min / 60)}h ${totals.min % 60}m`;
  document.getElementById('adv-stat-finds').textContent = totals.disc;

  const timeline = document.getElementById('adventures-timeline-container');
  timeline.innerHTML = '';

  days.sort(([a], [b]) => b.localeCompare(a));

  const tones = ['orange', 'sage', 'lilac'];

  days.forEach(([dateKey, d], index) => {
    const tone = tones[index % tones.length];
    const row = document.createElement('article');
    row.className = 'outing-row';
    row.innerHTML = `
      <div class="outing-date">
        <strong>${formatDateKey(dateKey)}</strong>
        <span>${formatDayBadge(dateKey)}</span>
      </div>
      <div class="outing-marker ${tone}">👣</div>
      <div class="outing-stats">
        <div><span class="eyebrow">DISTANCE</span><strong>${d.distanceKm.toFixed(1)} km</strong></div>
        <div><span class="eyebrow">TIME OUTSIDE</span><strong>${d.minutes} min</strong></div>
        <div><span class="eyebrow">FIELD NOTES</span><strong>${d.discoveries} discoveries</strong></div>
        <div><span class="eyebrow">QUESTS</span><strong>${d.questsCompleted} quests</strong></div>
      </div>
      <span class="row-chevron">›</span>
    `;
    timeline.appendChild(row);
  });
}

function formatDateKey(k) {
  const d = new Date(k + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

function formatDayBadge(k) {
  const todayKey = new Date().toISOString().split('T')[0];
  const yesterdayKey = new Date(Date.now() - 864e5).toISOString().split('T')[0];
  if (k === todayKey) return 'TODAY';
  if (k === yesterdayKey) return 'YESTERDAY';
  const d = new Date(k + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long' }).toUpperCase();
}

// 7. Exploration Map Canvas Renderer
function renderExplorationCanvas() {
  const canvas = document.getElementById('exploration-canvas');
  if (!canvas) return;

  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * (window.devicePixelRatio || 1);
  canvas.height = rect.height * (window.devicePixelRatio || 1);
  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  const w = rect.width;
  const h = rect.height;

  // Background radar
  ctx.fillStyle = '#11221a';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(247, 245, 239, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 30; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 30; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const cx = w / 2;
  const cy = h / 2;

  // Concentric radar rings
  [40, 80, 120].forEach(r => {
    ctx.strokeStyle = 'rgba(242, 143, 59, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // User center dot
  ctx.fillStyle = '#f28f3b';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Plot discovery emojis
  const entries = Object.values(store.getState().pokedex);
  entries.forEach((e, idx) => {
    const angle = (idx * 1.618) * Math.PI * 2;
    const dist = 32 + ((idx * 16) % (Math.min(cx, cy) - 36));
    const px = cx + Math.cos(angle) * dist;
    const py = cy + Math.sin(angle) * dist;

    ctx.strokeStyle = 'rgba(124, 242, 154, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(px, py);
    ctx.stroke();

    const cat = categoryMeta[e.category] || categoryMeta.other;
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cat.emoji, px, py);
  });
}

// 8. Profile Screen Render
function renderProfileScreen() {
  const state = store.getState();
  const lvl = store.getLevelInfo();

  const nameInput = document.getElementById('profile-name-input');
  if (nameInput && nameInput.value !== state.name) {
    nameInput.value = state.name || 'Arjun K.';
  }

  document.getElementById('profile-stat-xp').textContent = lvl.totalXp;
  document.getElementById('profile-stat-discoveries').textContent = Object.keys(state.pokedex).length;
  document.getElementById('profile-device-id').textContent = getAnonymousDeviceId();

  const cfg = getSupabaseConfig();
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  if (urlInput && !urlInput.value) urlInput.value = cfg.url || '';
  if (keyInput && !keyInput.value) keyInput.value = cfg.key || '';

  // Google Gemma & AI Engine Configuration
  const engineSelect = document.getElementById('ai-engine-select');
  const ollamaGroup = document.getElementById('ai-ollama-group');
  const googleApiGroup = document.getElementById('ai-google-api-group');
  const ollamaUrlInput = document.getElementById('ai-ollama-url');
  const gemmaModelInput = document.getElementById('ai-gemma-model');

  const curMode = state.aiSettings?.mode || 'offline';
  if (engineSelect && !engineSelect.dataset.userEdited) {
    engineSelect.value = curMode;
  }
  const effectiveMode = engineSelect ? engineSelect.value : curMode;
  if (ollamaGroup) ollamaGroup.style.display = effectiveMode === 'gemma-local' ? 'block' : 'none';
  if (googleApiGroup) googleApiGroup.style.display = effectiveMode === 'google-api' ? 'block' : 'none';
  if (ollamaUrlInput && !ollamaUrlInput.value) ollamaUrlInput.value = state.aiSettings?.ollamaUrl || 'http://localhost:11434';
  if (gemmaModelInput && !gemmaModelInput.value) gemmaModelInput.value = state.aiSettings?.gemmaModel || 'gemma2:2b';
}

// Event Bindings
function bindEventHandlers() {
  // Navigation Tabs (Sidebar + Mobile Bottom Dock)
  document.querySelectorAll('.side-nav .nav-item, .mobile-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.view);
    });
  });

  // Topbar Profile Avatar
  const avatarBtn = document.getElementById('btn-topbar-profile');
  if (avatarBtn) avatarBtn.addEventListener('click', () => navigateTo('profile'));

  // Home Intro Scan Button
  const homeScan = document.getElementById('btn-home-scan-find');
  if (homeScan) homeScan.addEventListener('click', () => navigateTo('scan'));

  // Active Quest: Back Button
  const questBack = document.getElementById('btn-quest-back');
  if (questBack) questBack.addEventListener('click', () => navigateTo('home'));

  // Active Quest: Primary Action
  const questAction = document.getElementById('btn-quest-primary-action');
  if (questAction) {
    questAction.addEventListener('click', () => {
      const state = store.getState();
      const q = state.activeQuestData;
      if (!q) return;

      if (q.kind === 'observe') {
        const res = store.completeQuest(q.id);
        if (res?.xpEvent) {
          showToast(`Quest complete · +${q.xp} XP`);
          if (res.xpEvent.leveledUp) triggerConfetti();
        }
        navigateTo('home');
      } else {
        navigateTo('scan');
      }
    });
  }

  // Active Quest: Demo Walk Button
  const demoWalk = document.getElementById('btn-quest-demo-walk');
  if (demoWalk) {
    demoWalk.addEventListener('click', () => {
      const xpEvent = store.addWalkingDistance(0.1, userCoords);
      if (xpEvent) showToast(`1 km walk logged · +${xpEvent.amount} XP`);
    });
  }

  // Active Quest: Abandon Button
  const questAbandon = document.getElementById('btn-quest-abandon');
  if (questAbandon) {
    questAbandon.addEventListener('click', () => {
      store.abandonQuest();
      showToast('Quest abandoned');
      navigateTo('home');
    });
  }

  // Small Wins: Daily Challenge
  const challengeBtn = document.getElementById('btn-action-daily-challenge');
  if (challengeBtn) {
    challengeBtn.addEventListener('click', () => {
      if (store.getState().dailyBonusClaimed) return;
      store.state.dailyBonusClaimed = true;
      const res = store.awardXp(XP_RULES.DAILY_CHALLENGE, 'Daily challenge logged', '🏆');
      showToast('Daily challenge logged · +50 XP');
      document.getElementById('status-daily-challenge').textContent = 'Logged ✓';
      challengeBtn.classList.add('is-done');
      if (res.leveledUp) triggerConfetti();
    });
  }

  // Small Wins: Walk 1 km
  const walkKmBtn = document.getElementById('btn-action-walk-km');
  if (walkKmBtn) {
    walkKmBtn.addEventListener('click', () => {
      const res = store.awardXp(20, '1 km walk logged', '👣');
      showToast('1 km walk logged · +20 XP');
      document.getElementById('status-walk-km').textContent = 'Logged ✓';
      walkKmBtn.classList.add('is-done');
      if (res.leveledUp) triggerConfetti();
    });
  }

  // Scanner: Snap Camera Photo
  const snapBtn = document.getElementById('btn-snap-camera');
  if (snapBtn) {
    snapBtn.addEventListener('click', () => {
      const video = document.getElementById('camera-preview-video');
      const photoData = scanner.captureSnapshot(video);
      analyzeCapturedPhoto(photoData);
    });
  }

  // Scanner: File Upload
  const fileInput = document.getElementById('input-file-photo');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        analyzeCapturedPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  // Scanner: Try low-confidence example
  const demoUncertain = document.getElementById('btn-demo-uncertain');
  if (demoUncertain) {
    demoUncertain.addEventListener('click', () => {
      const mockResult = {
        status: 'possible',
        candidates: [
          { name: 'Indian Banyan', scientific: 'Ficus benghalensis', category: 'plant', confidence: 71, rarity: 3 },
          { name: 'Peepal Tree', scientific: 'Ficus religiosa', category: 'plant', confidence: 19, rarity: 2 },
        ],
        topCandidate: { name: 'Indian Banyan', scientific: 'Ficus benghalensis', category: 'plant', confidence: 71, rarity: 3 },
        otherPercentage: 10
      };
      document.getElementById('scan-empty-state-view').style.display = 'none';
      document.getElementById('scan-active-result-box').style.display = 'block';
      renderScanResult(mockResult);
      showToast('Field Guide found a few possible matches');
    });
  }

  // Pokédex: Category filters
  document.querySelectorAll('#dex-category-filters .cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#dex-category-filters .cat-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDexCategory = btn.dataset.cat;
      renderPokedexScreen();
    });
  });

  // Pokédex: Mode toggle (Mine vs Field Guide)
  const modeMine = document.getElementById('btn-dex-mode-mine');
  const modeGuide = document.getElementById('btn-dex-mode-guide');
  if (modeMine && modeGuide) {
    modeMine.addEventListener('click', () => {
      modeMine.classList.add('active');
      modeGuide.classList.remove('active');
      currentDexMode = 'mine';
      renderPokedexScreen();
    });
    modeGuide.addEventListener('click', () => {
      modeGuide.classList.add('active');
      modeMine.classList.remove('active');
      currentDexMode = 'guide';
      renderPokedexScreen();
    });
  }

  // Species Detail Sheet Close
  const closeSheet = document.getElementById('btn-close-sheet');
  if (closeSheet) {
    closeSheet.addEventListener('click', () => {
      document.getElementById('species-detail-sheet').classList.remove('open');
    });
  }

  // Profile: Name Edit
  const nameInput = document.getElementById('profile-name-input');
  if (nameInput) {
    nameInput.addEventListener('change', () => {
      store.updateProfile({ name: nameInput.value.trim() || 'Arjun K.' });
      showToast('Profile name updated');
    });
  }

  // Profile: Supabase Save & Connect
  const saveSupabase = document.getElementById('btn-save-supabase');
  if (saveSupabase) {
    saveSupabase.addEventListener('click', async () => {
      const url = document.getElementById('supabase-url-input').value.trim();
      const key = document.getElementById('supabase-key-input').value.trim();
      const msg = document.getElementById('supabase-connect-msg');
      msg.style.display = 'block';
      msg.style.color = 'var(--muted)';
      msg.textContent = 'Testing connection…';

      try {
        await testSupabaseConnection(url, key);
        saveSupabaseConfig({ url, key, enabled: true });
        msg.style.color = 'var(--sage)';
        msg.textContent = '✅ Connected to Supabase! Anonymous sync active.';
        showToast('Supabase cloud sync active');
        store.save();
      } catch (err) {
        msg.style.color = 'var(--orange)';
        msg.textContent = 'Connection test failed: ' + (err.message || 'Check URL/Key');
      }
    });
  }

  // Profile: Copy SQL Schema
  const copySql = document.getElementById('btn-copy-sql-schema');
  if (copySql) {
    copySql.addEventListener('click', () => {
      navigator.clipboard.writeText(SUPABASE_SETUP_SQL).then(() => {
        showToast('SQL Schema copied to clipboard');
      });
    });
  }

  // Profile: Reset data
  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all local exploration progress?')) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  // Profile: AI Engine Select change
  const engineSelect = document.getElementById('ai-engine-select');
  const ollamaGroup = document.getElementById('ai-ollama-group');
  const googleApiGroup = document.getElementById('ai-google-api-group');
  if (engineSelect) {
    engineSelect.addEventListener('change', () => {
      engineSelect.dataset.userEdited = 'true';
      if (ollamaGroup) ollamaGroup.style.display = engineSelect.value === 'gemma-local' ? 'block' : 'none';
      if (googleApiGroup) googleApiGroup.style.display = engineSelect.value === 'google-api' ? 'block' : 'none';
    });
  }

  // Profile: Save AI Settings
  const saveAiBtn = document.getElementById('btn-save-ai-config');
  if (saveAiBtn) {
    saveAiBtn.addEventListener('click', () => {
      const mode = document.getElementById('ai-engine-select')?.value || 'offline';
      const ollamaUrl = document.getElementById('ai-ollama-url')?.value.trim() || 'http://localhost:11434';
      const gemmaModel = document.getElementById('ai-gemma-model')?.value.trim() || 'gemma2:2b';
      store.updateProfile({
        aiSettings: {
          mode,
          enabled: mode !== 'offline',
          ollamaUrl,
          gemmaModel
        }
      });

      const statusEl = document.getElementById('ai-test-status');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.color = 'var(--sage)';
        const label = mode === 'gemma-local' 
          ? `Local Gemma (${gemmaModel})` 
          : mode === 'google-api' 
            ? 'Google AI Studio API' 
            : 'Built-in Field Guide (Offline)';
        statusEl.textContent = `✅ Saved: Active engine is ${label}.`;
      }
      showToast('AI engine settings saved');
    });
  }

  // Profile: Test AI Connection
  const testAiBtn = document.getElementById('btn-test-ai-config');
  if (testAiBtn) {
    testAiBtn.addEventListener('click', async () => {
      const mode = document.getElementById('ai-engine-select')?.value || 'offline';
      const statusEl = document.getElementById('ai-test-status');
      if (!statusEl) return;
      statusEl.style.display = 'block';

      if (mode === 'offline') {
        statusEl.style.color = 'var(--sage)';
        statusEl.textContent = '✅ Built-in Field Guide offline taxonomy engine is ready (100 curated species).';
        return;
      }

      if (mode === 'gemma-local') {
        const rawUrl = document.getElementById('ai-ollama-url')?.value.trim() || 'http://localhost:11434';
        const ollamaUrl = rawUrl.replace(/\/$/, '');
        const model = document.getElementById('ai-gemma-model')?.value.trim() || 'gemma2:2b';
        statusEl.style.color = 'var(--muted)';
        statusEl.textContent = `Connecting to Ollama at ${ollamaUrl}…`;
        try {
          const res = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const hasModel = data.models?.some(m => m.name.includes(model.split(':')[0]));
          statusEl.style.color = 'var(--sage)';
          statusEl.textContent = `✅ Ollama reachable! ${hasModel ? 'Model "' + model + '" found ready.' : 'Note: run "ollama run ' + model + '" in terminal.'}`;
        } catch (err) {
          statusEl.style.color = 'var(--orange)';
          statusEl.textContent = `⚠️ Cannot reach Ollama at ${ollamaUrl}. Ensure "ollama serve" is running (or set OLLAMA_ORIGINS="*" if CORS blocked).`;
        }
        return;
      }

      if (mode === 'google-api') {
        statusEl.style.color = 'var(--muted)';
        statusEl.textContent = 'Checking the managed AI service…';
        try {
          const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operation: 'health' })
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          statusEl.style.color = 'var(--sage)';
          statusEl.textContent = '✅ Managed Google AI service is ready.';
        } catch (err) {
          statusEl.style.color = 'var(--orange)';
          statusEl.textContent = `⚠️ API Key check failed: ${err.message}`;
        }
      }
    });
  }

  // PWA Install Modal
  const installBtn = document.getElementById('btn-install-pwa');
  const installModal = document.getElementById('install-modal-backdrop');
  const closeInstall = document.getElementById('btn-close-install-modal');
  const confirmInstall = document.getElementById('btn-confirm-install');
  if (installBtn && installModal) {
    installBtn.addEventListener('click', () => installModal.style.display = 'grid');
    closeInstall.addEventListener('click', () => installModal.style.display = 'none');
    confirmInstall.addEventListener('click', () => installModal.style.display = 'none');
  }

  // Toast Dismiss
  const toastDismiss = document.getElementById('btn-toast-dismiss');
  if (toastDismiss) {
    toastDismiss.addEventListener('click', () => {
      document.getElementById('toast-notification').style.display = 'none';
    });
  }
}

async function refreshQuests() {
  const state = store.getState();
  const res = await generateDailyQuests({
    interests: state.interests,
    minutes: state.minutesAvailable,
    locationName: state.currentLocationName,
    aiSettings: state.aiSettings
  });
  store.setTodayQuests(res.quests);
}

// Toast Feedback Notification
function showToast(message) {
  const toast = document.getElementById('toast-notification');
  const text = document.getElementById('toast-message-text');
  if (!toast || !text) return;

  text.textContent = message;
  toast.style.display = 'flex';

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.style.display = 'none';
  }, 3600);
}

// Level-up celebration confetti
function triggerConfetti() {
  if (window.confetti) {
    window.confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f28f3b', '#57715a', '#172a3a', '#f7f5ef']
    });
  }
}
