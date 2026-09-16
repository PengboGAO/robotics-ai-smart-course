const CACHE_NAME = "robotics-smart-course-v12";
const MESH_FRAMES = Array.from({length:31},(_,index)=>`./resources/abb/mesh-frames/irb1200-valid-${String(index).padStart(2,"0")}.png`);
const CORE = ["./","./index.html","./assets/styles.css","./assets/lifecycle.css","./assets/runtime-config.js","./assets/course-data.js","./assets/knowledge-system.js","./assets/question-bank.js","./assets/app.js","./assets/lifecycle.js","./assets/knowledge-graph.json","./assets/knowledge-extensions.json","./resources/knowledge/viewer.html","./resources/knowledge/knowledge.css","./resources/knowledge/viewer.js","./resources/abb/mesh-frames/manifest.json","./manifest.webmanifest",...MESH_FRAMES];
const NETWORK_FIRST = /\.(?:html|css|js|json|webmanifest)$/i;
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil((async () => {
  const keys = await caches.keys();
  const previousCourseCaches = keys.filter(key => key !== CACHE_NAME && key.startsWith("robotics-smart-course-v"));
  await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
  await self.clients.claim();
  if (previousCourseCaches.length) {
    const windows = await self.clients.matchAll({type:"window",includeUncontrolled:true});
    await Promise.all(windows.map(client => client.navigate(client.url)));
  }
})()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(async () => (await caches.match(event.request)) || caches.match("./index.html")));
    return;
  }
  if (NETWORK_FIRST.test(new URL(event.request.url).pathname)) {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response;
  })));
});
