const CACHE_NAME = 'music-pwa-v3';

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(['index.html', 'manifest.json']))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.includes('.mp3')) {
        e.respondWith(
            caches.match(e.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Sửa lỗi cú pháp chia nhỏ file (Range Request) cho Safari và Chrome
                    const rangeHeader = e.request.headers.get('Range');
                    if (rangeHeader) {
                        const parts = rangeHeader.replace(/bytes=/, "").split("-");
                        return cachedResponse.blob().then((blob) => {
                            const total = blob.size;
                            const start = parseInt(parts[0], 10);
                            const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
                            
                            const chunk = blob.slice(start, end + 1);
                            return new Response(chunk, {
                                status: 206,
                                statusText: 'Partial Content',
                                headers: new Headers({
                                    'Content-Type': 'audio/mpeg',
                                    'Accept-Ranges': 'bytes',
                                    'Content-Range': `bytes ${start}-${end}/${total}`,
                                    'Content-Length': chunk.size
                                })
                            });
                        });
                    }
                    return cachedResponse;
                }
                
                // Nếu chưa có trong bộ nhớ, tải từ mạng về và lưu lại
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
