// SideQuest IRL — Service Worker for Offline PWA
const CACHE_NAME = 'sidequest-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/fieldGuide.js',
  './js/questMaster.js',
  './js/scanner.js',
  './js/storage.js',
  './js/supabaseClient.js',
  './assets/icon.png',
  './assets/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Network first, fallback to cache for offline support
  if (e.request.method !== 'GET') return;
  
  // Don't intercept Supabase API calls or external AI calls
  const url = new URL(e.request.url);
  if (url.origin.includes('supabase.co') || url.port === '11434') return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match('./index.html')))
  );
});
