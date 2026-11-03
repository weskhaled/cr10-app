/* Offline storage for the PWA. The cache names must match public/sw.js. */
export const APP_CACHE = 'cr10-app-v1'
export const AUDIO_CACHE = 'cr10-audio-v1'

export const canCache = (): boolean => typeof window !== 'undefined' && 'caches' in window

/** Saves the app shell (page + loaded scripts/styles) and the given clips; returns how many clips are cached. */
export async function saveForOffline(base: string, audioUrls: string[]): Promise<number> {
  const origin = location.origin
  const shell = new Set([new URL(base, origin).href, location.href])
  for (const e of performance.getEntriesByType('resource')) {
    if (e.name.startsWith(origin) && e.name.includes('/_nuxt/')) shell.add(e.name)
  }
  await (await caches.open(APP_CACHE)).addAll([...shell])

  const audio = await caches.open(AUDIO_CACHE)
  const missing: string[] = []
  for (const url of audioUrls) if (!(await audio.match(url))) missing.push(url)
  for (let i = 0; i < missing.length; i += 6) await audio.addAll(missing.slice(i, i + 6))
  return cachedCount(audioUrls)
}

export async function cachedCount(audioUrls: string[]): Promise<number> {
  if (!canCache()) return 0
  const audio = await caches.open(AUDIO_CACHE)
  let n = 0
  for (const url of audioUrls) if (await audio.match(url)) n++
  return n
}
