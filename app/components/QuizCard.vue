<script setup lang="ts">
/* One multiple-choice item: shuffled options, instant feedback,
   keyboard shortcuts (1–4 / A–D to answer, Enter for next).
   `test`: no feedback — the parent moves on as soon as an answer is picked.
   Re-mount it (`:key`) for each new item. */
import type { QuizItem, Track } from '~/types/study'

type CardItem = Omit<QuizItem, 'source'> & Partial<Pick<QuizItem, 'source'>>

const props = defineProps<{ item: CardItem; track: Track; test?: boolean }>()
const emit = defineEmits<{ answer: [correct: boolean]; next: [] }>()

const KEYS = ['A', 'B', 'C', 'D']
const MAX_PLAYS = 2 // like the real TCF

const order = shuffle(props.item.options.map((_, i) => i)) // order[i] = index in item.options; 0 is correct
const picked = ref<number | null>(null)
const plays = ref(0)
const noVoice = ref(false)

const answered = computed(() => picked.value !== null)
const isRight = computed(() => picked.value !== null && order[picked.value] === 0)

function pick(i: number) {
  if (answered.value || i < 0 || i >= order.length) return
  picked.value = i
  emit('answer', order[i] === 0)
}

function play() {
  if (!props.item.say || plays.value >= MAX_PLAYS) return
  plays.value++
  if (!speakFrench(props.item.say)) noVoice.value = true
}

function optionColor(i: number) {
  if (!answered.value || props.test) return 'neutral'
  if (order[i] === 0) return 'success'
  return i === picked.value ? 'error' : 'neutral'
}

onKeyStroke(['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'], (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key.toLowerCase()
  pick('1234'.includes(k) ? Number(k) - 1 : 'abcd'.indexOf(k))
})
onKeyStroke('Enter', () => {
  if (answered.value && !props.test) emit('next')
})
onBeforeUnmount(stopSpeech)
</script>

<template>
  <UCard>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <UBadge variant="subtle" :label="themeLabel(track, item.theme)" />
      <UBadge v-if="item.source === 'official-cr'" color="info" variant="subtle" icon="i-lucide-landmark" label="Official list" />
      <UBadge v-if="item.sit" color="warning" variant="subtle" label="Mise en situation" />
    </div>

    <p class="mb-4 text-lg font-semibold" lang="fr">{{ item.q }}</p>

    <!-- trusted inline SVG from the local bank -->
    <div v-if="item.img" class="mb-4 flex justify-center" v-html="item.img" />

    <blockquote v-if="item.ctx" lang="fr" class="mb-4 whitespace-pre-line border-s-4 border-default ps-4 text-sm text-muted">
      {{ item.ctx }}
    </blockquote>

    <div v-if="item.say" class="mb-4 flex flex-wrap items-center gap-3">
      <UButton icon="i-lucide-volume-2" :disabled="plays >= MAX_PLAYS" @click="play">
        Listen ({{ MAX_PLAYS - plays }} left)
      </UButton>
      <span class="text-xs text-muted">2 plays max, like the real TCF.</span>
    </div>
    <p v-if="item.say && (noVoice || answered)" lang="fr" class="mb-4 text-sm italic text-muted">
      <span v-if="noVoice">No French voice available — read the transcript: </span>« {{ item.say }} »
    </p>

    <div class="grid gap-2" lang="fr">
      <UButton
        v-for="(opt, i) in order"
        :key="opt"
        block
        :color="optionColor(i)"
        :variant="answered && optionColor(i) !== 'neutral' ? 'soft' : 'outline'"
        class="h-auto justify-start whitespace-normal py-2.5 text-start"
        @click="pick(i)"
      >
        <UKbd :value="KEYS[i]" class="me-2 shrink-0" />
        {{ item.options[opt] }}
      </UButton>
    </div>

    <template v-if="answered && !test">
      <UAlert
        class="mt-4"
        :color="isRight ? 'success' : 'error'"
        variant="subtle"
        :icon="isRight ? 'i-lucide-circle-check' : 'i-lucide-circle-x'"
        :title="isRight ? 'Correct' : `Answer: ${item.options[0]}`"
        :description="item.explain"
      />
      <AnswerCheckBar v-if="item.source === 'official-cr'" :id="item.id" :verified="item.verified" :fiche="item.ref" :note="item.note" class="mt-3" />
      <div class="mt-4 flex justify-end">
        <UButton trailing-icon="i-lucide-arrow-right" @click="emit('next')">Next</UButton>
      </div>
    </template>
  </UCard>
</template>
