<script setup lang="ts">
const query = ref('')

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const groups = computed(() => {
  const q = fold(query.value.trim())
  return BANKS.civic.themes.map((t) => ({
    ...t,
    total: OFFICIAL.counts[t.id] ?? 0,
    questions: OFFICIAL.questions.filter((x) => x.theme === t.id && (!q || fold(x.q).includes(q))),
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
      </p>
    </div>

    <UInput v-model="query" icon="i-lucide-search" placeholder="Search the questions…" class="w-full" />
    <p v-if="query" class="text-sm text-muted">{{ shown }} / {{ OFFICIAL.count }} questions match.</p>

    <section v-for="g in groups" v-show="g.questions.length" :key="g.id">
      <h2 class="mb-2 flex items-center gap-2 font-semibold">
        {{ g.label }}
        <UBadge variant="subtle" :label="g.total" />
      </h2>
      <ol lang="fr" class="list-decimal space-y-1 ps-6 text-sm">
        <li v-for="x in g.questions" :key="x.id">{{ x.q }}</li>
      </ol>
    </section>

    <p class="text-xs text-muted">
      Source:
      <ULink :to="OFFICIAL.source" target="_blank" class="underline">formation-civique.interieur.gouv.fr</ULink>
      — {{ OFFICIAL.licence }} — imported {{ formatDate(OFFICIAL.importedAt) }}.
    </p>
  </div>
</template>
