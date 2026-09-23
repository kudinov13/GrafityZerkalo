self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (self.caches ? self.caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) { return self.caches.delete(key) }))
    }) : Promise.resolve())
      .then(function () { return self.registration.unregister() })
      .then(function () { return self.clients.claim() }),
  )
})

self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request))
})
