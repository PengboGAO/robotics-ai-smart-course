const CACHE_NAME = "robotics-smart-course-v2";
const CORE = ["./","./index.html","./assets/styles.css","./assets/runtime-config.js","./assets/course-data.js","./assets/app.js","./manifest.webmanifest"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response;
  }).catch(() => caches.match("./index.html"))));
});
