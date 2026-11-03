<script setup lang="ts">
const { checks, checkStats } = useStudy()

const query = ref('')
const showAnswers = ref(true)
const filter = ref<'all' | 'checkFirst' | 'toCheck' | 'flagged' | 'checked'>('all')
const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Check first', value: 'checkFirst' },
  { label: 'To check', value: 'toCheck' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Checked / verified', value: 'checked' },
]

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function statusOf(id: string): 'none' | 'toCheck' | 'flagged' | 'checked' {
  const a = OFFICIAL_ANSWERS[id]
  if (!a) return 'none'
  const s = checks.value[id]?.status
  if (s === 'flagged') return 'flagged'
  return a.verified || s === 'ok' ? 'checked' : 'toCheck'
}

const groups = computed(() => {
  const q = fold(query.value.trim())
  return BANKS.civic.themes.map((t) => ({
    ...t,
    total: OFFICIAL.counts[t.id] ?? 0,
    questions: OFFICIAL.questions.filter((x) =>
      x.theme === t.id &&
      (!q || fold(x.q).includes(q)) &&
      (filter.value === 'all' || statusOf(x.id) === filter.value ||
        (filter.value === 'checkFirst' && statusOf(x.id) === 'toCheck' && !!OFFICIAL_ANSWERS[x.id]?.note))),
  }))
})
const shown = computed(() => groups.value.reduce((n, g) => n + g.questions.length, 0))
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">Official list — knowledge questions (CR)</h1>
      <p class="mt-1 text-sm text-muted">
        The {{ OFFICIAL.count }} questions the ministry says may be asked at the carte de résident level.
        The exam draws 28 of its 40 questions from this kind of list; the 12 situational questions are not published.
        The ministry publishes questions only — the options and answers here are drafts to check against the official fiches.
      </p>
    </div>

    <UCard>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span><b>{{ checkStats.drafted }}</b> / {{ OFFICIAL.count }} answered</span>
        <span class="text-success"><b>{{ checkStats.verified + checkStats.ok }}</b> checked</span>
        <span class="text-warning"><b>{{ checkStats.toCheck }}</b> to check</span>
        <span class="text-error"><b>{{ checkStats.flagged }}</b> flagged</span>
      </div>
      <UProgress :model-value="checkStats.verified + checkStats.ok" :max="OFFICIAL.count" size="sm" color="success" class="mt-2" />
    </UCard>

    <div class="flex flex-wrap items-center gap-3">
      <UInput v-model="query" icon="i-lucide-search" placeholder="Search the questions…" class="min-w-56 flex-1" />
      <USelect v-model="filter" :items="FILTERS" class="w-44" />
      <USwitch v-model="showAnswers" label="Show answers" />
    </div>
    <p v-if="query || filter !== 'all'" class="text-sm text-muted">{{ shown }} / {{ OFFICIAL.count }} questions match.</p>

    <section v-for="g in groups" v-show="g.questions.length" :key="g.id">
      <h2 class="mb-2 flex items-center gap-2 font-semibold">
        {{ g.label }}
        <UBadge variant="subtle" :label="g.total" />
      </h2>
      <ol lang="fr" class="list-decimal space-y-3 ps-6 text-sm">
        <li v-for="x in g.questions" :key="x.id">
          <p>{{ x.q }}</p>
          <div v-if="showAnswers && OFFICIAL_ANSWERS[x.id]" class="mt-1 space-y-1.5">
            <p class="font-medium text-success">→ {{ OFFICIAL_ANSWERS[x.id]!.options[0] }}</p>
            <p class="text-muted">{{ OFFICIAL_ANSWERS[x.id]!.explain }}</p>
            <AnswerCheckBar :id="x.id" :verified="OFFICIAL_ANSWERS[x.id]!.verified" :fiche="OFFICIAL_ANSWERS[x.id]!.ref" :note="OFFICIAL_ANSWERS[x.id]!.note" />
          </div>
        </li>
      </ol>
    </section>

    <p class="text-xs text-muted">
      Source:
      <ULink :to="OFFICIAL.source" target="_blank" class="underline">formation-civique.interieur.gouv.fr</ULink>
      — {{ OFFICIAL.licence }} — imported {{ formatDate(OFFICIAL.importedAt) }}.
    </p>
  </div>
</template>
