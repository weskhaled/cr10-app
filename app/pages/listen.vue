<script setup lang="ts">
const { t } = useI18n()
const { settings, logListen } = useStudy()
const { mix, src, allSources, clipCount } = useMorningMix()
const base = useRuntimeConfig().app.baseURL
const toast = useToast()

const COMMUTE = computed(() => [10, 15, 20, 30, 45].map((m) => ({ label: t('common.minutes', { n: m }), value: m })))
const minutes = computed(() => totalMinutes(mix.value))

const saving = ref(false)
const savedInMix = ref(0)
const offlineReady = canCache()

async function refreshSaved() {
  if (offlineReady) savedInMix.value = await cachedCount(mix.value.map((c) => src(c.id)))
}
onMounted(refreshSaved)
watch(mix, refreshSaved)

async function save(all: boolean) {
  saving.value = true
  try {
    await saveForOffline(base, all ? allSources : mix.value.map((c) => src(c.id)))
    await refreshSaved()
    toast.add({ title: all ? t('listen.savedAllToast', { n: clipCount }) : t('listen.savedMixToast'), color: 'success' })
  } catch (err) {
    toast.add({ title: t('listen.saveFailed'), description: err instanceof Error ? err.message : String(err), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">{{ t('listen.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('listen.intro') }}</p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UFormField :label="t('listen.commute')" :ui="{ root: 'flex items-center gap-2', label: 'text-sm' }">
        <USelect v-model="settings.commuteMin" :items="COMMUTE" class="w-28" />
      </UFormField>
      <USwitch v-model="settings.verifiedAudioOnly" :label="t('listen.verifiedOnly')" />
      <span class="ms-auto text-sm text-muted">{{ t('listen.summary', { clips: mix.length, min: minutes }) }}</span>
    </div>

    <UAlert
      v-if="!mix.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-volume-x"
      :title="settings.verifiedAudioOnly ? t('listen.noVerifiedTitle') : t('listen.noClipsTitle')"
      :description="settings.verifiedAudioOnly ? t('listen.noVerifiedText') : t('listen.noClipsText')"
    />
    <AudioPlayer v-else :clips="mix" :src="src" @listened="logListen()" />

    <UCard>
      <template #header><h2 class="font-semibold">{{ t('listen.offlineTitle') }}</h2></template>
      <div class="space-y-3 text-sm">
        <p v-if="offlineReady">{{ t('listen.saved', { saved: savedInMix, total: mix.length }) }}</p>
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-download" :loading="saving" :disabled="!offlineReady || !mix.length" @click="save(false)">{{ t('listen.saveMix') }}</UButton>
          <UButton icon="i-lucide-hard-drive-download" variant="outline" :loading="saving" :disabled="!offlineReady" @click="save(true)">
            {{ t('listen.saveAll', { n: clipCount }) }}
          </UButton>
        </div>
        <p class="text-xs text-muted">{{ t('listen.iosHint') }}</p>
      </div>
    </UCard>
  </div>
</template>
