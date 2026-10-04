const CACHE='viraj-finance-v42';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(['./','./index.html','./manifest.json','./auth.js?v=2','./app.js?v=20','./finance-core.js?v=1','./drive-sync.js?v=2','./finance-ux.js?v=3','./ai.js?v=16','./professional-visuals.js?v=4','./live-fx.js?v=8','./app-polish.js?v=10','./feature-hub.js?v=2']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (new URL(event.request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});