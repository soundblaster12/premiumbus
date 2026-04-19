/**
 * sw.js — Service Worker para PremiumBus PWA v2
 * 
 * Cachea los archivos esenciales para funcionamiento offline
 * y permite instalar la app en el teléfono.
 */

const CACHE_NAME = 'premiumbus-v2';

// CDN Resources que no cacheamos (necesitan internet)
const NETWORK_ONLY = [
  'tile.openstreetmap.org',
  'unpkg.com/leaflet',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── Instalación — Activar inmediatamente ────────
self.addEventListener('install', (event) => {
  console.log('[SW] Instalado v2');
  // Activar inmediatamente sin esperar tabs viejos
  self.skipWaiting();
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
  // Claimear todas las tabs abiertas
  self.clients.claim();
});

// ── Fetch — Estrategia: Network First, Cache Fallback ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // No interceptar peticiones a la API (siempre deben ir al servidor)
  if (url.pathname.includes('/api/')) {
    return;
  }

  // No interceptar PHP files
  if (url.pathname.endsWith('.php')) {
    return;
  }

  // No interceptar recursos de CDN (mapas, fonts)
  if (NETWORK_ONLY.some((domain) => url.hostname.includes(domain))) {
    return;
  }

  event.respondWith(
    // Intentar red primero, luego cache
    fetch(event.request)
      .then((response) => {
        // Si la red responde, actualizar cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla, servir desde cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;

          // Fallback para navegación: servir index.html
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});
