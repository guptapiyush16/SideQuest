// SideQuest API client. The browser never connects directly to MongoDB.

const TOKEN_KEY = 'sidequest_auth_token';
let token = localStorage.getItem(TOKEN_KEY);
let currentUser = null;

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}

export async function initSupabaseClient() {
  if (!token) return null;
  try {
    const result = await request('/api/me');
    currentUser = result.user;
    return currentUser;
  } catch {
    logout();
    return null;
  }
}

export async function register(email, password, name) {
  const result = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
  token = result.token;
  currentUser = result.user;
  localStorage.setItem(TOKEN_KEY, token);
  return currentUser;
}

export async function login(email, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  token = result.token;
  currentUser = result.user;
  localStorage.setItem(TOKEN_KEY, token);
  return currentUser;
}

export function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem(TOKEN_KEY);
}

export function isCloudSyncActive() {
  return Boolean(token && currentUser);
}

export function getAnonymousDeviceId() {
  return currentUser?.id || '';
}

export function getCurrentUser() {
  return currentUser;
}

export async function ensureCloudProfile() {
  if (!currentUser) return null;
  return { profile: currentUser, isNew: currentUser.xp === 0 && currentUser.level === 1 };
}

export async function syncProfile(profile) {
  if (!isCloudSyncActive()) return false;
  await request('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: profile.name,
      xp: profile.xp,
      level: profile.level?.level || profile.level,
      interests: profile.interests
    })
  });
  return true;
}

export async function syncPokedexEntry(entry) {
  if (!isCloudSyncActive()) return false;
  await request('/api/discoveries', {
    method: 'POST',
    body: JSON.stringify({
      ...entry,
      photoData: entry.photoData || (entry.photos && entry.photos[0]) || null
    })
  });
  return true;
}

export async function syncQuest() {
  return false;
}

export async function syncAdventure(dateKey, dayData) {
  if (!isCloudSyncActive()) return false;
  await request('/api/adventures', {
    method: 'POST',
    body: JSON.stringify({ dateKey, ...dayData })
  });
  return true;
}

export async function fetchRemoteUserData() {
  if (!isCloudSyncActive()) return null;
  return request('/api/state');
}

export async function testSupabaseConnection() {
  const response = await fetch('/api/health');
  if (!response.ok) throw new Error('Backend is unavailable');
  return true;
}

export const SUPABASE_SETUP_SQL = `MongoDB Atlas is configured through server environment variables.
Set MONGODB_URI, MONGODB_DB, AUTH_SECRET, and PORT on the deployment host.`;
