<script setup lang="ts">
const { settings, cards, days } = useStudy()
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
    if (backup?.app !== 'cr10-app' || !backup.data) throw new Error('This file is not a cr10-app backup.')
    if (!confirm('Replace your current progress with this backup?')) return
    for (const k of STORAGE_KEYS) {
      if (backup.data[k] != null) localStorage.setItem(k, JSON.stringify(backup.data[k]))
    }
    location.reload()
  } catch (err) {
    toast.add({ title: 'Import failed', description: err instanceof Error ? err.message : String(err), color: 'error' })
  }
}

function resetProgress() {
  if (!confirm('Erase all study progress (cards and daily log)? Your dates are kept.')) return
  cards.value = {}
  days.value = {}
  toast.add({ title: 'Progress erased', color: 'neutral' })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">Settings</h1>

    <UCard>
      <template #header><h2 class="font-semibold">Dates</h2></template>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField label="Titre de séjour expires" help="From your current card.">
          <UInput v-model="settings.expiry" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Civic exam" help="Leave empty if not booked.">
          <UInput v-model="settings.civicExam" type="date" class="w-full" />
        </UFormField>
        <UFormField label="TCF / TEF IRN" help="Leave empty if not booked.">
          <UInput v-model="settings.frenchExam" type="date" class="w-full" />
        </UFormField>
      </div>
    </UCard>

    <UCard>
      <template #header><h2 class="font-semibold">Your data</h2></template>
      <div class="space-y-3 text-sm">
        <p class="text-muted">
          Progress is saved in this browser only. On iPhone, Safari can erase it after 7 days without a visit
          unless the app is added to the home screen — export a backup regularly.
        </p>
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-download" @click="exportBackup">Export backup</UButton>
          <UButton icon="i-lucide-upload" variant="outline" @click="fileInput?.click()">Import backup</UButton>
          <input ref="fileInput" type="file" accept="application/json" class="hidden" @change="importBackup">
          <UButton icon="i-lucide-trash-2" color="error" variant="ghost" class="ms-auto" @click="resetProgress">
            Erase progress
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
