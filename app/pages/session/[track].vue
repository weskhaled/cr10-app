<script setup lang="ts">
/* A study session: today's due reviews, then today's new items.
   Only the first answer of the day schedules an item; a missed item comes
   back once at the end of the session as extra practice. */
import type { QuizItem, Track } from '~/types/study'

const param = useRoute().params.track
if (!isTrack(param)) throw createError({ statusCode: 404, statusMessage: 'Unknown track' })
const track: Track = param

const { plan, grade, extra } = useStudy()
const start = plan(track)
const queue = ref<QuizItem[]>([...start.reviews, ...start.fresh])
const index = ref(0)
const graded = new Set<string>()
const requeued = new Set<string>()
const stats = reactive({ correct: 0, wrong: 0 })

const current = computed(() => queue.value[index.value])
const moreAvailable = computed(() => extra(track, 1).length > 0)

function onAnswer(correct: boolean) {
  const item = current.value!
  if (!graded.has(item.id)) {
    graded.add(item.id)
    grade(item, correct)
    stats[correct ? 'correct' : 'wrong']++
  }
  if (!correct && !requeued.has(item.id)) {
    requeued.add(item.id)
    queue.value.push(item)
  }
}

function learnMore() {
  queue.value.push(...extra(track, 5))
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <UButton to="/" icon="i-lucide-arrow-left" variant="ghost" color="neutral" aria-label="Back to Today" />
      <h1 class="text-xl font-bold">{{ BANKS[track].label }}</h1>
      <span v-if="queue.length" class="ms-auto text-sm text-muted">
        {{ Math.min(index + 1, queue.length) }} / {{ queue.length }}
      </span>
    </div>
    <UProgress v-if="queue.length" :model-value="index" :max="queue.length" size="sm" />

    <QuizCard v-if="current" :key="`${current.id}-${index}`" :item="current" :track="track" @answer="onAnswer" @next="index++" />

    <UCard v-else>
      <div class="space-y-3 text-center">
        <UIcon name="i-lucide-party-popper" class="size-10 text-primary" />
        <p v-if="graded.size" class="text-lg font-semibold">
          Session done — {{ stats.correct }} right, {{ stats.wrong }} to see again tomorrow.
        </p>
        <p v-else class="text-lg font-semibold">Nothing due right now — you're on track for today.</p>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton to="/" icon="i-lucide-sun">Back to Today</UButton>
          <UButton v-if="moreAvailable" variant="outline" icon="i-lucide-plus" @click="learnMore">
            Learn 5 more
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
