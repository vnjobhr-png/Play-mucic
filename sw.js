const CACHE_NAME = 'offline-music-v1';

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(['index.html', 'manifest.json']);
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Chỉ xử lý lưu cache với các file nhạc .mp3
    if (e.request.url.includes('.mp3')) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Nếu máy đã tải rồi thì lấy từ bộ nhớ ra phát luôn
                }
                return fetch(e.request).then((networkResponse) => {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, cacheCopy); // Lưu bản sao vào bộ nhớ điện thoại cho lần sau
                    });
                    return networkResponse;
                });
            })
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((response) => response || fetch(e.request))
        );
    }
});
