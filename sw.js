const CACHE_NAME = "offline-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/index2.html",
  "/index3.html",
  "/index4.html",
  "/index5.html",
  "/style.css",
  "/app.js",
  "/ahmed.jpg",
  "/ali.png",
  "/nadr.jpg",
  "/riyadh.jpg"
];

// تثبيت الـ Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// جلب الملفات (تشغيل بدون إنترنت)
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
