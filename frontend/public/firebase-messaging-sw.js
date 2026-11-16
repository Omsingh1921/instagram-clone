/* eslint-disable no-restricted-globals */
// Firebase Cloud Messaging Service Worker for Instagram Clone Web Push

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    try {
      data = { body: event.data ? event.data.text() : 'You have a new Instagram notification' };
    } catch {
      data = {};
    }
  }

  const notificationTitle = data.notification?.title || data.title || 'Instagram';
  const notificationOptions = {
    body: data.notification?.body || data.body || 'You have a new notification.',
    icon: data.notification?.icon || data.avatarUrl || '/favicon.ico',
    badge: '/favicon.ico',
    image: data.imageUrl || data.mediaUrl || null,
    data: data.data || data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

// Handle notification click: focus existing window or open new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const payloadData = event.notification.data || {};
  let targetUrl = '/';

  if (payloadData.conversationId) {
    targetUrl = `/messages?conversationId=${payloadData.conversationId}`;
  } else if (payloadData.postId) {
    targetUrl = `/p/${payloadData.postId}`;
  } else if (payloadData.url) {
    targetUrl = payloadData.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

