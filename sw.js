/* ねこコード：ネットがなくても開けるようにする */
const VERSION = 'nekocode-v8';
const FILES = [
  './', 'index.html', 'css/app.css', 'manifest.webmanifest',
  'js/app.js', 'js/cloud.js', 'js/firebase-config.js', 'js/cats.js', 'js/problems.js', 'js/engine.js', 'js/runner-worker.js', 'vendor/acorn.js', 'vendor/prism.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 自分のファイル：まずネット、だめならキャッシュ（更新がすぐ反映されるように）
  if (url.origin === location.origin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; }).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  // フォント：キャッシュ優先
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.hostname === 'www.gstatic.com') {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  }
});
