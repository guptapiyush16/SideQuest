// SideQuest IRL — Supabase Cloud Sync Engine (Anonymous Device Identity)
// Connects to Supabase Postgres so each user's data is safely stored in the cloud.

const DEVICE_ID_KEY = 'sidequest_device_id';
const SUPABASE_CONFIG_KEY = 'sidequest_supabase_config';

export function getAnonymousDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getSupabaseConfig() {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {
    url: '',
    key: '',
    enabled: false
  };
}

export function saveSupabaseConfig(cfg) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(cfg));
  initSupabaseClient();
}

let supabaseInstance = null;

export function initSupabaseClient() {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && window.supabase) {
    try {
      supabaseInstance = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: false }
      });
      console.log('✅ Supabase client initialized for device:', getAnonymousDeviceId());
      return supabaseInstance;
    } catch (err) {
      console.error('Failed to init Supabase:', err);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return null;
}

export function isCloudSyncActive() {
  return !!supabaseInstance;
}

// SQL Schema generator that user can run in Supabase SQL editor
export const SUPABASE_SETUP_SQL = `-- SideQuest IRL — Supabase Database Schema
-- Run this script in the Supabase SQL Editor (supabase.com/dashboard/project/_/sql)

-- 1. Profiles Table (Anonymous device ID)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT 'Explorer',
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  interests JSONB DEFAULT '[]'::jsonb,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. IRL Pokédex Entries
CREATE TABLE IF NOT EXISTS pokedex_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  species_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scientific_name TEXT,
  category TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  rarity INTEGER DEFAULT 1,
  location_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  photo_data TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quests Log
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  kind TEXT,
  xp INTEGER DEFAULT 30,
  status TEXT DEFAULT 'todo',
  date_key TEXT,
  completed_at TIMESTAMPTZ
);

-- 4. Adventure History
CREATE TABLE IF NOT EXISTS adventures (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL,
  distance_km DOUBLE PRECISION DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  discoveries_count INTEGER DEFAULT 0,
  quests_count INTEGER DEFAULT 0,
  path_points JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (Permissive for Anonymous Device MVP)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pokedex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write pokedex" ON pokedex_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write quests" ON quests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write adventures" ON adventures FOR ALL USING (true) WITH CHECK (true);
`;

/** Sync User Profile to Supabase */
export async function syncProfile(profile) {
  if (!supabaseInstance) return false;
  const userId = getAnonymousDeviceId();
  try {
    const { error } = await supabaseInstance
      .from('profiles')
      .upsert({
        id: userId,
        name: profile.name || 'Explorer',
        xp: profile.xp || 0,
        level: profile.level?.level || 1,
        interests: profile.interests || [],
        last_active: new Date().toISOString()
      }, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase syncProfile notice:', err.message);
    return false;
  }
}

/** Sync Pokédex Entry to Supabase */
export async function syncPokedexEntry(entry) {
  if (!supabaseInstance) return false;
  const userId = getAnonymousDeviceId();
  try {
    const { error } = await supabaseInstance
      .from('pokedex_entries')
      .upsert({
        id: `${userId}_${entry.id}`,
        user_id: userId,
        species_id: entry.id,
        name: entry.name,
        scientific_name: entry.scientific || entry.scientific_name,
        category: entry.category,
        count: entry.count || 1,
        rarity: entry.rarity || 1,
        location_name: entry.place || '',
        lat: entry.coords?.lat || null,
        lng: entry.coords?.lng || null,
        photo_data: entry.photoData || (entry.photos && entry.photos[0]) || null,
        first_seen: new Date(entry.firstSeen || Date.now()).toISOString(),
        last_seen: new Date(entry.lastSeen || Date.now()).toISOString()
      }, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase syncPokedexEntry notice:', err.message);
    return false;
  }
}

/** Sync Quest to Supabase */
export async function syncQuest(quest) {
  if (!supabaseInstance) return false;
  const userId = getAnonymousDeviceId();
  try {
    const { error } = await supabaseInstance
      .from('quests')
      .upsert({
        id: `${userId}_${quest.id}`,
        user_id: userId,
        title: quest.title,
        description: quest.description,
        emoji: quest.emoji,
        kind: quest.kind,
        xp: quest.xp,
        status: quest.status,
        date_key: quest.dateKey,
        completed_at: quest.completedAt ? new Date(quest.completedAt).toISOString() : null
      }, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase syncQuest notice:', err.message);
    return false;
  }
}

/** Sync Daily Adventure Day to Supabase */
export async function syncAdventure(dateKey, dayData) {
  if (!supabaseInstance) return false;
  const userId = getAnonymousDeviceId();
  try {
    const { error } = await supabaseInstance
      .from('adventures')
      .upsert({
        id: `${userId}_${dateKey}`,
        user_id: userId,
        date_key: dateKey,
        distance_km: dayData.distanceKm || 0,
        minutes: dayData.minutes || 0,
        discoveries_count: dayData.discoveries || 0,
        quests_count: dayData.questsCompleted || 0,
        path_points: dayData.points || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase syncAdventure notice:', err.message);
    return false;
  }
}

/** Fetch remote user state from Supabase if existing */
export async function fetchRemoteUserData() {
  if (!supabaseInstance) return null;
  const userId = getAnonymousDeviceId();
  try {
    const { data: profile } = await supabaseInstance
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: dexEntries } = await supabaseInstance
      .from('pokedex_entries')
      .select('*')
      .eq('user_id', userId);

    const { data: adventures } = await supabaseInstance
      .from('adventures')
      .select('*')
      .eq('user_id', userId);

    return {
      profile,
      dexEntries: dexEntries || [],
      adventures: adventures || []
    };
  } catch (err) {
    console.warn('Supabase fetchRemoteUserData notice:', err.message);
    return null;
  }
}

/** Check connection to Supabase */
export async function testSupabaseConnection(url, key) {
  if (!window.supabase) throw new Error('Supabase SDK not loaded');
  const tempClient = window.supabase.createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await tempClient.from('profiles').select('id').limit(1);
  if (error && error.code !== 'PGRST116') {
    throw error;
  }
  return true;
}
