<script setup lang="ts">
/* French level check: grammar, reading, listening (placement items, no
   feedback), then a self-assessment for writing and speaking. */
import type { Band, Level, LevelItem, LevelResult, SelfSkill, TestedSkill } from '~/types/study'
import check from '~/data/french/level-check.json'

const ITEMS = check.items as LevelItem[]
const SELF = check.selfAssessment as Record<SelfSkill, { level: Level; text: string }[]>
const OLD_SIMULATOR = 'https://weskhaled.github.io/carte-resident-prep/french-simulator.html'

const LABEL: Record<TestedSkill | SelfSkill, string> = {
  gram: 'Grammar & vocabulary',
  ce: 'Reading',
  co: 'Listening',
  ee: 'Writing (self-assessed)',
  eo: 'Speaking (self-assessed)',
}
const TIPS: Record<TestedSkill | SelfSkill, string> = {
  gram: 'Do the grammar items in your French sessions and revise passé composé / imparfait, object pronouns and the subjonctif.',
  ce: 'Read one short news article a day and sum it up in three sentences; do the reading items in your sessions.',
  co: 'Listen to RFI « Journal en français facile » every morning and do the listening items in your sessions (2 plays max).',
  ee: 'Write one TCF-style task a day (60–120 words) and compare it with the model answers.',
  eo: 'Speak 5 minutes a day out loud — present your job, tell what you did yesterday, give an opinion — record yourself and listen back.',
}

const { levels, today } = useStudy()

const step = ref<'intro' | 'test' | 'self' | 'result'>('intro')
const answers = reactive<Record<TestedSkill, { id: string; level: Level; correct: boolean }[]>>({ gram: [], ce: [], co: [] })
const skillIndex = ref(0)
const ticked = reactive<Record<SelfSkill, Partial<Record<Level, boolean>>>>({ ee: {}, eo: {} })
const result = ref<LevelResult | null>(levels.value.at(-1) ?? null)

const skill = computed(() => SKILL_ORDER[skillIndex.value]!)
const current = computed(() => {
  const s = evaluate(answers[skill.value])
  if (s.done) return null
  const asked = new Set(answers[skill.value].map((a) => a.id))
  return ITEMS.find((i) => i.theme === skill.value && i.level === s.level && !asked.has(i.id)) ?? null
})
const asked = computed(() => SKILL_ORDER.reduce((n, s) => n + answers[s].length, 0))

// a finished part moves on to the next one, then to the self-assessment
watch(current, (item) => {
  if (step.value !== 'test' || item) return
  if (skillIndex.value < SKILL_ORDER.length - 1) skillIndex.value++
  else step.value = 'self'
})

function start() {
  for (const s of SKILL_ORDER) answers[s] = []
  ticked.ee = {}
  ticked.eo = {}
  skillIndex.value = 0
  step.value = 'test'
}

function onAnswer(correct: boolean) {
  const item = current.value!
  answers[skill.value].push({ id: item.id, level: item.level, correct })
}

function finish() {
  result.value = {
    on: today.value,
    bands: { gram: evaluate(answers.gram).band, ce: evaluate(answers.ce).band, co: evaluate(answers.co).band },
    self: { ee: selfBand(ticked.ee), eo: selfBand(ticked.eo) },
  }
  levels.value = [...levels.value, result.value].slice(-20)
  step.value = 'result'
}

const rows = computed(() => {
  const r = result.value
  if (!r) return []
  return [
    ...SKILL_ORDER.map((s) => ({ id: s, band: r.bands[s] })),
    { id: 'ee' as const, band: r.self.ee },
    { id: 'eo' as const, band: r.self.eo },
  ].map((row) => ({ ...row, label: LABEL[row.id], gap: gapToTarget(row.band), rank: bandRank(row.band) }))
})
const below = computed(() => rows.value.filter((r) => r.gap > 0))
const mistakes = computed(() =>
  SKILL_ORDER.flatMap((s) => answers[s].filter((a) => !a.correct)).map((a) => ITEMS.find((i) => i.id === a.id)!))

const bandLabel = (b: Band) => (b === 'pre-A1' ? 'Below A1' : b)
</script>

<template>
  <div class="space-y-6 pb-24">
    <div class="flex items-center gap-2">
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost" color="neutral" aria-label="Back to Today" />
      <h1 class="text-2xl font-bold">French level check</h1>
    </div>

    <!-- intro -->
    <UCard v-if="step === 'intro'">
      <div class="space-y-3 text-sm">
        <p>
          About <b>15 minutes</b>: three short parts (grammar &amp; vocabulary, reading, listening) from A1 to B2,
          then a one-minute self-assessment for writing and speaking. Each part stops as soon as a level gets too hard.
        </p>
        <p>Use headphones for the listening part (2 plays per item). No answers are shown during the test — you'll see your mistakes at the end.</p>
        <p class="text-muted">
          This is an estimate to steer your practice, not a TCF / TEF score — the real tests use calibrated scales.
          Retake it every week or two.
        </p>
        <UButton icon="i-lucide-play" @click="start">Start the level check</UButton>
      </div>
    </UCard>

    <!-- placement items -->
    <template v-else-if="step === 'test' && current">
      <div class="flex items-center gap-3 text-sm">
        <UBadge variant="subtle" :label="`Part ${skillIndex + 1} of 3 · ${LABEL[skill]}`" />
        <span class="ms-auto text-muted">{{ asked }} answered</span>
      </div>
      <QuizCard :key="current.id" :item="current" track="french" test @answer="onAnswer" />
    </template>

    <!-- self-assessment -->
    <UCard v-else-if="step === 'self'">
      <template #header><h2 class="font-semibold">Writing &amp; speaking — tick what you can already do</h2></template>
      <div class="space-y-5">
        <div v-for="s in (['ee', 'eo'] as const)" :key="s" class="space-y-2">
          <h3 class="text-sm font-semibold">{{ LABEL[s] }}</h3>
          <UCheckbox
            v-for="st in SELF[s]"
            :key="st.level"
            v-model="ticked[s][st.level]"
            :label="st.text"
            :ui="{ label: 'font-normal' }"
            lang="fr"
          />
        </div>
        <p class="text-xs text-muted">Be strict: tick a statement only if you could do it today, without preparing.</p>
        <UButton icon="i-lucide-flag" @click="finish">See my results</UButton>
      </div>
    </UCard>

    <!-- result (also shown on arrival when there is a previous result) -->
    <template v-if="step === 'result' || (step === 'intro' && result)">
      <UCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-semibold">{{ step === 'result' ? 'Your estimate' : 'Last estimate' }} — {{ formatDate(result!.on) }}</h2>
            <UBadge
              :color="below.length ? 'warning' : 'success'"
              variant="subtle"
              :label="below.length ? `${below.length} skill${below.length > 1 ? 's' : ''} below B1` : 'B1 or above everywhere'"
            />
          </div>
        </template>
        <div class="space-y-3">
          <div v-for="r in rows" :key="r.id" class="grid grid-cols-[minmax(0,11rem)_1fr_auto] items-center gap-3 text-sm">
            <span>{{ r.label }}</span>
            <div class="grid grid-cols-4 gap-1" :aria-label="`${r.label}: ${bandLabel(r.band)}`">
              <div
                v-for="(l, i) in LEVELS"
                :key="l"
                class="h-2.5 rounded-sm"
                :class="[i < r.rank ? (r.gap ? 'bg-warning' : 'bg-success') : 'bg-elevated', l === TARGET ? 'ring-1 ring-primary' : '']"
                :title="l"
              />
            </div>
            <span class="w-20 text-end font-semibold" :class="r.gap ? 'text-warning' : 'text-success'">{{ bandLabel(r.band) }}</span>
          </div>
          <p class="text-xs text-muted">Bars run A1 → B2; the outlined box is B1, the level required for the carte de résident.</p>
        </div>
      </UCard>

      <UCard v-if="below.length">
        <template #header><h2 class="font-semibold">Focus until the exam</h2></template>
        <ul class="space-y-2 text-sm">
          <li v-for="r in below" :key="r.id">
            <b>{{ r.label }}</b> ({{ bandLabel(r.band) }}, {{ r.gap }} level{{ r.gap > 1 ? 's' : '' }} to B1): {{ TIPS[r.id] }}
            <ULink v-if="r.id === 'ee' || r.id === 'eo'" :to="OLD_SIMULATOR" target="_blank" class="text-primary underline">
              Writing &amp; speaking practice
            </ULink>
          </li>
        </ul>
      </UCard>

      <UCard v-if="step === 'result' && mistakes.length">
        <template #header><h2 class="font-semibold">Your mistakes</h2></template>
        <ul class="space-y-3 text-sm" lang="fr">
          <li v-for="m in mistakes" :key="m.id">
            <p class="font-medium">{{ m.q }} <UBadge size="sm" variant="outline" :label="m.level" /></p>
            <p class="text-success">→ {{ m.options[0] }}</p>
            <p class="text-muted">{{ m.explain }}</p>
          </li>
        </ul>
      </UCard>

      <div class="flex flex-wrap gap-2">
        <UButton to="/" icon="i-lucide-sun">Back to Today</UButton>
        <UButton v-if="step === 'result'" variant="outline" icon="i-lucide-rotate-ccw" @click="start">Retake</UButton>
      </div>
    </template>
  </div>
</template>
