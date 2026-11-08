<script setup lang="ts">
import { ar, en, fr } from '@nuxt/ui/locale'

const { t, setLocale } = useI18n()
const { locale, dir } = useLocaleUi()
const UI_LOCALES = { ar, en, fr }
const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'العربية', value: 'ar' },
]

// install-to-home-screen metadata, prefixed with the base URL (GitHub Pages sub-path)
const base = useRuntimeConfig().app.baseURL
useHead({
  htmlAttrs: { lang: locale, dir },
  link: [
    { rel: 'manifest', href: `${base}manifest.webmanifest` },
    { rel: 'apple-touch-icon', href: `${base}icons/apple-touch-icon.png` },
  ],
  meta: [
    { name: 'theme-color', content: '#000091' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-title', content: 'Objectif 10 ans' },
  ],
})

const links = computed(() => [
  { label: t('nav.today'), to: '/', icon: 'i-lucide-sun' },
  { label: t('nav.listen'), to: '/listen', icon: 'i-lucide-headphones' },
  { label: t('nav.official'), to: '/official', icon: 'i-lucide-landmark' },
  { label: t('nav.level'), to: '/level', icon: 'i-lucide-gauge' },
  { label: t('nav.settings'), to: '/settings', icon: 'i-lucide-settings' },
])
</script>

<template>
  <UApp :locale="UI_LOCALES[locale as keyof typeof UI_LOCALES]">
    <UHeader title="Objectif 10 ans" to="/">
      <UNavigationMenu :items="links" />
      <template #right>
        <USelect
          :model-value="locale"
          :items="LANGUAGES"
          icon="i-lucide-languages"
          size="sm"
          variant="ghost"
          class="w-32"
          :aria-label="t('nav.language')"
          @update:model-value="(code) => setLocale(code as 'en' | 'fr' | 'ar')"
        />
      </template>
      <template #body>
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>
    <UMain>
      <UContainer class="max-w-3xl py-6">
        <NuxtPage />
      </UContainer>
    </UMain>
  </UApp>
</template>
