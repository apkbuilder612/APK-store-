const SHELL_CACHE = "apkstore-shell-v1";
const DATA_CACHE = "apkstore-data-v1";
const IMAGE_CACHE = "apkstore-images-v1";

const SHELL_ASSETS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const keep = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Never cache: APK binaries, auth endpoints, upload endpoints.
function isNeverCache(url) {
  return (
    url.pathname.startsWith("/api/download") ||
    url.pathname.startsWith("/api/upload") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("storage/v1/object")
  );
}

function isImage(request) {
  return request.destination === "image";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return; // never intercept writes
  if (isNeverCache(url)) return; // let network handle downloads/auth directly

  if (isImage(request)) {
    // Cache-first for icons/screenshots so previously viewed items work offline
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    // App shell / pages: network-first, fall back to cache, then offline page
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline");
        })
    );
    return;
  }

  // Supabase REST data (apk/pwa listings, details): stale-while-revalidate
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
