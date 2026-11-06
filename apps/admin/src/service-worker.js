/* eslint-disable no-restricted-globals */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING')
    self.skipWaiting();
});

self.addEventListener('push', async (event) => {
  const data = event.data
    ? event.data.json()
    : { title: 'Notification', body: '' };
  const { body, title, ...rest } = data;

  const url = self.location.pathname.replace('service-worker.js', '');

  event.waitUntil(
    self.registration.showNotification(title, {
      icon: `${url}icons/pwa-192x192.png`,
      body,
      data: { url, ...rest },
    }),
  );
});

self.addEventListener('notificationclick', async (event) => {
  const { notification } = event;
  const { data: { url } = {} } = notification;

  const focusClient = async () => {
    const wClients = await self.clients.matchAll();
    const wClient = wClients.find(client =>
      ['visible', 'hidden'].includes(client.visibilityState),
    );

    if (wClient) {
      wClient.navigate(url);
      wClient.focus();
    }
    else {
      self.clients.openWindow(url);
    }

    notification.close();
  };

  event.waitUntil(focusClient());
});
