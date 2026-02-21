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
            badge: '/icons/badge-96.png',
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
        const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;

        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
                let matchingClient = null;
                for (let i = 0; i < windowClients.length; i++) {
                    const windowClient = windowClients[i];
                    if (windowClient.url === urlToOpen || windowClient.url.includes(urlToOpen)) {
                        matchingClient = windowClient;
                        break;
                    }
                }
                if (matchingClient) {
                    return matchingClient.focus();
                } else {
                    return self.clients.openWindow(urlToOpen);
                }
            })
        );
    }
});
