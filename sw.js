// 離線快取：第一次連網開啟後，之後沒網路也能開啟（更新網站內容時請把 VER 改一個新字串）
const VER = 'trip-v1';
const CORE = ['./', 'index.html', 'app.js', 'style.css', 'firebase-config.js', 'manifest.json',
  'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'sticker-cart.png', 'sticker-done.png', 'sticker-todo.png', 'sticker-todo-done.png',
  'cat-prep.png', 'cat-food.png', 'cat-clothes.png', 'cat-beauty.png', 'cat-ticket.png', 'cat-other.png'];
const CDN = ['cdn.tailwindcss.com', 'unpkg.com', 'cdn.jsdelivr.net', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const LIBS = ['https://cdn.tailwindcss.com/3.4.16', 'https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Zen+Maru+Gothic:wght@500;700&display=swap'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(
    CORE.concat(LIBS).map(u => c.add(u).catch(() => {}))
  )).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const same = u.origin === location.origin;
  if (!same && !CDN.includes(u.hostname)) return; // 天氣、匯率、Firestore 等 API 不快取
  const put = res => { if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(VER).then(c => c.put(r, cp)); } return res; };
  if (same) {
    // 自己的檔案：有網路用最新的（最多等 4 秒），沒網路用快取
    e.respondWith(new Promise(resolve => {
      const t = setTimeout(() => caches.match(r, { ignoreSearch: true }).then(m => m && resolve(m)), 4000);
      fetch(r).then(put).then(res => { clearTimeout(t); resolve(res); })
        .catch(() => { clearTimeout(t); caches.match(r, { ignoreSearch: true }).then(m => resolve(m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))); });
    }));
  } else {
    // 外部函式庫與字型：快取優先
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(put)));
  }
});
