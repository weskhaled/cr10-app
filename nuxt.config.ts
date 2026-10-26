// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@vueuse/nuxt'],
  // all state lives in the browser (localStorage) → client-only app, static output
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Objectif 10 ans',
      meta: [{ name: 'description', content: 'Daily prep for the carte de résident: civic exam + French B1.' }],
    },
  },
  ui: {
    fonts: false, // no external font download — works offline
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
