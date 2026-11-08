<script setup lang="ts">
// install-to-home-screen metadata, prefixed with the base URL (GitHub Pages sub-path)
const base = useRuntimeConfig().app.baseURL
useHead({
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

const links = [
  { label: 'Today', to: '/', icon: 'i-lucide-sun' },
  { label: 'Listen', to: '/listen', icon: 'i-lucide-headphones' },
  { label: 'Official questions', to: '/official', icon: 'i-lucide-landmark' },
  { label: 'Level check', to: '/level', icon: 'i-lucide-gauge' },
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' },
]
</script>

<template>
  <UApp>
    <UHeader title="Objectif 10 ans" to="/">
      <UNavigationMenu :items="links" />
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
