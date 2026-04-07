const CACHE_NAME = 'forexyemeni-v1';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - precache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
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

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ═══ Push Notification Event ═══
self.addEventListener('push', (event) => {
  let data = { title: 'ForexYemeni Pro', body: 'إشعار جديد', icon: '/icon-192.png', type: 'general' };

  try {
    data = { ...data, ...event.data.json() };
  } catch {}

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    tag: data.tag || 'forexyemeni-' + Date.now(),
    renotify: true,
    data: data,
    actions: data.type === 'signal' ? [
      { action: 'view', title: 'عرض' },
      { action: 'dismiss', title: 'إغلاق' }
    ] : [
      { action: 'dismiss', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ═══ Notification Click Event ═══
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('forex-yemeni-pro') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
