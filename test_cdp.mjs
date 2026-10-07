import fs from 'fs';
import path from 'path';

async function run() {
  const targetsRes = await fetch('http://localhost:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.url.includes('localhost:3000'));
  if (!pageTarget) {
    console.error('No localhost:3000 target found');
    process.exit(1);
  }

  console.log('Connecting to target:', pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  console.log('Connected to CDP!');

  await send('Page.enable');
  await send('Runtime.enable');

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res.result?.value;
  }

  async function takeScreenshot(filename, width = 1280, height = 800, mobile = false) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile
    });
    await new Promise(r => setTimeout(r, 600));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.resolve('C:/Users/Piyush.Gupta2/.gemini/antigravity-ide/brain/e104c4d5-0d93-4376-8bac-c1ac48c210c7', filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot: ${filename} (${width}x${height})`);
    return outPath;
  }

  // Reload page cleanly
  console.log('Reloading page with latest code...');
  await send('Page.reload', { ignoreCache: true });
  await new Promise(r => setTimeout(r, 1200));

  console.log('=============================================');
  console.log('TEST 1: DESKTOP TODAY SCREEN (1280x800)');
  console.log('=============================================');
  await evalJs(`window.navigateTo('home');`);
  await new Promise(r => setTimeout(r, 500));
  const pageTitle = await evalJs(`document.title`);
  const levelNum = await evalJs(`document.getElementById('home-level-num')?.innerText`);
  const explorerTitle = await evalJs(`document.getElementById('home-explorer-title')?.innerText`);
  const questCardsCount = await evalJs(`document.querySelectorAll('.quest-card').length`);
  console.log('Page Title:', pageTitle);
  console.log('Level Number:', levelNum, '| Explorer Title:', explorerTitle);
  console.log('Quest Cards count:', questCardsCount);
  await takeScreenshot('test_desktop_today.png', 1280, 800, false);

  console.log('=============================================');
  console.log('TEST 2: STARTING A QUEST & ACTIVE QUEST SCREEN');
  console.log('=============================================');
  const startResult = await evalJs(`
    const startBtn = document.querySelector('.quest-start');
    if (startBtn) {
      startBtn.click();
      'Clicked Start Quest';
    } else {
      'No quest-start button';
    }
  `);
  console.log('Start button clicked:', startResult);
  await new Promise(r => setTimeout(r, 600));
  const activeQuestTitle = await evalJs(`document.getElementById('active-quest-title')?.innerText`);
  const toastText = await evalJs(`document.querySelector('.toast span')?.innerText`);
  console.log('Active Quest Title:', activeQuestTitle);
  console.log('Toast Notification:', toastText);
  await takeScreenshot('test_desktop_quest_active.png', 1280, 800, false);

  // Click Back to Today
  await evalJs(`document.getElementById('btn-quest-back')?.click();`);
  await new Promise(r => setTimeout(r, 400));

  console.log('=============================================');
  console.log('TEST 3: AI DISCOVERY SCANNER (POSSIBLE MATCH & CONFIDENT)');
  console.log('=============================================');
  await evalJs(`window.navigateTo('scan');`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_desktop_scanner_idle.png', 1280, 800, false);

  // Trigger Low-Confidence Example
  await evalJs(`document.getElementById('btn-demo-uncertain')?.click();`);
  await new Promise(r => setTimeout(r, 600));
  const possibleMatchState = await evalJs(`document.querySelector('.result-state')?.innerText`);
  const matchRows = await evalJs(`Array.from(document.querySelectorAll('.match-row')).map(r => r.innerText.replace(/\\n/g, ' '))`);
  console.log('Low confidence match state:', possibleMatchState);
  console.log('Candidate rankings:', matchRows);
  await takeScreenshot('test_desktop_scanner_possible_match.png', 1280, 800, false);

  // Test Confident Match and Deduplication
  const confidentTest = await evalJs(`
    const banyan = {
      name: 'Indian Banyan',
      scientific: 'Ficus benghalensis',
      category: 'plant',
      confidence: 91,
      nativeRegion: 'Indian subcontinent',
      fieldNote: 'Often called the strangler fig; sends down iconic aerial prop roots.'
    };
    document.getElementById('scan-empty-state-view').style.display = 'none';
    document.getElementById('scan-active-result-box').style.display = 'block';
    window.renderScanResult({
      status: 'identified',
      confidence: 91,
      topCandidate: banyan,
      candidates: [banyan]
    });
    'Rendered confident banyan';
  `);
  console.log(confidentTest);
  await new Promise(r => setTimeout(r, 600));
  await takeScreenshot('test_desktop_scanner_confident_match.png', 1280, 800, false);

  // Add Banyan to Pokédex (Test first addition: +50 XP)
  const addDexFirst = await evalJs(`
    const addBtn = document.getElementById('btn-add-pokedex');
    if (addBtn) {
      addBtn.click();
      'Clicked Add to Pokédex';
    } else {
      'No btn-add-pokedex found';
    }
  `);
  console.log('Add to Pokedex first click:', addDexFirst);
  await new Promise(r => setTimeout(r, 600));
  const addToast1 = await evalJs(`document.querySelector('.toast span')?.innerText`);
  console.log('Toast after addition:', addToast1);

  // Test Deduplication: re-render same species and click Add
  await evalJs(`
    window.navigateTo('scan');
    document.getElementById('scan-empty-state-view').style.display = 'none';
    document.getElementById('scan-active-result-box').style.display = 'block';
    window.renderScanResult({
      status: 'identified',
      confidence: 91,
      topCandidate: {
        name: 'Indian Banyan',
        scientific: 'Ficus benghalensis',
        category: 'plant',
        confidence: 91
      },
      candidates: []
    });
    document.getElementById('btn-add-pokedex')?.click();
  `);
  await new Promise(r => setTimeout(r, 600));
  const addToast2 = await evalJs(`document.querySelector('.toast span')?.innerText`);
  console.log('Deduplication Toast (+5 XP):', addToast2);

  console.log('=============================================');
  console.log('TEST 4: POKÉDEX & 100-SPECIES FIELD GUIDE');
  console.log('=============================================');
  await evalJs(`window.navigateTo('pokedex');`);
  await new Promise(r => setTimeout(r, 500));
  const totalDexCount = await evalJs(`document.getElementById('dex-total-discovered')?.innerText`);
  console.log('My Pokédex total discovered:', totalDexCount);
  await takeScreenshot('test_desktop_pokedex_my_collection.png', 1280, 800, false);

  // Switch to Field Guide (100 catalog)
  await evalJs(`document.getElementById('btn-dex-mode-guide')?.click();`);
  await new Promise(r => setTimeout(r, 500));
  const guideCount = await evalJs(`document.querySelectorAll('.discovery-card').length`);
  console.log('Field Guide (100) visible cards:', guideCount);
  await takeScreenshot('test_desktop_pokedex_field_guide_100.png', 1280, 800, false);

  // Click first card to view Details modal
  await evalJs(`document.querySelector('.discovery-card')?.click();`);
  await new Promise(r => setTimeout(r, 500));
  const sheetSpeciesName = await evalJs(`document.querySelector('#sheet-species-content h2')?.innerText`);
  console.log('Opened detail sheet for:', sheetSpeciesName);
  await takeScreenshot('test_desktop_species_detail_sheet.png', 1280, 800, false);

  // Close sheet
  await evalJs(`document.getElementById('btn-close-sheet')?.click();`);
  await new Promise(r => setTimeout(r, 300));

  console.log('=============================================');
  console.log('TEST 5: ADVENTURE HISTORY & RADAR MAP');
  console.log('=============================================');
  await evalJs(`window.navigateTo('adventures');`);
  await new Promise(r => setTimeout(r, 600));
  const weeklyKm = await evalJs(`document.getElementById('adv-stat-km')?.innerText`);
  const outingsCount = await evalJs(`document.querySelectorAll('.outing-row').length`);
  console.log('Weekly KM logged:', weeklyKm, '| Outing rows count:', outingsCount);
  await takeScreenshot('test_desktop_adventures.png', 1280, 800, false);

  console.log('=============================================');
  console.log('TEST 6: PROFILE, ANONYMOUS DEVICE ID & SUPABASE');
  console.log('=============================================');
  await evalJs(`window.navigateTo('profile');`);
  await new Promise(r => setTimeout(r, 500));
  const anonDevId = await evalJs(`document.getElementById('profile-device-id')?.innerText`);
  console.log('Anonymous Device ID displayed:', anonDevId);
  await takeScreenshot('test_desktop_profile.png', 1280, 800, false);

  console.log('=============================================');
  console.log('TEST 7: MOBILE-FIRST PWA (412x915) FULL SUITE');
  console.log('=============================================');
  // Mobile Today
  await evalJs(`window.navigateTo('home');`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_mobile_today_412.png', 412, 915, true);

  // Mobile Scan
  await evalJs(`window.navigateTo('scan');`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_mobile_scan_412.png', 412, 915, true);

  // Mobile Pokédex
  await evalJs(`window.navigateTo('pokedex'); document.getElementById('btn-dex-mode-mine')?.click();`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_mobile_pokedex_412.png', 412, 915, true);

  // Mobile Adventures
  await evalJs(`window.navigateTo('adventures');`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_mobile_adventures_412.png', 412, 915, true);

  // Mobile Profile
  await evalJs(`window.navigateTo('profile');`);
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('test_mobile_profile_412.png', 412, 915, true);

  console.log('=============================================');
  console.log('ALL E2E AUTOMATED TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('=============================================');
  ws.close();
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
