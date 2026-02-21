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

        event.waitUntil(
            self.registration.getNotifications().then(notifications => {
                if (notifications.length >= 5) {
                    // Sort by timestamp (oldest first)
                    notifications.sort((a, b) => (a.data?.dateOfArrival || 0) - (b.data?.dateOfArrival || 0));
                    // Close enough to get under the limit (leave exactly 4 before adding the 5th)
                    const amountToClose = notifications.length - 4;
                    for (let i = 0; i < amountToClose; i++) {
                        notifications[i].close();
                    }
                }
                return self.registration.showNotification(data.title || "EventHub", options);
            })
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
