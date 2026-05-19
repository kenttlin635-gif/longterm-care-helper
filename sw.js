// 定義快取名稱與版本
const CACHE_NAME = "ltc-query-v2";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// 安裝階段：將網頁本體與必備資源寫入手機快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell and assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // 強制讓新的 Service Worker 立即生效
  self.skipWaiting();
});

// 自訂激活階段：清理舊版本的快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Clearing old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 攔截請求：當沒網路時，從快取撈出網頁本體
self.addEventListener("fetch", (event) => {
  // 僅攔截同源的靜態檔案請求，不攔截 Google Sheets 的外網資料請求（資料由 localStorage 處理）
  if (event.request.url.includes("google.com") || event.request.url.includes("docs.google")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});