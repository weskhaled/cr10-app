<script setup lang="ts">
/* One multiple-choice item.
   - Tap an answer (or 1–4 / A–D), or "I don't know" (0 / ?) to see it.
   - Feedback shows your answer vs the right one, why, and the fiche.
   - A bar pinned to the bottom of the screen holds the next step, so it is
     always under the thumb: Continue (Enter), or "I guessed" (G) after a
     lucky right answer so the item comes back sooner.
   - `test`: no feedback, the parent gets `answer` right after the pick.
   Re-mount it (`:key`) for each new item. */
import type { QuizItem, Track } from '~/types/study'

type CardItem = Omit<QuizItem, 'source'> & Partial<Pick<QuizItem, 'source'>>

const props = defineProps<{
  item: CardItem
  track: Track
  test?: boolean
  kind?: 'new' | 'review' | 'again'
}>()
const emit = defineEmits<{
  answer: [correct: boolean] // test mode
  done: [result: { correct: boolean; guessed: boolean }] // practice mode, on Continue
}>()

const { t } = useI18n()
const KEYS = ['A', 'B', 'C', 'D']
const MAX_PLAYS = 2 // like the real TCF
const DONT_KNOW = -1

const order = shuffle(props.item.options.map((_, i) => i)) // order[i] = index in item.options; 0 is correct
const picked = ref<number | null>(null) // position in `order`, or DONT_KNOW
const plays = ref(0)
const noVoice = ref(false)
const feedback = useTemplateRef<HTMLElement>('feedback')

const answered = computed(() => picked.value !== null)
const isRight = computed(() => picked.value !== null && picked.value !== DONT_KNOW && order[picked.value] === 0)
const pickedText = computed(() =>
  picked.value === null || picked.value === DONT_KNOW ? null : props.item.options[order[picked.value]!])
const isDraft = computed(() => props.item.source === 'official-cr' && !props.item.verified)

const KIND_COLOR = { new: 'primary', review: 'neutral', again: 'warning' } as const

function pick(i: number) {
  if (answered.value || (i !== DONT_KNOW && (i < 0 || i >= order.length))) return
  picked.value = i
  if (props.test) {
    // short pause so the tap is visible before the next item
    setTimeout(() => emit('answer', isRight.value), 250)
    return
  }
  // bring the explanation up above the bottom bar
  nextTick(() => feedback.value?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
}

function finish(guessed = false) {
  if (!answered.value || props.test) return
  emit('done', { correct: isRight.value && !guessed, guessed })
}

function play() {
  if (!props.item.say || plays.value >= MAX_PLAYS) return
  plays.value++
  if (!speakFrench(props.item.say)) noVoice.value = true
}

/** Option look: neutral before answering, then right = green ✓, your wrong pick = red ✗, others dimmed. */
function state(i: number): 'idle' | 'picked' | 'right' | 'wrong' | 'dim' {
  if (!answered.value) return 'idle'
  if (props.test) return i === picked.value ? 'picked' : 'dim'
  if (order[i] === 0) return 'right'
  return i === picked.value ? 'wrong' : 'dim'
}
const OPTION = {
  idle: 'border-default hover:border-primary hover:bg-primary/5 active:scale-[0.99]',
  picked: 'border-primary bg-primary/10',
  right: 'border-success bg-success/15',
  wrong: 'border-error bg-error/15',
  dim: 'border-default opacity-55',
}
const LETTER = {
  idle: 'border-default text-muted',
  picked: 'border-primary bg-primary text-inverted',
  right: 'border-success bg-success text-inverted',
  wrong: 'border-error bg-error text-inverted',
  dim: 'border-default text-dimmed',
}

const typing = (e: KeyboardEvent) => e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.isContentEditable
onKeyStroke(['1', '2', '3', '4', 'a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'], (e) => {
  if (typing(e)) return
  const k = e.key.toLowerCase()
  pick('1234'.includes(k) ? Number(k) - 1 : 'abcd'.indexOf(k))
})
onKeyStroke(['0', '?'], (e) => !typing(e) && pick(DONT_KNOW))
onKeyStroke(['Enter', ' '], (e) => {
  if (!answered.value || props.test || typing(e)) return
  e.preventDefault()
  finish()
})
onKeyStroke(['g', 'G'], (e) => !typing(e) && isRight.value && finish(true))
onBeforeUnmount(stopSpeech)
</script>

<template>
  <div>
    <UCard :ui="{ body: 'p-4 sm:p-6' }">
      <!-- context: kind of card, theme, official / situational, draft status -->
      <div class="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <UBadge v-if="kind" :color="KIND_COLOR[kind]" variant="soft" size="sm" :label="t(`quiz.kind.${kind}`)" />
        <UBadge color="neutral" variant="outline" size="sm" :label="themeLabel(track, item.theme)" class="max-w-full truncate" />
        <UBadge v-if="item.source === 'official-cr'" color="info" variant="soft" size="sm" icon="i-lucide-landmark" :label="t('quiz.officialList')" />
        <UTooltip v-if="item.sit" :text="t('quiz.situationHint')">
          <UBadge color="warning" variant="soft" size="sm" icon="i-lucide-users" :label="t('quiz.situation')" />
        </UTooltip>
        <UPopover v-if="isDraft && !test">
          <UButton size="xs" color="warning" variant="ghost" icon="i-lucide-file-pen-line" class="ms-auto">{{ t('quiz.draft') }}</UButton>
          <template #content>
            <div class="max-w-xs space-y-2 p-3 text-sm">
              <p>{{ t('quiz.draftHint') }}</p>
              <AnswerCheckBar :id="item.id" :verified="item.verified" :fiche="item.ref" :note="item.note" />
            </div>
          </template>
        </UPopover>
      </div>

      <p class="text-lg font-semibold leading-snug sm:text-xl" lang="fr" dir="ltr">{{ item.q }}</p>

      <!-- trusted inline SVG from the local bank -->
      <div v-if="item.img" class="mt-4 flex justify-center" v-html="item.img" />

      <blockquote v-if="item.ctx" lang="fr" dir="ltr" class="mt-4 whitespace-pre-line rounded-md bg-elevated/60 p-3 text-sm leading-relaxed">
        {{ item.ctx }}
      </blockquote>

      <div v-if="item.say" class="mt-4 flex flex-wrap items-center gap-3">
        <UButton icon="i-lucide-volume-2" size="lg" :disabled="plays >= MAX_PLAYS" @click="play">
          {{ t('quiz.listen', { n: MAX_PLAYS - plays }) }}
        </UButton>
        <span class="text-xs text-muted">{{ t('quiz.listenHint') }}</span>
      </div>
      <p v-if="item.say && noVoice && !answered" class="mt-3 text-sm italic text-muted">
        {{ t('quiz.noVoice') }} <span lang="fr" dir="ltr">« {{ item.say }} »</span>
      </p>

      <!-- options -->
      <div class="mt-5 grid gap-2.5" lang="fr" dir="ltr" role="radiogroup" :aria-label="item.q">
        <button
          v-for="(opt, i) in order"
          :key="opt"
          type="button"
          role="radio"
          :aria-checked="picked === i"
          :disabled="answered"
          class="flex min-h-13 w-full items-center gap-3 rounded-lg border-2 px-3 py-2.5 text-start text-base transition disabled:cursor-default"
          :class="OPTION[state(i)]"
          @click="pick(i)"
        >
          <span class="grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold" :class="LETTER[state(i)]">
            <UIcon v-if="state(i) === 'right'" name="i-lucide-check" class="size-4" />
            <UIcon v-else-if="state(i) === 'wrong'" name="i-lucide-x" class="size-4" />
            <template v-else>{{ KEYS[i] }}</template>
          </span>
          <span class="flex-1">{{ item.options[opt] }}</span>
        </button>
      </div>

      <!-- feedback -->
      <div
        v-if="answered && !test"
        ref="feedback"
        class="mt-5 scroll-mb-28 rounded-lg border-s-4 bg-elevated/50 p-4"
        :class="isRight ? 'border-success' : 'border-error'"
      >
        <p class="flex items-center gap-2 text-base font-semibold" :class="isRight ? 'text-success' : 'text-error'">
          <UIcon :name="isRight ? 'i-lucide-circle-check' : picked === -1 ? 'i-lucide-lightbulb' : 'i-lucide-circle-x'" class="size-5" />
          {{ isRight ? t('quiz.correct') : picked === -1 ? t('quiz.reveal') : t('quiz.notQuite') }}
        </p>

        <dl v-if="!isRight" class="mt-3 space-y-2 text-sm">
          <div v-if="pickedText">
            <dt class="text-xs font-medium uppercase tracking-wide text-muted">{{ t('quiz.yourAnswer') }}</dt>
            <dd class="text-muted line-through" lang="fr" dir="ltr">{{ pickedText }}</dd>
          </div>
          <div>
            <dt class="text-xs font-medium uppercase tracking-wide text-muted">{{ t('quiz.rightAnswer') }}</dt>
            <dd class="font-semibold text-highlighted" lang="fr" dir="ltr">{{ item.options[0] }}</dd>
          </div>
        </dl>

        <div class="mt-3 text-sm leading-relaxed">
          <span class="text-xs font-medium uppercase tracking-wide text-muted">{{ t('quiz.why') }}</span>
          <p class="text-default" lang="fr" dir="ltr">{{ item.explain }}</p>
        </div>

        <p v-if="item.say" class="mt-3 text-sm italic text-muted">{{ t('quiz.transcript') }} <span lang="fr" dir="ltr">« {{ item.say }} »</span></p>

        <ULink v-if="item.ref" :to="item.ref" target="_blank" class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
          <UIcon name="i-lucide-book-open" class="size-4" /> {{ t('quiz.readFiche') }}
        </ULink>
      </div>
    </UCard>

    <!-- next step, pinned under the thumb -->
    <Teleport to="body">
      <div class="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-default/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div class="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <template v-if="!answered">
            <UButton color="neutral" variant="outline" size="lg" icon="i-lucide-circle-help" @click="pick(DONT_KNOW)">
              {{ t('quiz.dontKnow') }}
            </UButton>
            <span class="ms-auto hidden text-xs text-muted sm:inline">
              <UKbd value="1" />–<UKbd value="4" /> {{ t('quiz.keyAnswer') }} · <UKbd value="0" /> {{ t('quiz.keyDontKnow') }}
            </span>
          </template>
          <template v-else-if="!test">
            <UTooltip v-if="isRight" :text="t('quiz.guessedHint')">
              <UButton color="neutral" variant="ghost" size="lg" icon="i-lucide-dices" @click="finish(true)">{{ t('quiz.guessed') }}</UButton>
            </UTooltip>
            <UButton
              size="lg"
              :color="isRight ? 'success' : 'primary'"
              trailing-icon="i-lucide-arrow-right"
              :ui="{ trailingIcon: 'rtl:-scale-x-100' }"
              class="ms-auto flex-1 justify-center sm:flex-none sm:px-8"
              @click="finish()"
            >
              {{ t('quiz.continue') }}
            </UButton>
          </template>
        </div>
      </div>
    </Teleport>
  </div>
</template>
