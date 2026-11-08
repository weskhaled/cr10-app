<script setup lang="ts">
/* Official CR knowledge questions.
   Study: pick a theme, test yourself on each question (tap a proposition or
   "show the answer"), or practise the theme as a scored session.
   Check: go through the drafted answers and mark them against the fiche. */
const { checks, checkStats, cards } = useStudy()

const OFFICIAL_ITEMS = BANKS.civic.items.filter((i) => i.source === 'official-cr')

const mode = ref<'study' | 'check'>('study')
const theme = ref(BANKS.civic.themes[0]!.id)
const query = ref('')
const filter = ref<'checkFirst' | 'toCheck' | 'flagged' | 'checked' | 'all'>('checkFirst')
const FILTERS = [
  { label: 'Check first', value: 'checkFirst' },
  { label: 'To check', value: 'toCheck' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Checked / verified', value: 'checked' },
  { label: 'All', value: 'all' },
]

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function statusOf(id: string): 'toCheck' | 'flagged' | 'checked' {
  const s = checks.value[id]?.status
  if (s === 'flagged') return 'flagged'
  return OFFICIAL_ANSWERS[id]?.verified || s === 'ok' ? 'checked' : 'toCheck'
}
function matches(id: string) {
  if (filter.value === 'all') return true
  if (filter.value === 'checkFirst') return statusOf(id) === 'toCheck' && !!OFFICIAL_ANSWERS[id]?.note
  return statusOf(id) === filter.value
}

// your progress per theme (from the study cards)
const themes = computed(() =>
  BANKS.civic.themes.map((t) => {
    const items = OFFICIAL_ITEMS.filter((i) => i.theme === t.id)
    return {
      ...t,
      total: items.length,
      seen: items.filter((i) => cards.value[i.id]).length,
      mastered: items.filter((i) => isMastered(cards.value[i.id])).length,
    }
  }))
const current = computed(() => themes.value.find((t) => t.id === theme.value)!)

// study: the selected theme, or every theme while searching; check: by status
const list = computed(() => {
  const q = fold(query.value.trim())
  return OFFICIAL_ITEMS.filter((i) => {
    const hit = !q || fold(i.q).includes(q) || fold(i.options[0]!).includes(q)
    if (mode.value === 'check') return hit && matches(i.id)
    return q ? hit : i.theme === theme.value
  })
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold">Official questions (CR)</h1>
      <p class="mt-1 text-sm text-muted">
        The {{ OFFICIAL.count }} knowledge questions published by the ministry — 28 of the 40 exam questions come from
        this list (the 12 situational ones aren't published).
      </p>
    </div>

    <div class="flex gap-1 rounded-lg bg-elevated p-1">
      <UButton
        class="flex-1 justify-center"
        :variant="mode === 'study' ? 'solid' : 'ghost'"
        :color="mode === 'study' ? 'primary' : 'neutral'"
        icon="i-lucide-graduation-cap"
        @click="mode = 'study'"
      >
        Study
      </UButton>
      <UButton
        class="flex-1 justify-center"
        :variant="mode === 'check' ? 'solid' : 'ghost'"
        :color="mode === 'check' ? 'primary' : 'neutral'"
        icon="i-lucide-file-check"
        @click="mode = 'check'"
      >
        Check answers
        <UBadge v-if="checkStats.toCheck + checkStats.flagged" size="sm" color="warning" variant="solid" :label="checkStats.toCheck + checkStats.flagged" />
      </UButton>
    </div>

    <!-- ===== Study ===== -->
    <template v-if="mode === 'study'">
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Themes">
        <button
          v-for="t in themes"
          :key="t.id"
          type="button"
          role="tab"
          :aria-selected="t.id === theme && !query"
          class="rounded-full border px-3 py-1.5 text-sm transition"
          :class="t.id === theme && !query ? 'border-primary bg-primary text-inverted' : 'border-default hover:border-primary/60'"
          @click="theme = t.id; query = ''"
        >
          {{ t.label }} <span class="opacity-70">· {{ t.total }}</span>
        </button>
      </div>

      <UCard v-if="!query" :ui="{ body: 'p-3 sm:p-4' }">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold">{{ current.label }}</h2>
            <span class="shrink-0 text-xs text-muted">{{ current.seen }} seen · {{ current.mastered }} / {{ current.total }} mastered</span>
          </div>
          <UProgress :model-value="current.mastered" :max="current.total" size="sm" color="success" />
          <p class="text-xs text-muted">
            Tap the proposition you think is right to test yourself. To make them stick, practise them as a session:
            the ones you miss come back until you know them.
          </p>
          <UButton :to="`/session/civic?theme=${theme}`" icon="i-lucide-play" block>Practise 10 questions</UButton>
        </div>
      </UCard>

      <UInput v-model="query" icon="i-lucide-search" placeholder="Search all questions and answers…" class="w-full" />
      <p v-if="query" class="text-sm text-muted">{{ list.length }} question{{ list.length > 1 ? 's' : '' }} found in all themes.</p>

      <div class="space-y-3">
        <QuestionCard v-for="(item, i) in list" :key="item.id" :item="item" :n="query ? undefined : i + 1" />
      </div>
    </template>

    <!-- ===== Check the drafted answers ===== -->
    <template v-else>
      <UAlert
        color="info"
        variant="subtle"
        icon="i-lucide-info"
        title="The ministry publishes the questions only"
        description="The propositions and answers were drafted from the official fiches. Open the fiche, compare, then press “Matches the fiche” or “Something's wrong”. Start with “Check first”: the ones the drafter wasn't sure about."
      />
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span class="text-success"><b>{{ checkStats.verified + checkStats.ok }}</b> checked</span>
        <span class="text-warning"><b>{{ checkStats.toCheck }}</b> to check</span>
        <span class="text-error"><b>{{ checkStats.flagged }}</b> flagged</span>
        <span class="text-muted">of {{ checkStats.drafted }}</span>
      </div>
      <UProgress :model-value="checkStats.verified + checkStats.ok" :max="checkStats.drafted" size="sm" color="success" />

      <div class="flex flex-wrap items-center gap-3">
        <UInput v-model="query" icon="i-lucide-search" placeholder="Search…" class="min-w-48 flex-1" />
        <USelect v-model="filter" :items="FILTERS" class="w-44" />
      </div>
      <p class="text-sm text-muted">{{ list.length }} question{{ list.length > 1 ? 's' : '' }}</p>

      <div class="space-y-3">
        <QuestionCard v-for="item in list" :key="item.id" :item="item" reveal>
          <AnswerCheckBar :id="item.id" :verified="item.verified" :fiche="item.ref" :note="item.note" />
        </QuestionCard>
      </div>
    </template>

    <p class="text-xs text-muted">
      Source:
      <ULink :to="OFFICIAL.source" target="_blank" class="underline">formation-civique.interieur.gouv.fr</ULink>
      — {{ OFFICIAL.licence }} — imported {{ formatDate(OFFICIAL.importedAt) }}.
    </p>
  </div>
</template>
