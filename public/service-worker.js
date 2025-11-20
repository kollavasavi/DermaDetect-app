// service-worker.js - FIXED for ngrok
// This file goes in: backend/frontend/public/service-worker.js

const CACHE_NAME = "dermadetect-v4";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

// ===========================================================
// INSTALL – cache app shell
// ===========================================================
self.addEventListener("install", (event) => {
  console.log("📦 Service Worker installing…");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📁 Caching app shell...");
      return Promise.allSettled(
        urlsToCache.map(url => 
          cache.add(new Request(url, { cache: "reload" }))
            .catch(e => console.warn(`Failed to cache ${url}:`, e))
        )
      );
    })
  );
  self.skipWaiting();
});

// ===========================================================
// ACTIVATE – delete old caches
// ===========================================================
self.addEventListener("activate", (event) => {
  console.log("⚡ Service Worker activating…");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("🗑 Removing old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  return self.clients.claim();
});

// ===========================================================
// FETCH HANDLER - Network-first for API, Cache-first for static
// ===========================================================
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Ignore non-HTTP requests
  if (!request.url.startsWith("http")) return;

  // === API REQUESTS → NETWORK FIRST ===
  if (
    request.url.includes("/api/") ||
    request.url.includes("/llm/") ||
    request.url.includes("5000") ||
    request.url.includes("5001")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return (
              cached ||
              new Response(
                JSON.stringify({
                  error: "Offline: Could not reach server",
                }),
                {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                }
              )
            );
          });
        })
    );
    return;
  }

  // === STATIC FILES → CACHE FIRST ===
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.destination === "document") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// ===========================================================
// SKIP_WAITING message
// ===========================================================
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("♻ Updating to new service worker…");
    self.skipWaiting();
  }
});