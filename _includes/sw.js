const cacheName = 'burgyn-{{ site.cache_version }}';
const offlineUrl = 'offline.html';

self.addEventListener('install', evt => {
    self.skipWaiting(); // Prevezme kontrolu ihneď po inštalácii
    evt.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                offlineUrl,
                '/',
                '/about/',
                '/assets/css/main.css',
                '/assets/main.css',
                '/assets/images/cover.gif',
                '/assets/android-chrome-192x192.png'
            ]);
        })
    );
});

self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== cacheName)
                .map(key => caches.delete(key))
            );
        }).then(() => {
            self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function(event) {
    // Check if the request is a GET request.
    if (event.request.method === "GET") {
        event.respondWith(
            fetch(event.request).then(function(response) {
                // If a valid response is received, clone it and store it in the cache.
                var responseClone = response.clone();
                caches.open(cacheName).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            }).catch(function() {
                // On failure, try to return the cached response.
                return caches.match(event.request).then(function(response) {
                    if (response) {
                        return response;
                    }
                    // If the request is for a navigation to a new page,
                    // return the offline.html page if available in the cache.
                    if (event.request.mode === 'navigate') {
                        return caches.match('offline.html');
                    }
                });
            })
        );
    }
});
