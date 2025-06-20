const CACHE_NAME = 'cineprime-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/movie-details.html',
  '/style.css',
  '/details.css',
  '/script.js',
  '/details.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});