self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('message', (e) => {
  const { title, body, tag, url } = e.data || {};
  self.registration.showNotification(title || 'موهوبين نينوى', {
    body: body || '',
    icon: '/school-logo.jpg',
    badge: '/school-logo.jpg',
    tag: tag || 'default',
    vibrate: [300, 100, 300],
    data: { url: url || '/notifications' }
  });
});

self.addEventListener('push', (e) => {
  let data = { title: 'موهوبين نينوى', body: '', url: '/notifications' };
  if (e.data) {
    try {
      const raw = e.data.json();
      if (raw.notification) {
        data.title = raw.notification.title || data.title;
        data.body = raw.notification.body || data.body;
        data.url = raw.notification.click_action || raw.fcm_options?.link || '/notifications';
      } else {
        data.title = raw.title || data.title;
        data.body = raw.body || data.body;
      }
    } catch {
      try { data.body = e.data.text(); } catch {}
    }
  }
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/school-logo.jpg',
    badge: '/school-logo.jpg',
    tag: 'new-notification',
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: { url: data.url }
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/notifications';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    for (const client of clients) {
      if (client.url.includes(self.location.origin) && 'focus' in client) {
        client.navigate(url);
        return client.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
