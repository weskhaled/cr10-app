// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@vueuse/nuxt', '@nuxtjs/i18n'],
  // all state lives in the browser (localStorage) → client-only app, static output
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Objectif 10 ans',
      meta: [{ name: 'description', content: 'Daily prep for the carte de résident: civic exam + French B1.' }],
    },
  },
  // dynamic routes the crawler can't find: give them a real page (200, cacheable offline)
  nitro: {
    prerender: { routes: ['/session/civic', '/session/french'] },
  },
  // interface in English, French or Arabic (right-to-left); exam content stays in French
  i18n: {
    strategy: 'no_prefix',
    vueI18n: './i18n.config.ts', // plural rules (fr, ar)
    defaultLocale: 'en',
    locales: [
      { code: 'en', language: 'en-GB', name: 'English', dir: 'ltr', file: 'en.json' },
      { code: 'fr', language: 'fr-FR', name: 'Français', dir: 'ltr', file: 'fr.json' },
      { code: 'ar', language: 'ar', name: 'العربية', dir: 'rtl', file: 'ar.json' },
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'cr10_lang', redirectOn: 'root', fallbackLocale: 'en' },
  },
  ui: {
    fonts: false, // no external font download — works offline
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
