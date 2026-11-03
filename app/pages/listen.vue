<script setup lang="ts">
const { settings, logListen } = useStudy()
const { mix, src, allSources, clipCount } = useMorningMix()
const base = useRuntimeConfig().app.baseURL
const toast = useToast()

const COMMUTE = [10, 15, 20, 30, 45].map((m) => ({ label: `${m} min`, value: m }))
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
    toast.add({ title: all ? `All ${clipCount} clips saved for offline` : "Today's mix saved for offline", color: 'success' })
  } catch (err) {
    toast.add({ title: 'Could not save for offline', description: err instanceof Error ? err.message : String(err), color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Morning audio</h1>
      <p class="mt-1 text-sm text-muted">
        Today's new civic questions, the ones you missed, and a few French listening exercises — question, 3-second pause
        to answer in your head, then the answer. Made for the metro: it keeps playing with the screen off.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UFormField label="Commute" :ui="{ root: 'flex items-center gap-2', label: 'text-sm' }">
        <USelect v-model="settings.commuteMin" :items="COMMUTE" class="w-28" />
      </UFormField>
      <USwitch v-model="settings.verifiedAudioOnly" label="Verified answers only" />
      <span class="ms-auto text-sm text-muted">{{ mix.length }} clips · ≈ {{ minutes }} min</span>
    </div>

    <UAlert
      v-if="!mix.length"
      color="warning"
      variant="subtle"
      icon="i-lucide-volume-x"
      :title="settings.verifiedAudioOnly ? 'No verified answers yet' : 'No clips available'"
      :description="settings.verifiedAudioOnly ? 'Check answers on the Official list, or turn off “Verified answers only”.' : 'Generate them with: node scripts/audio/build.mjs'"
    />
    <AudioPlayer v-else :clips="mix" :src="src" @listened="logListen()" />

    <UCard>
      <template #header><h2 class="font-semibold">Offline (metro, plane)</h2></template>
      <div class="space-y-3 text-sm">
        <p v-if="offlineReady">
          <b>{{ savedInMix }} / {{ mix.length }}</b> clips of today's mix are saved on this device.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-download" :loading="saving" :disabled="!offlineReady || !mix.length" @click="save(false)">Save today's mix</UButton>
          <UButton icon="i-lucide-hard-drive-download" variant="outline" :loading="saving" :disabled="!offlineReady" @click="save(true)">
            Save all {{ clipCount }} clips (~30 MB)
          </UButton>
        </div>
        <p class="text-xs text-muted">
          On iPhone: open the app in Safari → Share → <b>Add to Home Screen</b>, then use it from the home-screen icon —
          it works offline there and Safari won't erase your progress.
        </p>
      </div>
    </UCard>
  </div>
</template>
