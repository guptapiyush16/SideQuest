// WildDex — Game State & Local-First Storage
// Orchestrates XP, Pokédex Deduplication, Quests, Adventures and Cloud Syncing

import { speciesKey, findFieldGuideMatch, normalizeCategory } from './fieldGuide.js';
import { 
  syncProfile, 
  syncPokedexEntry, 
  syncQuest, 
  syncAdventure, 
  fetchRemoteUserData,
  isCloudSyncActive 
} from './supabaseClient.js';

const STORAGE_KEY = 'wilddex_state_v1';
const LEGACY_STORAGE_KEY = 'sidequest_irl_state_v1';

export const XP_RULES = {
  NEW_SPECIES: 50,
  DUPLICATE_SPECIES: 5,
  DAILY_CHALLENGE: 50,
  WALK_PER_KM: 20
};

const EXPLORER_TITLES = [
  'Wanderer', 'Junior Scout', 'Field Scout', 'Trail Explorer',
  'Pathfinder', 'Wild Naturalist', 'Forest Ranger', 'Terrain Master',
  'Flora & Fauna Sage', 'Apex Trailblazer', 'Legendary Naturalist'
];

export function levelFromXp(xp = 0) {
  let level = 1;
  let remaining = xp;
  let needed = 200; // Level 1 -> 200 XP

  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = 100 + level * 100; // 300, 400, 500, etc.
  }

  const titleIndex = Math.min(Math.max(0, level - 1), EXPLORER_TITLES.length - 1);
  return {
    level,
    current: remaining,
    needed,
    progress: needed > 0 ? remaining / needed : 0,
    title: EXPLORER_TITLES[titleIndex],
    totalXp: xp
  };
}

export function getTodayKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export class GameStore {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadInitialState();
    this.resetDailyStateIfNeeded();
  }

  resetDailyStateIfNeeded() {
    const today = getTodayKey();
    if (this.state.todayQuestsDate === today) return;
    this.state.todayQuests = [];
    this.state.todayQuestsDate = today;
    this.state.activeQuestId = null;
    this.state.activeQuestData = null;
    this.state.dailyBonusClaimed = false;
    this.state.walkBonusClaimed = false;
    this.save();
  }

  loadInitialState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          name: parsed.name || 'Piyush',
          xp: parsed.xp || 0,
          pokedex: parsed.pokedex || {},
          todayQuests: parsed.todayQuests || [],
          todayQuestsDate: parsed.todayQuestsDate || null,
          activeQuestId: parsed.activeQuestId || null,
          activeQuestData: parsed.activeQuestData || null,
          history: parsed.history || {},
          interests: parsed.interests || ['🌳 Trees', '🐦 Birds', '🚶 Walking'],
          minutesAvailable: parsed.minutesAvailable || 30,
          aiSettings: {
            mode: 'google-api',
            enabled: true
          },
          onboarded: parsed.onboarded !== undefined ? parsed.onboarded : true,
          dailyBonusClaimed: parsed.dailyBonusClaimed || false,
          walkBonusClaimed: parsed.walkBonusClaimed || false,
          currentLocationName: parsed.currentLocationName || 'Gurugram'
        };
      }
    } catch (e) {
      console.warn('Could not read state, starting fresh:', e);
    }

    return {
      name: 'Explorer',
      xp: 0,
      pokedex: {},
      todayQuests: [],
      todayQuestsDate: null,
      activeQuestId: null,
      activeQuestData: null,
      history: {},
      interests: ['🌳 Trees', '🐦 Birds', '🚶 Walking'],
      minutesAvailable: 30,
      aiSettings: {
        mode: 'google-api',
        enabled: true
      },
      onboarded: false,
      dailyBonusClaimed: false,
      walkBonusClaimed: false,
      currentLocationName: 'Local Trail'
    };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    this.notify();
  }

  resetToEmpty() {
    this.state = this.loadInitialState();
    this.state.name = 'Explorer';
    this.state.xp = 0;
    this.state.pokedex = {};
    this.state.todayQuests = [];
    this.state.activeQuestId = null;
    this.state.activeQuestData = null;
    this.state.history = {};
    this.state.dailyBonusClaimed = false;
    this.state.walkBonusClaimed = false;
    this.save();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  getState() {
    return this.state;
  }

  getLevelInfo() {
    return levelFromXp(this.state.xp);
  }

  // --- XP & REWARDS ---
  awardXp(amount, reason, emoji = '⭐') {
    const beforeLevel = this.getLevelInfo().level;
    this.state.xp += amount;
    const afterLevel = this.getLevelInfo().level;
    this.save();

    // Sync profile to cloud
    syncProfile({
      name: this.state.name,
      xp: this.state.xp,
      level: this.getLevelInfo(),
      interests: this.state.interests
    });

    return {
      amount,
      reason,
      emoji,
      leveledUp: afterLevel > beforeLevel,
      newLevel: afterLevel,
      levelTitle: this.getLevelInfo().title
    };
  }

  // --- POKEDEX MECHANIC: 1 SPECIES = 1 ENTRY ---
  addDiscovery({ candidate, photoData, locationName, coords }) {
    const id = speciesKey(candidate.name, candidate.scientific);
    const existing = this.state.pokedex[id];
    const match = findFieldGuideMatch(candidate.name, candidate.scientific);
    const now = Date.now();
    const today = getTodayKey();

    let xpEvent = null;

    if (existing) {
      // DUPLICATE DISCOVERED!
      // "One species = one Pokédex entry. If the user photographs another banyan: Already discovered! +5 XP instead of creating a duplicate."
      existing.count = (existing.count || 1) + 1;
      existing.lastSeen = now;
      if (photoData) {
        existing.photos = existing.photos || [];
        existing.photos.unshift(photoData);
        if (existing.photos.length > 5) existing.photos.pop();
      }
      this.recordDayStat(today, { discoveries: 1 });
      xpEvent = this.awardXp(XP_RULES.DUPLICATE_SPECIES, `Already discovered! ${candidate.name}`, '🔁');
      this.save();
      syncPokedexEntry(existing);
      return { isNew: false, entry: existing, xpEvent };
    }

    // NEW SPECIES DISCOVERED!
    const newEntry = {
      id,
      number: Object.keys(this.state.pokedex).length + 1,
      name: candidate.name,
      scientific: candidate.scientific || match?.scientific || '',
      category: normalizeCategory(candidate.category || match?.category, candidate.name, candidate.scientific),
      rarity: candidate.rarity || match?.rarity || 1,
      region: candidate.region || match?.region || 'Wild',
      fact: candidate.fact || match?.fact || '',
      confidence: candidate.confidence || 90,
      place: locationName || this.state.currentLocationName || 'Gurugram',
      coords: coords || null,
      photoData: photoData || null,
      photos: photoData ? [photoData] : [],
      count: 1,
      firstSeen: now,
      lastSeen: now
    };

    this.state.pokedex[id] = newEntry;
    this.recordDayStat(today, { discoveries: 1, newDiscoveries: 1 });
    xpEvent = this.awardXp(XP_RULES.NEW_SPECIES, `New discovery! ${candidate.name}`, '🧬');
    this.save();

    // Check if active quest was a scan quest -> complete it!
    if (this.state.activeQuestData && this.state.activeQuestData.kind === 'scan') {
      this.completeQuest(this.state.activeQuestId);
    }

    syncPokedexEntry(newEntry);
    return { isNew: true, entry: newEntry, xpEvent };
  }

  // --- QUEST LIFECYCLE ---
  setTodayQuests(quests) {
    this.state.todayQuests = quests;
    this.state.todayQuestsDate = getTodayKey();
    this.save();
    quests.forEach(q => syncQuest(q));
  }

  startQuest(questId) {
    const q = this.state.todayQuests.find(item => item.id === questId);
    if (!q || q.status === 'done') return;

    this.state.todayQuests.forEach(item => {
      if (item.status === 'active') item.status = 'todo';
    });

    q.status = 'active';
    this.state.activeQuestId = questId;
    this.state.activeQuestData = {
      ...q,
      startedAt: Date.now(),
      distanceKm: 0,
      path: []
    };
    this.save();
    syncQuest(q);
  }

  abandonQuest() {
    if (!this.state.activeQuestId) return;
    const q = this.state.todayQuests.find(item => item.id === this.state.activeQuestId);
    if (q) q.status = 'todo';
    this.state.activeQuestId = null;
    this.state.activeQuestData = null;
    this.save();
    if (q) syncQuest(q);
  }

  completeQuest(questId) {
    const q = this.state.todayQuests.find(item => item.id === questId);
    if (!q || q.status === 'done') return null;

    q.status = 'done';
    q.completedAt = Date.now();

    const elapsedMinutes = this.state.activeQuestData && this.state.activeQuestData.startedAt
      ? Math.max(1, Math.round((Date.now() - this.state.activeQuestData.startedAt) / 60000))
      : q.minutes || 15;

    const today = getTodayKey();
    this.recordDayStat(today, { questsCompleted: 1, minutes: elapsedMinutes });

    if (this.state.activeQuestId === questId) {
      this.state.activeQuestId = null;
      this.state.activeQuestData = null;
    }

    const xpEvent = this.awardXp(q.xp, `Quest complete: ${q.title}`, q.emoji || '⚔️');

    // Check Daily Challenge (All 3 quests done)
    const allDone = this.state.todayQuests.length > 0 && this.state.todayQuests.every(item => item.status === 'done');
    let dailyChallengeEvent = null;
    if (allDone && !this.state.dailyBonusClaimed) {
      this.state.dailyBonusClaimed = true;
      dailyChallengeEvent = this.awardXp(XP_RULES.DAILY_CHALLENGE, 'Daily Challenge: All 3 quests finished!', '🏆');
    }

    this.save();
    syncQuest(q);
    return { xpEvent, dailyChallengeEvent };
  }

  // --- ADVENTURE HISTORY & WALKING DISTANCE ---
  addWalkingDistance(km, coords) {
    if (!(km > 0)) return null;
    const today = getTodayKey();
    const day = this.recordDayStat(today, { distanceKm: km, point: coords });

    let distanceXpEvent = null;
    // Check if integer km threshold crossed
    const prevKm = (day.distanceKm || 0) - km;
    const crossed = Math.floor(day.distanceKm) - Math.floor(prevKm);
    if (crossed > 0 && !this.state.walkBonusClaimed) {
      this.state.walkBonusClaimed = true;
      distanceXpEvent = this.awardXp(XP_RULES.WALK_PER_KM * crossed, `Walked ${Math.floor(day.distanceKm)} km today`, '🚶');
    }

    // If active quest is a walk quest, increment quest distance
    if (this.state.activeQuestData && this.state.activeQuestData.kind === 'walk') {
      this.state.activeQuestData.distanceKm = (this.state.activeQuestData.distanceKm || 0) + km;
      if (coords) this.state.activeQuestData.path.push(coords);

      // Check if target reached
      if (this.state.activeQuestData.distanceKm >= (this.state.activeQuestData.targetKm || 1.0)) {
        this.completeQuest(this.state.activeQuestId);
      }
    }

    this.save();
    syncAdventure(today, day);
    return distanceXpEvent;
  }

  recordDayStat(dateKey, { distanceKm = 0, minutes = 0, discoveries = 0, newDiscoveries = 0, questsCompleted = 0, point = null }) {
    if (!this.state.history[dateKey]) {
      this.state.history[dateKey] = {
        distanceKm: 0,
        minutes: 0,
        discoveries: 0,
        newDiscoveries: 0,
        questsCompleted: 0,
        points: []
      };
    }

    const d = this.state.history[dateKey];
    d.distanceKm += distanceKm;
    d.minutes += minutes;
    d.discoveries += discoveries;
    d.newDiscoveries += newDiscoveries;
    d.questsCompleted += questsCompleted;

    if (point && d.points.length < 300) {
      d.points.push({ lat: point.latitude || point.lat, lng: point.longitude || point.lng, time: Date.now() });
    }

    return d;
  }

  updateProfile({ name, interests, minutesAvailable, aiSettings, currentLocationName }) {
    if (name !== undefined) this.state.name = name;
    if (interests !== undefined) this.state.interests = interests;
    if (minutesAvailable !== undefined) this.state.minutesAvailable = minutesAvailable;
    if (aiSettings !== undefined) this.state.aiSettings = { ...this.state.aiSettings, ...aiSettings };
    if (currentLocationName !== undefined) this.state.currentLocationName = currentLocationName;
    this.save();
    syncProfile({
      name: this.state.name,
      xp: this.state.xp,
      level: this.getLevelInfo(),
      interests: this.state.interests
    });
  }

  async loadFromCloud() {
    const cloud = await fetchRemoteUserData();
    if (!cloud) return false;

    if (cloud.profile) {
      this.state.name = cloud.profile.name || this.state.name;
      this.state.xp = Math.max(this.state.xp, cloud.profile.xp || 0);
      if (cloud.profile.interests && cloud.profile.interests.length) {
        this.state.interests = cloud.profile.interests;
      }
    }

    if (cloud.dexEntries && cloud.dexEntries.length) {
      cloud.dexEntries.forEach(entry => {
        if (!this.state.pokedex[entry.species_id]) {
          this.state.pokedex[entry.species_id] = {
            id: entry.species_id,
            name: entry.name,
            scientific: entry.scientific_name,
            category: entry.category,
            count: entry.count || 1,
            rarity: entry.rarity || 1,
            place: entry.location_name || '',
            coords: entry.lat ? { lat: entry.lat, lng: entry.lng } : null,
            photoData: entry.photo_data,
            photos: entry.photo_data ? [entry.photo_data] : [],
            firstSeen: new Date(entry.first_seen).getTime(),
            lastSeen: new Date(entry.last_seen).getTime()
          };
        }
      });
    }

    this.save();
    return true;
  }
}

export const store = new GameStore();
