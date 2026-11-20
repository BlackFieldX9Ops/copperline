const CACHE = 'copperline-v2'
const ASSETS = ['index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true })
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE)
          await cache.put(request, response.clone())
        }
        return response
      } catch {
        const fallback = await caches.match('index.html')
        if (fallback) return fallback
        return new Response('Copperline is offline.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }
    })(),
  )
})
