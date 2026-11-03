<script setup lang="ts">
const links = [
  { label: 'Today', to: '/', icon: 'i-lucide-sun' },
  { label: 'Official list', to: '/official', icon: 'i-lucide-list-checks' },
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
