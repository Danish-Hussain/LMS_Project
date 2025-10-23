// Basic PWA service worker for SAP Integration Expert
const CACHE_NAME = 'sie-academy-v7';
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/icon.png?v=4',
  '/apple-icon.png?v=4',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve()))).then(() => self.clients.claim())
  );
});

// Allow page to trigger immediate activation of a waiting SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Network-first for navigation requests with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Always bypass caching for Next.js dev assets, API routes, and HMR/event streams
  const accept = request.headers.get('accept') || '';
  const isDevAsset = url.pathname.startsWith('/_next/') || url.pathname.startsWith('/__nextjs_original-stack-frame');
  const isApi = url.pathname.startsWith('/api/');
  const isEventStream = accept.includes('text/event-stream');
  const isDevHost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

  if (isDevHost && (isDevAsset || isApi || isEventStream)) {
    // Let these requests go straight to the network without SW handling
    return; // default browser fetch
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          return cached || cache.match('/offline.html');
        })
    );
    return;
  }

  // Cache-first for same-origin static assets
  if (request.method === 'GET' && url.origin === location.origin) {
    // Avoid caching Next dev assets and API even on GET
    if (isDevHost && (isDevAsset || isApi || isEventStream)) {
      return; // default browser fetch
    }
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
