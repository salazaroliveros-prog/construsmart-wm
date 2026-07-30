# PWA & 100% OFFLINE SYNCHRONIZATION GUIDE
## CONSTRUCTORA WM/M&S - SYSTEM ARCHITECTURE

This document establishes the Service Worker, Cache, and Background Sync guidelines using `@ducanh2912/next-pwa` and `Dexie.js`.

---

## 1. NEXT.JS CONFIGURATION (`next.config.js`)

```javascript
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextType} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
```

---

## 2. SYNC STRATEGY (BACKGROUND SYNC & OUTBOX)

1. **Read Operations:**
   - The UI always reads first from local Dexie.js cache for maximum speed.
   - Background revalidation checks Supabase when network is online (*Stale-While-Revalidate*).

2. **Write Operations (Budgets & Expenses):**
   - If `navigator.onLine` is false:
     1. Save entity to Dexie.js with `sync_status = 'pending'`.
     2. Enqueue item in local `sync_queue` table.
     3. Show toast notification: *"Guardado en modo Offline. Se sincronizará al detectar conexión."*
   - When online listener fires (`window.addEventListener('online')`):
     1. Iterate through `sync_queue`.
     2. Push items sequentially to Supabase REST API.
     3. Update status in Dexie.js to `'synced'`.
