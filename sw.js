const CACHE_NAME = 'offline-music-v2';

// Tải trước giao diện
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(['index.html', 'manifest.json']))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

// Xử lý tải nhạc dung lượng lớn cho cả iPhone (Safari) và Android
self.addEventListener('fetch', (e) => {
    if (e.request.url.includes('.mp3')) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Tạo phản hồi Range Request giả lập từ bộ nhớ cache để Safari không bị lỗi
                    const pos = e.request.headers.get('Range') ? parseInt(e.request.headers.get('Range').split('=')[1].split('-')[0]) : 0;
                    return cachedResponse.blob().then((blob) => {
                        const total = blob.size;
                        const status = e.request.headers.get('Range') ? 206 : 200;
                        const headers = new Headers({
                            'Content-Type': 'audio/mpeg',
                            'Accept-Ranges': 'bytes',
                            'Content-Length': String(total - pos)
                        });
                        if (e.request.headers.get('Range')) {
                            headers.set('Content-Range', `bytes ${pos}-${total - 1}/${total}`);
                        }
                        return new Response(blob.slice(pos), { status, headers });
                    });
                }
                
                // Nếu chưa có trong máy, tiến hành tải ngầm từ mạng và lưu lại
                return fetch(e.request).then((networkResponse) => {
                    if (networkResponse.status === 200 || networkResponse.status === 206) {
                        const cacheCopy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, cacheCopy));
                    }
                    return networkResponse;
                });
            })
        );
    } else {
        e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
    }
});
