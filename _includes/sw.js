const cacheName = 'burgyn-{{ site.cache_version }}';

// Install event
self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/about/',
            ]);
        })
    );
});

self.addEventListener('activate', evt => {
    console.log('service worker has been activated');
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== cacheName)
                .map(key => {
                    console.log('deleting cache', key);
                    return caches.delete(key);
                
                })
            );
        })
    );
});

self.addEventListener('fetch', evt => {
    if (!evt.request.url.includes('manifest.json') && !evt.request.url.endsWith('sw.js')) {
        evt.respondWith(
            caches.match(evt.request).then(cacheRes => {
                return cacheRes || fetch(evt.request).then(fetchRes => {
                    return caches.open(cacheName).then(cache => {
                        if (!evt.request.url.endsWith('sw.js')) {
                            cache.put(evt.request.url, fetchRes.clone());
                        }
                        return fetchRes;
                    });
                });
            })
        );
    }
});
