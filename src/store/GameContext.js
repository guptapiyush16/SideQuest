// Global game state: XP, today's quests, Pokédex, adventure history, settings.
// Everything is stored on-device with AsyncStorage (no backend).
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { XP, levelFromXp } from '../utils/xp';
import { dayKey } from '../utils/geo';
import { speciesKey, matchFieldGuide } from '../data/fieldGuide';
import { DEFAULT_TEXT_MODEL, DEFAULT_VISION_MODEL, guessOllamaUrl } from '../ai/ollama';
import { buildAdventureMemory } from '../ai/adventureMemory';
import { generateDailyQuests } from '../ai/questMaster';

const STORAGE_KEY = 'sidequest-irl:v1';

const initialState = () => ({
  xp: 0,
  pokedex: {},
  today: null, // { date, quests, minutes, source, error, bonusClaimed }
  questLog: [],
  history: {},
  activeQuest: null, // { id, startedAt, distanceKm }
  onboarded: false,
  settings: {
    aiEnabled: true,
    ollamaUrl: guessOllamaUrl(),
    textModel: DEFAULT_TEXT_MODEL,
    visionModel: DEFAULT_VISION_MODEL,
    interests: [],
    minutes: 30,
    demoWalk: false,
    name: '',
  },
});

const emptyDay = () => ({ distanceKm: 0, minutes: 0, discoveries: 0, newDiscoveries: 0, questsCompleted: 0, points: [] });

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [place, setPlace] = useState('');
  const [questsLoading, setQuestsLoading] = useState(false);
  const [rewards, setRewards] = useState([]); // queue for the reward overlay
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---------- persistence ----------
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          const base = initialState();
          setState({ ...base, ...saved, settings: { ...base.settings, ...saved.settings } });
        }
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [state, hydrated]);

  // ---------- approximate location (city only) ----------
  const lastCoord = useRef(null);
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = (await Location.getLastKnownPositionAsync()) || (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
        if (!pos) return;
        lastCoord.current = pos.coords;
        const [g] = await Location.reverseGeocodeAsync(pos.coords);
        if (g) setPlace(g.city || g.district || g.subregion || g.region || '');
      } catch {}
    })();
  }, []);

  // ---------- helpers ----------
  const mutate = useCallback((fn) => setState((prev) => fn(structuredCloneSafe(prev))), []);

  /** Apply XP and queue one combined reward card. */
  const grant = useCallback((lines, extra = {}) => {
    const total = lines.reduce((s, l) => s + l.xp, 0);
    if (!total) return;
    const before = levelFromXp(stateRef.current.xp);
    const after = levelFromXp(stateRef.current.xp + total);
    mutate((s) => {
      s.xp += total;
      return s;
    });
    setRewards((r) => [...r, { id: Date.now() + Math.random(), lines, total, levelUp: after.level > before.level ? after : null, ...extra }]);
  }, [mutate]);

  const dismissReward = useCallback(() => setRewards((r) => r.slice(1)), []);

  const touchDay = (s, key = dayKey()) => {
    if (!s.history[key]) s.history[key] = emptyDay();
    return s.history[key];
  };

  // ---------- quests ----------
  const refreshQuests = useCallback(async (force = false) => {
    const s = stateRef.current;
    if (!force && s.today?.date === dayKey() && s.today.quests?.length) return;
    setQuestsLoading(true);
    const memory = buildAdventureMemory({ ...s, interests: s.settings.interests });
    const res = await generateDailyQuests({ settings: s.settings, memory, place, minutes: s.settings.minutes });
    mutate((n) => {
      n.today = { date: dayKey(), quests: res.quests, minutes: n.settings.minutes, source: res.source, error: res.error, bonusClaimed: false };
      n.activeQuest = null;
      return n;
    });
    setQuestsLoading(false);
  }, [mutate, place]);

  useEffect(() => {
    if (hydrated && stateRef.current.onboarded) refreshQuests(false);
  }, [hydrated, state.onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  const startQuest = useCallback((id) => {
    mutate((s) => {
      s.today.quests.forEach((q) => {
        if (q.status === 'active') q.status = 'todo';
        if (q.id === id) q.status = 'active';
      });
      s.activeQuest = { id, startedAt: Date.now(), distanceKm: 0 };
      return s;
    });
  }, [mutate]);

  const abandonQuest = useCallback(() => {
    mutate((s) => {
      const q = s.today?.quests.find((x) => x.id === s.activeQuest?.id);
      if (q) q.status = 'todo';
      s.activeQuest = null;
      return s;
    });
  }, [mutate]);

  /** Called by the GPS tracker (or demo walker) with new distance walked. */
  const addDistance = useCallback((km, coords) => {
    if (!(km > 0)) return;
    const s0 = stateRef.current;
    const dayBefore = s0.history[dayKey()]?.distanceKm || 0;
    if (coords) lastCoord.current = coords;
    mutate((s) => {
      const d = touchDay(s);
      d.distanceKm += km;
      if (coords && (!d.points.length || d.points.length < 200)) {
        const last = d.points[d.points.length - 1];
        if (!last || Math.abs(last.lat - coords.latitude) + Math.abs(last.lng - coords.longitude) > 0.0004) {
          d.points.push({ lat: coords.latitude, lng: coords.longitude, t: 'path' });
        }
      }
      if (s.activeQuest) s.activeQuest.distanceKm += km;
      return s;
    });
    const crossed = Math.floor(dayBefore + km) - Math.floor(dayBefore);
    if (crossed > 0) grant([{ label: `Walked ${Math.floor(dayBefore + km)} km today`, xp: XP.PER_KM * crossed }]);
  }, [mutate, grant]);

  const completeQuest = useCallback((id, { silent = false } = {}) => {
    const s0 = stateRef.current;
    const q = s0.today?.quests.find((x) => x.id === id);
    if (!q || q.status === 'done') return [];
    const elapsedMin = s0.activeQuest?.id === id ? Math.min(120, Math.round((Date.now() - s0.activeQuest.startedAt) / 60000)) : 0;
    const allDoneAfter = s0.today.quests.every((x) => x.id === id || x.status === 'done');

    mutate((s) => {
      const qq = s.today.quests.find((x) => x.id === id);
      qq.status = 'done';
      qq.completedAt = Date.now();
      if (s.activeQuest?.id === id) s.activeQuest = null;
      const d = touchDay(s);
      d.questsCompleted += 1;
      d.minutes += Math.max(1, elapsedMin);
      s.questLog.push({ title: q.title, kind: q.kind, completed: true, date: dayKey() });
      s.questLog = s.questLog.slice(-50);
      if (allDoneAfter) s.today.bonusClaimed = true;
      return s;
    });

    const lines = [{ label: `Quest complete: ${q.title}`, xp: q.xp }];
    if (allDoneAfter && !s0.today.bonusClaimed) lines.push({ label: 'Daily challenge: all 3 quests!', xp: XP.DAILY_CHALLENGE });
    if (!silent) grant(lines, { emoji: q.emoji, headline: 'QUEST COMPLETE' });
    return lines;
  }, [mutate, grant]);

  // ---------- Pokédex ----------
  /**
   * Add a scanned candidate. One species = one entry; duplicates give +5 XP.
   * Also auto-completes an active "scan" quest.
   */
  const addDiscovery = useCallback((cand, { photoUri, region, fact, confidence, userConfirmed } = {}) => {
    const s0 = stateRef.current;
    const id = speciesKey(cand.name, cand.scientific);
    const existing = s0.pokedex[id];
    const guide = matchFieldGuide(cand.name, cand.scientific);
    const coords = lastCoord.current;
    const now = Date.now();

    mutate((s) => {
      const d = touchDay(s);
      d.discoveries += 1;
      if (coords) d.points.push({ lat: coords.latitude, lng: coords.longitude, t: cand.category });
      if (existing) {
        const e = s.pokedex[id];
        e.count += 1;
        e.lastSeen = now;
        if (photoUri) e.photos = [...(e.photos || []), photoUri].slice(-6);
      } else {
        d.newDiscoveries += 1;
        s.pokedex[id] = {
          id,
          name: cand.name,
          scientific: cand.scientific,
          category: cand.category,
          rarity: guide?.rarity || cand.rarity || 2,
          inFieldGuide: !!guide,
          region: region || guide?.region || '',
          fact: fact || '',
          confidence,
          userConfirmed: !!userConfirmed,
          photoUri,
          photos: photoUri ? [photoUri] : [],
          place,
          coords: coords ? { lat: coords.latitude, lng: coords.longitude } : null,
          firstSeen: now,
          lastSeen: now,
          count: 1,
          number: Object.keys(s.pokedex).length + 1,
        };
      }
      return s;
    });

    const lines = [existing
      ? { label: `Already discovered: ${cand.name}`, xp: XP.DUPLICATE }
      : { label: `New discovery: ${cand.name}`, xp: XP.NEW_DISCOVERY }];

    const active = s0.today?.quests.find((q) => q.id === s0.activeQuest?.id);
    if (active && active.kind === 'scan') lines.push(...completeQuest(active.id, { silent: true }));

    grant(lines, { emoji: existing ? '🔁' : guideEmoji(cand.category), headline: existing ? 'ALREADY DISCOVERED!' : 'NEW DISCOVERY!', photoUri });
    return { isNew: !existing, id };
  }, [mutate, grant, completeQuest, place]);

  // ---------- settings ----------
  const updateSettings = useCallback((patch) => mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } })), [mutate]);
  const finishOnboarding = useCallback((patch) => mutate((s) => ({ ...s, onboarded: true, settings: { ...s.settings, ...patch } })), [mutate]);
  const resetAll = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState(initialState());
  }, []);

  const value = useMemo(() => ({
    ...state,
    hydrated,
    place,
    questsLoading,
    rewards,
    level: levelFromXp(state.xp),
    refreshQuests,
    startQuest,
    abandonQuest,
    completeQuest,
    addDistance,
    addDiscovery,
    updateSettings,
    finishOnboarding,
    resetAll,
    dismissReward,
  }), [state, hydrated, place, questsLoading, rewards, refreshQuests, startQuest, abandonQuest, completeQuest, addDistance, addDiscovery, updateSettings, finishOnboarding, resetAll, dismissReward]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

function guideEmoji(cat) {
  return { plant: '🌳', flower: '🌸', bird: '🐦', insect: '🦋', mushroom: '🍄', rock: '🪨', animal: '🐿️' }[cat] || '✨';
}

function structuredCloneSafe(o) {
  return JSON.parse(JSON.stringify(o));
}
