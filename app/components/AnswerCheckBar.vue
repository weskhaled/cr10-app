<script setup lang="ts">
/* Status of a drafted official answer + your check against the fiche. */
const props = defineProps<{ id: string; verified?: boolean; fiche?: string | null; note?: string }>()

const { t } = useI18n()
const { checks, setCheck } = useStudy()
const status = computed(() => checks.value[props.id]?.status)

const BADGE = {
  ok: { color: 'success', label: 'check.byYou' },
  flagged: { color: 'error', label: 'check.flaggedBadge' },
  none: { color: 'warning', label: 'check.draft' },
} as const
const badge = computed(() => BADGE[status.value ?? 'none'])
</script>

<template>
  <div class="flex flex-wrap items-center gap-2 text-sm">
    <UBadge v-if="verified && status !== 'flagged'" color="success" variant="subtle" icon="i-lucide-badge-check" :label="t('check.verified')" />
    <UBadge v-else :color="badge.color" variant="subtle" :label="t(badge.label)" />
    <ULink v-if="fiche" :to="fiche" target="_blank" class="inline-flex items-center gap-1 text-primary underline">
      {{ t('check.fiche') }} <UIcon name="i-lucide-external-link" class="size-3.5" />
    </ULink>
    <span v-else class="text-muted">{{ t('check.noFiche') }}</span>
    <UTooltip v-if="note && !verified" :text="note">
      <UBadge color="error" variant="outline" icon="i-lucide-search-check" :label="t('check.checkFirst')" />
    </UTooltip>
    <div v-if="!verified || status === 'flagged'" class="ms-auto flex flex-wrap gap-1">
      <UButton
        size="xs"
        color="success"
        icon="i-lucide-check"
        :variant="status === 'ok' ? 'solid' : 'outline'"
        @click="setCheck(id, status === 'ok' ? null : 'ok')"
      >
        {{ t('check.matches') }}
      </UButton>
      <UButton
        size="xs"
        color="error"
        icon="i-lucide-flag"
        :variant="status === 'flagged' ? 'solid' : 'outline'"
        @click="setCheck(id, status === 'flagged' ? null : 'flagged')"
      >
        {{ t('check.wrong') }}
      </UButton>
    </div>
  </div>
</template>
