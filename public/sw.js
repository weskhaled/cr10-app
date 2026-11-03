/* Service worker: audio clips cache-first (with Range support, needed by
   Safari for <audio>), app shell network-first with a cached fallback.
   Cache names must match app/utils/offline.ts. */
const APP_CACHE = 'cr10-app-v1'
const AUDIO_CACHE = 'cr10-audio-v1'
const SCOPE = new URL(self.registration.scope).pathname

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (![APP_CACHE, AUDIO_CACHE].includes(key)) await caches.delete(key)
    await self.clients.claim()
  })())
})

async function audioResponse(request) {
  const cache = await caches.open(AUDIO_CACHE)
  let response = await cache.match(request.url)
  if (!response) {
    response = await fetch(request.url) // full file, so it can be cached and sliced
    if (response.status !== 200) return response
    await cache.put(request.url, response.clone())
  }
  const range = request.headers.get('range')
  if (!range) return response
  const body = await response.arrayBuffer()
  const [, from, to] = /bytes=(\d*)-(\d*)/.exec(range) || []
  const start = from ? Number(from) : 0
  const end = to ? Math.min(Number(to), body.byteLength - 1) : body.byteLength - 1
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'audio/mp4',
      'Content-Range': `bytes ${start}-${end}/${body.byteLength}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  })
}

async function shellResponse(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const copy = response.clone()
      caches.open(APP_CACHE).then((cache) => cache.put(request, copy))
    }
    return response
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached
    // offline navigation to any route: the client-side app handles it from the start page
    if (request.mode === 'navigate') return (await caches.match(SCOPE)) || Response.error()
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(new URL(request.url).pathname.startsWith(`${SCOPE}audio/`) ? audioResponse(request) : shellResponse(request))
})
