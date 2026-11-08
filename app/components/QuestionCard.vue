<script setup lang="ts">
/* A question in a list, like a flashcard: its 4 propositions, tap one to
   check yourself (or "Show answer"), then the right one turns green with
   the explanation. Not scored — scored practice happens in sessions.
   `reveal`: start with the answer shown (checking drafted answers). */
import type { QuizItem } from '~/types/study'

const props = defineProps<{ item: QuizItem; n?: number; reveal?: boolean }>()

const { t } = useI18n()
const KEYS = ['A', 'B', 'C', 'D']
const order = stableShuffle(props.item.options.map((_, i) => i), props.item.id)
const picked = ref<number | null>(null)
const shown = ref(props.reveal)
const open = computed(() => shown.value || picked.value !== null)
const isRight = computed(() => picked.value !== null && order[picked.value] === 0)

function state(i: number): 'idle' | 'right' | 'wrong' | 'dim' {
  if (!open.value) return 'idle'
  if (order[i] === 0) return 'right'
  return i === picked.value ? 'wrong' : 'dim'
}
const OPTION = {
  idle: 'border-default hover:border-primary hover:bg-primary/5',
  right: 'border-success bg-success/15',
  wrong: 'border-error bg-error/15',
  dim: 'border-default opacity-55',
}

function reset() {
  picked.value = null
  shown.value = false
}
</script>

<template>
  <article class="rounded-lg border border-default p-3 sm:p-4">
    <p class="font-medium leading-snug" lang="fr" dir="ltr">
      <span v-if="n" class="me-1 text-muted">{{ n }}.</span>{{ item.q }}
    </p>

    <div class="mt-3 grid gap-1.5" lang="fr" dir="ltr">
      <button
        v-for="(opt, i) in order"
        :key="opt"
        type="button"
        :disabled="open"
        class="flex w-full items-center gap-2.5 rounded-md border px-2.5 py-2 text-start text-sm transition disabled:cursor-default"
        :class="OPTION[state(i)]"
        @click="picked = i"
      >
        <span class="grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-bold"
          :class="state(i) === 'right' ? 'border-success bg-success text-inverted' : state(i) === 'wrong' ? 'border-error bg-error text-inverted' : 'border-default text-muted'">
          <UIcon v-if="state(i) === 'right'" name="i-lucide-check" class="size-3.5" />
          <UIcon v-else-if="state(i) === 'wrong'" name="i-lucide-x" class="size-3.5" />
          <template v-else>{{ KEYS[i] }}</template>
        </span>
        <span class="flex-1">{{ item.options[opt] }}</span>
      </button>
    </div>

    <div v-if="!open" class="mt-2 flex items-center gap-2 text-xs text-muted">
      <span>{{ t('card.tapOr') }}</span>
      <UButton size="xs" variant="link" class="px-0" @click="shown = true">{{ t('card.show') }}</UButton>
    </div>

    <div v-else class="mt-3 space-y-2 text-sm">
      <p v-if="picked !== null" class="flex items-center gap-1.5 font-semibold" :class="isRight ? 'text-success' : 'text-error'">
        <UIcon :name="isRight ? 'i-lucide-circle-check' : 'i-lucide-circle-x'" class="size-4" />
        {{ isRight ? t('quiz.correct') : t('card.notQuite') }}
      </p>
      <p class="leading-relaxed text-muted" lang="fr" dir="ltr">{{ item.explain }}</p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
        <ULink v-if="item.ref && !reveal" :to="item.ref" target="_blank" class="inline-flex items-center gap-1 text-xs font-medium text-primary">
          <UIcon name="i-lucide-book-open" class="size-3.5" /> {{ t('check.fiche') }}
        </ULink>
        <UButton v-if="!reveal" size="xs" variant="link" color="neutral" icon="i-lucide-rotate-ccw" class="px-0" @click="reset">{{ t('card.hide') }}</UButton>
      </div>
      <slot />
    </div>
  </article>
</template>
