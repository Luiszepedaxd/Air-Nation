const CACHE_NAME = "airnation-v1";
const PRECACHE_URLS = ["/", "/register", "/login", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Do not intercept Next.js internal traffic or non-GET requests.
 * RSC and /_next/ must reach the network without cache fallbacks that can
 * yield a non-Response and break respondWith.
 */
function shouldPassthroughFetch(request) {
  if (request.method !== "GET") return true;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return true;
  }
  if (url.searchParams.has("_rsc")) return true;
  if (url.pathname.includes("/_next/")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  if (shouldPassthroughFetch(event.request)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request);
        }),
      ),
  );
});
