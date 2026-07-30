// CONSTRUCTORA WM/M&S - SERVICE WORKER
// Slogan: "CONSTRUYENDO EL FUTURO"
// Progressive Web App - 100% Offline Capable

const CACHE_NAME = 'constructora-wm-v2';
const STATIC_CACHE = 'constructora-wm-static-v2';
const DATA_CACHE = 'constructora-wm-data-v2';
const RUNTIME_CACHE = 'constructora-wm-runtime-v2';

// Detect environment
const isDevelopment = self.location.hostname === 'localhost' || 
                       self.location.hostname === '127.0.0.1' ||
                       self.location.protocol === 'file:';

// Assets to cache immediately (Network-First in Development, Cache-First in Production)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
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
          if (cacheName !== STATIC_CACHE && cacheName !== DATA_CACHE) {
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
  
  // Handle different request types with appropriate strategies
  if (isStaticAsset(url)) {
    // Network-First in Development, Cache-First in Production
    const strategy = isDevelopment ? networkFirst : cacheFirst;
    event.respondWith(strategy(event.request));
  } else if (isAPIRequest(url)) {
    // Network-First for API requests with offline fallback
    event.respondWith(networkFirst(event.request));
  } else if (method === 'GET') {
    // Stale-While-Revalidate for navigation requests
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    // Network-Only for POST/PUT/DELETE requests
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
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Strategy: Network-First
async function networkFirst(request) {
  const cache = await caches.open(DATA_CACHE);
  
  try {
    console.log('[SW] Network-First: attempting network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, using cache:', request.url);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for GET requests
    if (request.method === 'GET') {
      return new Response(JSON.stringify({ 
        error: 'Offline', 
        message: 'No cached data available' 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Strategy: Stale-While-Revalidate
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Strategy: Network-Only
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Network request failed:', request.url);
    
    // Queue failed requests for background sync
    if (request.method === 'POST' || request.method === 'PUT') {
      await queueRequestForSync(request);
    }
    
    throw error;
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

// Background Sync Queue
const SYNC_QUEUE_NAME = 'constructora-wm-sync-queue';

async function queueRequestForSync(request) {
  try {
    const clonedRequest = request.clone();
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: await clonedRequest.text(),
      timestamp: Date.now()
    };
    
    // Store in IndexedDB for background sync
    const db = await openSyncDB();
    await db.add(SYNC_QUEUE_NAME, requestData);
    
    console.log('[SW] Request queued for background sync:', request.url);
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      await self.registration.sync.register('background-sync');
    }
  } catch (error) {
    console.error('[SW] Failed to queue request:', error);
  }
}

// IndexedDB for sync queue
function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ConstructoraWM_SyncDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_NAME)) {
        db.createObjectStore(SYNC_QUEUE_NAME, { keyPath: 'timestamp' });
      }
    };
  });
}

// Background Sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

// Process queued requests
async function processSyncQueue() {
  try {
    const db = await openSyncDB();
    const transaction = db.transaction(SYNC_QUEUE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_NAME);
    const requests = await store.getAll();
    
    console.log('[SW] Processing', requests.length, 'queued requests');
    
    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.method !== 'GET' ? requestData.body : undefined
        });
        
        if (response.ok) {
          await store.delete(requestData.timestamp);
          console.log('[SW] Successfully synced request:', requestData.url);
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification support
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de CONSTRUCTORA WM/M&S',
    icon: '/assets/branding/logo-constructora-wm.jpg',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('CONSTRUCTORA WM/M&S', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('[SW] Service Worker loaded successfully');
