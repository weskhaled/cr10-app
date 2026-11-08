<script setup lang="ts">
const { t, setLocale } = useI18n()
const { locale } = useLocaleUi()
const { settings, cards, days } = useStudy()
const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Français', value: 'fr' },
  { label: 'العربية', value: 'ar' },
]
const toast = useToast()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function exportBackup() {
  const data = Object.fromEntries(STORAGE_KEYS.map((k) => [k, JSON.parse(localStorage.getItem(k) ?? 'null')]))
  const blob = new Blob(
    [JSON.stringify({ app: 'cr10-app', version: 1, exportedAt: new Date().toISOString(), data }, null, 2)],
    { type: 'application/json' },
  )
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `cr10-backup-${isoToday()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function importBackup(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  try {
    const backup = JSON.parse(await file.text())
    if (backup?.app !== 'cr10-app' || !backup.data) throw new Error(t('settings.notBackup'))
    if (!confirm(t('settings.confirmImport'))) return
    for (const k of STORAGE_KEYS) {
      if (backup.data[k] != null) localStorage.setItem(k, JSON.stringify(backup.data[k]))
    }
    location.reload()
  } catch (err) {
    toast.add({ title: t('settings.importFailed'), description: err instanceof Error ? err.message : String(err), color: 'error' })
  }
}

function resetProgress() {
  if (!confirm(t('settings.confirmErase'))) return
  cards.value = {}
  days.value = {}
  toast.add({ title: t('settings.erased'), color: 'neutral' })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">{{ t('settings.title') }}</h1>

    <UCard>
      <template #header><h2 class="font-semibold">{{ t('nav.language') }}</h2></template>
      <USelect
        :model-value="locale"
        :items="LANGUAGES"
        icon="i-lucide-languages"
        class="w-48"
        @update:model-value="(code) => setLocale(code as 'en' | 'fr' | 'ar')"
      />
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">{{ t('settings.dates') }}</h2></template>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField :label="t('settings.expiry')" :help="t('settings.expiryHelp')">
          <UInput v-model="settings.expiry" type="date" class="w-full" />
        </UFormField>
        <UFormField :label="t('settings.civic')" :help="t('settings.notBookedHelp')">
          <UInput v-model="settings.civicExam" type="date" class="w-full" />
        </UFormField>
        <UFormField :label="t('settings.french')" :help="t('settings.notBookedHelp')">
          <UInput v-model="settings.frenchExam" type="date" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">{{ t('settings.data') }}</h2></template>
      <div class="space-y-3 text-sm">
        <p class="text-muted">{{ t('settings.dataText') }}</p>
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-download" @click="exportBackup">{{ t('settings.export') }}</UButton>
          <UButton icon="i-lucide-upload" variant="outline" @click="fileInput?.click()">{{ t('settings.import') }}</UButton>
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="importBackup">
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" class="ms-auto" @click="resetProgress">
            {{ t('settings.erase') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
