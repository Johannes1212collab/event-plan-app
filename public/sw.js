// Explicit PWA compliance listeners
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Required empty fetch listener for PWA installability on older Androids
});

// Push notification payload listener
self.addEventListener('push', function (event) {
    if (event.data) {
        let data;
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Alert', body: event.data.text() };
        }

        const options = {
            body: data.body,
            icon: data.icon || '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                url: data.url || '/'
            },
        };

        event.waitUntil(self.registration.showNotification(data.title || "EventHub", options));
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
