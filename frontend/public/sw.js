const CACHE_NAME = "airnation-v2";
const PRECACHE_URLS = ["/", "/register", "/login", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

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
        })
      )
  );
});

// ─── Push Notifications ───────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  console.log("[SW] push recibido", event.data?.text?.() ?? "sin data");

  if (!event.data) {
    console.log("[SW] push sin data, ignorando");
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = {
      title: "AirNation",
      body: event.data.text(),
      url: "/dashboard/perfil?tab=notificaciones",
    };
  }

  const title = payload.title || "AirNation";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/dashboard/perfil?tab=notificaciones" },
    vibrate: [100, 50, 100],
    requireInteraction: false,
    tag: "airnation-push",
  };

  console.log("[SW] mostrando notificacion:", title, options.body);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log("[SW] notificacion mostrada OK"))
      .catch((err) => console.error("[SW] error mostrando notificacion:", err))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard/perfil?tab=notificaciones";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("airnation.online") && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
