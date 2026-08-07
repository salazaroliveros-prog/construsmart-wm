// CONSTRUCTORA WM/M&S - SERVICE WORKER
// Slogan: "CONSTRUYENDO EL FUTURO"
// Progressive Web App - 100% Offline Capable
// v1.1.0 - PWA install assets & icon precache

const CACHE_NAME = 'constructora-wm-v5';
const STATIC_CACHE = 'constructora-wm-static-v5';
const DATA_CACHE = 'constructora-wm-data-v5';
const RUNTIME_CACHE = 'constructora-wm-runtime-v5';

// Detect environment
const isDevelopment = self.location.hostname === 'localhost' ||
                       self.location.hostname === '127.0.0.1' ||
                       self.location.hostname === '10.161.134.180' ||
                       self.location.protocol === 'file:';

// Disable service worker in development to avoid chunk loading errors
if (isDevelopment) {
  console.log('🚫 Service Worker desactivado en modo desarrollo');
  self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    // Clear all caches in development
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('🗑️  Limpiando cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  });
  self.addEventListener('fetch', (event) => {
    // In development, always use network but don't break page navigations
    // or throw on requests that legitimately fail (Server Actions, HMR, etc.)
    const request = event.request;
    // Skip navigation requests (let the browser handle them) and
    // non-GET requests (Server Actions, mutations) to avoid breaking the app
    if (request.mode === 'navigate' || request.method !== 'GET') {
      return;
    }
    event.respondWith(
      fetch(request).catch(() => Response.error())
    );
  });
} else {
  // Production mode: continue with normal caching
  console.log('✅ Service Worker activo en modo producción');

  // Assets to cache immediately (Cache-First in Production)
  const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/icons/logo-192x192.png',
    '/icons/logo-512x512.png',
    '/icons/logo-192x192-maskable.png',
    '/icons/logo-512x512-maskable.png',
    '/assets/branding/logo-constructora-wm.jpg',
    '/assets/branding/letterhead-multiservicios.jpg',
  ];

  // API endpoints to cache (Stale-While-Revalidate Strategy)
  const API_ENDPOINTS = [
    '/api/projects',
    '/api/budgets',
    '/api/transactions',
    '/api/payroll',
    '/api/warehouse',
  ];

  // Install event - Cache static assets
  self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
    );

    self.skipWaiting();
  });

  // Activate event - Clean up old caches
  self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DATA_CACHE && 
                cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );

    self.clients.claim();
  });

  // Fetch event - Strategy routing
  self.addEventListener('fetch', (event) => {
    const { url, method } = event.request;

    // Skip cross-origin requests
    if (!url.startsWith(self.location.origin)) {
      return;
    }

    // Never intercept document (navigation) requests: let the browser handle
    // them directly to avoid serving stale HTML and breaking the App Router.
    if (event.request.mode === 'navigate') {
      return;
    }

    // Handle different request types with appropriate strategies
    if (isStaticAsset(url)) {
      event.respondWith(cacheFirst(event.request));
    } else if (isAPIRequest(url)) {
      event.respondWith(networkFirst(event.request));
    } else if (method === 'GET') {
      event.respondWith(staleWhileRevalidate(event.request));
    } else {
      event.respondWith(networkOnly(event.request));
    }
  });

  // Strategy: Cache-First
  async function cacheFirst(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    try {
      const networkResponse = await fetch(request);
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone()).catch(() => {});
      }
      return networkResponse || Response.error();
    } catch (error) {
      console.warn('[SW] Cache-First fetch failed, returning error:', request.url);
      return Response.error();
    }
  }

  // Strategy: Network-First
  async function networkFirst(request) {
    const cache = await caches.open(DATA_CACHE);

    try {
      console.log('[SW] Network-First: attempting network:', request.url);
      const networkResponse = await fetch(request);

      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone()).catch(() => {});
      }

      return networkResponse || Response.error();
    } catch (error) {
      console.log('[SW] Network failed, using cache:', request.url);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }

      // Return a graceful JSON error instead of rejecting the promise
      return new Response(JSON.stringify({
        error: 'Offline',
        message: 'No cached data available'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Strategy: Stale-While-Revalidate
  async function staleWhileRevalidate(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone()).catch(() => {});
        }
        return networkResponse;
      })
      .catch((error) => {
        console.log('[SW] Stale-While-Revalidate fetch failed, using cache:', request.url);
        return null;
      });

    // Return cached response immediately if available
    if (cachedResponse) {
      // Still try to fetch in background for next time
      fetchPromise.catch(() => {});
      return cachedResponse;
    }

    // If no cache, wait for network or fail gracefully
    try {
      const networkResponse = await fetchPromise;
      if (networkResponse) {
        return networkResponse;
      }
    } catch (error) {
      console.log('[SW] Stale-While-Revalidate failed completely:', request.url);
    }

    // Return a fallback response
    return new Response('Offline - No cached data available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain',
      }),
    });
  }

  // Strategy: Network-Only
  async function networkOnly(request) {
    try {
      const response = await fetch(request);
      return response || Response.error();
    } catch (error) {
      console.warn('[SW] Network request failed (non-cacheable):', request.url);
      // Return a response instead of throwing to avoid 'Failed to fetch'
      return new Response(null, {
        status: 504,
        statusText: 'Gateway Timeout',
        headers: new Headers({ 'Content-Type': 'text/plain' }),
      });
    }
  }

  // Helper: Check if request is for static asset
  function isStaticAsset(url) {
    return url.includes('/assets/') ||
           url.includes('/images/') ||
           url.includes('/fonts/') ||
           url.endsWith('.js') ||
           url.endsWith('.css') ||
           url.endsWith('.png') ||
           url.endsWith('.jpg') ||
           url.endsWith('.jpeg') ||
           url.endsWith('.svg') ||
           url.endsWith('.ico');
  }

  // Helper: Check if request is for API
  function isAPIRequest(url) {
    return API_ENDPOINTS.some(endpoint => url.includes(endpoint));
  }
}

console.log('[SW] Service Worker loaded successfully');
