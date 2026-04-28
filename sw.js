/**
 * sw.js — Service Worker para PremiumBus PWA v3
 * 
 * Pre-cachea todos los archivos esenciales para funcionar offline
 * completo en Android e iOS. Estrategia: Cache First + Network Update.
 */

const CACHE_NAME = 'premiumbus-v4';

/** Archivos que se pre-cachean al instalar el SW */
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/styles/tokens.css',
  './src/styles/global.css',
  './src/styles/components.css',
  './src/styles/pages.css',
  './src/styles/android.css',
  './src/pages/LoginPage.js',
  './src/pages/RegisterPage.js',
  './src/pages/HomePage.js',
  './src/pages/TripsPage.js',
  './src/pages/PurchasePage.js',
  './src/pages/ProfilePage.js',
  './src/pages/AdminPage.js',
  './src/services/AuthService.js',
  './src/services/DataService.js',
  './src/services/ApiClient.js',
  './src/services/Router.js',
  './src/services/MapService.js',
  './src/services/OfflineQueue.js',
  './src/components/Icons.js',
  './src/components/Navbar.js',
  './src/components/Toast.js',
];

/** Dominios que siempre requieren red (no cachear) */
const NETWORK_ONLY_DOMAINS = [
  'tile.openstreetmap.org',
  'accounts.google.com',
  'connect.facebook.net',
  'graph.facebook.com',
  'oauth2.googleapis.com',
];

// ── Instalación — Pre-cache de assets ────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando v3 — pre-cacheando assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.warn('[SW] Algunos assets no se pudieron pre-cachear:', err);
          // Cachear individualmente los que se pueda
          return Promise.allSettled(
            PRECACHE_ASSETS.map((url) => cache.add(url).catch(() => null))
          );
        });
      })
      .then(() => {
        console.log('[SW] Pre-cache completado');
        self.skipWaiting();
      })
  );
});

// ── Activación — Limpiar caches viejos ──────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch — Cache First + Network Update ────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a la API (deben ir al servidor)
  if (url.pathname.includes('/api/')) {
    return;
  }

  // No interceptar PHP files
  if (url.pathname.endsWith('.php')) {
    return;
  }

  // No interceptar dominios que requieren red
  if (NETWORK_ONLY_DOMAINS.some((domain) => url.hostname.includes(domain))) {
    return;
  }

  // Para fonts de Google: cache first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Para Leaflet CDN: cache first
  if (url.hostname.includes('unpkg.com')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // App assets: Cache first, then network update in background
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Update cache in background
      const networkFetch = fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => null);

      // Return cached immediately, or wait for network
      if (cached) {
        return cached;
      }

      return networkFetch.then((response) => {
        if (response) return response;

        // Last resort: serve index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('Offline — recurso no disponible.', { status: 503 });
      });
    })
  );
});

// ── Background Sync — Sincronizar compras pendientes ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-purchases') {
    console.log('[SW] Background sync: sincronizando compras pendientes...');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_PURCHASES' });
        });
      })
    );
  }
});

// ── Messages — Comunicación con la app ──────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
