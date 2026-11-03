// Offline support in production builds only (a service worker would cache dev assets)
export default defineNuxtPlugin(() => {
  if (import.meta.dev || !('serviceWorker' in navigator)) return
  const base = useRuntimeConfig().app.baseURL
  navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {})
})
