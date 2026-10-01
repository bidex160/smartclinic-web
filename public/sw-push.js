/* SmartClinic web push service worker.
 * Shows the title the API sends with a generic body; health details never
 * travel in the push message and are only visible after opening the app. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {};
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'SmartClinic';
  const url = typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/me/notifications';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: 'Open SmartClinic to see it.',
      icon: '/assets/fanvico.png',
      badge: '/assets/fanvico.png',
      tag: typeof data.tag === 'string' ? data.tag : 'smartclinic',
      data: { url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/me/notifications', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
          return client.focus().then((focused) => (focused && 'navigate' in focused ? focused.navigate(target) : focused));
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
