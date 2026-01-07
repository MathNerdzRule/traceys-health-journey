self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic check logic for background notifications
// Note: Browsers may throttle setInterval in service workers, 
// but this is more robust than the main thread.
setInterval(() => {
  // We check for expired timers in IndexedDB or similar here if we had them,
  // but for now, the main thread will 'push' the notification request.
}, 10000);

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delayMs, tag } = event.data;
    
    // We use a timeout in the worker. While not 100% guaranteed if the phone 
    // goes into deep sleep, it's the best local-only method available.
    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200, 100, 200],
        tag: tag,
        renotify: true,
        requireInteraction: true
      });
    }, delayMs);
  }
});
