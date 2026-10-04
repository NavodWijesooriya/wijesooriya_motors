const CACHE_PREFIX = 'sales-pos-';
const CACHE_NAME = `${CACHE_PREFIX}__PWA_BUILD_ID__`;
const MAX_RUNTIME_ASSETS = 100;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_RUNTIME_ASSETS))
      .map((request) => cache.delete(request))
  );
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put('/', response.clone());
          await trimCache(cache);
        }
        return response;
      }).catch(async () => {
        const cachedPage = await caches.match('/');
        if (cachedPage) return cachedPage;
        return new Response('You are offline. Reconnect to load the latest version.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

  const isApplicationAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    /\.(?:js|css)$/i.test(url.pathname);

  if (isApplicationAsset) {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
          await trimCache(cache);
        }
        return response;
      }).catch(async () => {
        const cachedAsset = await caches.match(request);
        if (cachedAsset) return cachedAsset;
        return new Response('Application asset unavailable while offline.', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
    );
    return;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    const cachePromise = caches.open(CACHE_NAME);
    const networkRequest = cachePromise.then((cache) => fetch(request).then(async (response) => {
      if (response.ok) {
        await cache.put(request, response.clone());
        await trimCache(cache);
      }
      return response;
    }));
    event.waitUntil(networkRequest.then(() => undefined, (error) => {
      console.warn('Failed to refresh a cached PWA image or font', error);
    }));
    event.respondWith(
      cachePromise.then(async (cache) => {
        const cachedAsset = await cache.match(request);
        if (cachedAsset) {
          return cachedAsset;
        }
        return networkRequest;
      })
    );
  }
});
