<script setup lang="ts">
/* A study session: today's due reviews, then today's new items.
   Only the first answer of the day schedules an item ("I guessed" counts as
   not known); a missed item comes back once at the end of the session as
   extra practice. */
import type { QuizItem, Track } from '~/types/study'

const param = useRoute().params.track
if (!isTrack(param)) throw createError({ statusCode: 404, statusMessage: 'Unknown track' })
const track: Track = param

const { plan, grade, extra, cards, today } = useStudy()

// ?theme=<id>: practise one theme of the official list (from the Official questions page)
const themeParam = useRoute().query.theme
const theme = track === 'civic' && typeof themeParam === 'string' ? BANKS.civic.themes.find((t) => t.id === themeParam) : undefined
const themeItems = theme ? BANKS.civic.items.filter((i) => i.source === 'official-cr' && i.theme === theme.id) : []
const THEME_ROUND = 10

const start = plan(track)
const reviewIds = new Set(theme ? themeItems.filter((i) => cards.value[i.id]).map((i) => i.id) : start.reviews.map((i) => i.id))
const queue = ref<QuizItem[]>(theme ? themeQueue(themeItems, cards.value, today.value, THEME_ROUND) : [...start.reviews, ...start.fresh])
const index = ref(0)
const graded = new Set<string>()
const requeued = new Set<string>()
const stats = reactive({ correct: 0, wrong: 0 })
const missed = ref<QuizItem[]>([])

const current = computed(() => queue.value[index.value])
const kind = computed(() => {
  const item = current.value
  if (!item) return undefined
  if (queue.value.findIndex((i) => i.id === item.id) < index.value) return 'again'
  return reviewIds.has(item.id) ? 'review' : 'new'
})
const notQueued = () => themeItems.filter((i) => !queue.value.some((q) => q.id === i.id))
const moreAvailable = computed(() => (theme ? notQueued().length > 0 : extra(track, 1).length > 0))

function onDone({ correct }: { correct: boolean }) {
  const item = current.value!
  if (!graded.has(item.id)) {
    graded.add(item.id)
    grade(item, correct)
    stats[correct ? 'correct' : 'wrong']++
    if (!correct) missed.value.push(item)
  }
  if (!correct && !requeued.has(item.id)) {
    requeued.add(item.id)
    queue.value.push(item)
  }
  index.value++
}

// each new question starts at the top of the screen
watch(index, () => window.scrollTo({ top: 0, behavior: 'instant' }))

function learnMore() {
  queue.value.push(...(theme ? themeQueue(notQueued(), cards.value, today.value, THEME_ROUND) : extra(track, 5)))
}

function practiceMissed() {
  queue.value.push(...missed.value)
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div class="flex items-center gap-2">
      <UButton :to="theme ? '/official' : '/'" icon="i-lucide-x" variant="ghost" color="neutral" aria-label="Stop the session" />
      <h1 class="min-w-0 truncate text-lg font-bold sm:text-xl">{{ theme ? theme.label : BANKS[track].label }}</h1>
      <div v-if="queue.length" class="ms-auto flex items-center gap-3 text-sm">
        <span class="flex items-center gap-1 text-success"><UIcon name="i-lucide-check" class="size-4" />{{ stats.correct }}</span>
        <span class="flex items-center gap-1 text-error"><UIcon name="i-lucide-x" class="size-4" />{{ stats.wrong }}</span>
        <span class="text-muted">{{ Math.min(index + 1, queue.length) }} / {{ queue.length }}</span>
      </div>
    </div>
    <UProgress v-if="queue.length" :model-value="index" :max="queue.length" size="sm" />

    <QuizCard v-if="current" :key="`${current.id}-${index}`" :item="current" :track="track" :kind="kind" @done="onDone" />

    <template v-else>
      <UCard>
        <div class="space-y-3 text-center">
          <UIcon :name="graded.size ? 'i-lucide-party-popper' : 'i-lucide-calendar-check'" class="size-10 text-primary" />
          <template v-if="graded.size">
            <p class="text-xl font-semibold">Session done</p>
            <p class="text-sm">
              <span class="font-semibold text-success">{{ stats.correct }} known</span> ·
              <span class="font-semibold text-error">{{ stats.wrong }} to work on</span>
            </p>
            <p class="text-sm text-muted">
              Known questions come back in a few days, the others tomorrow — spacing them out is what makes them stick.
            </p>
          </template>
          <p v-else class="text-lg font-semibold">Nothing due right now — you're on track for today.</p>
          <div class="flex flex-wrap justify-center gap-2">
            <UButton v-if="theme" to="/official" icon="i-lucide-list-checks">Back to the questions</UButton>
            <UButton v-else to="/" icon="i-lucide-sun">Back to Today</UButton>
            <UButton v-if="missed.length" variant="outline" icon="i-lucide-rotate-ccw" @click="practiceMissed">
              Practice the {{ missed.length }} missed again
            </UButton>
            <UButton v-if="moreAvailable" variant="outline" icon="i-lucide-plus" @click="learnMore">{{ theme ? `${THEME_ROUND} more from this theme` : 'Learn 5 more' }}</UButton>
          </div>
        </div>
      </UCard>

      <UCard v-if="missed.length">
        <template #header><h2 class="font-semibold">To remember</h2></template>
        <ul class="space-y-4 text-sm" lang="fr">
          <li v-for="m in missed" :key="m.id">
            <p class="font-medium">{{ m.q }}</p>
            <p class="mt-1 flex items-start gap-1.5 font-semibold text-success">
              <UIcon name="i-lucide-check" class="mt-0.5 size-4 shrink-0" />{{ m.options[0] }}
            </p>
            <p class="mt-1 text-muted">{{ m.explain }}</p>
          </li>
        </ul>
      </UCard>
    </template>
  </div>
</template>
