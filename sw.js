const CACHE_NAME = "my-koi-garden-pwa-v8";
const WORDMARK_WEBP = "/assets/logo-wordmark-transparent.webp";
const WORDMARK_PNG = "/assets/logo-wordmark-transparent.png";
const CORE_ASSETS = [
  "/",
  "/styles.css",
  "/app.js",
  "/community.html",
  "/community.js",
  "/local-community.js",
  "/admin/sales.html",
  "/admin/sales-admin.js",
  "/sale-listings.js",
  WORDMARK_WEBP,
  "/assets/logo-icon-transparent.png",
  "/assets/koi-garden-hero-seo-tablet.webp",
  "/assets/koi-garden-hero-seo.jpg"
];

async function precacheAssets() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(CORE_ASSETS);

  // Earlier installs already cached the PNG. Keep it for pages opened before the update.
  const previousLogo = await caches.match(WORDMARK_PNG);
  if (previousLogo) {
    await cache.put(WORDMARK_PNG, previousLogo);
  } else {
    // Fresh installs only need the PNG offline if the WebP decoder is unavailable.
    const webp = await cache.match(WORDMARK_WEBP);
    try {
      const bitmap = await createImageBitmap(await webp.blob());
      bitmap.close();
    } catch {
      await cache.add(WORDMARK_PNG);
    }
  }
  await self.skipWaiting();
}

self.addEventListener("install", (event) => event.waitUntil(precacheAssets()));

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.method === "GET" && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
