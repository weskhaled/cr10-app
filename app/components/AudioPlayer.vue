<script setup lang="ts">
/* Plays a list of clips one after the other, with lock-screen controls
   (Media Session). Each track change happens inside the `ended` handler so
   phones keep playing with the screen off. */
import type { Clip } from '~/utils/audio'

const props = defineProps<{ clips: Clip[]; src: (id: string) => string }>()
const emit = defineEmits<{ listened: [clip: Clip] }>()

const RATES = [0.8, 1, 1.2, 1.5]
const el = useTemplateRef<HTMLAudioElement>('el')
const index = ref(0)
const playing = ref(false)
const time = ref(0)
const rate = useLocalStorage('cr10v2:audioRate', 1)

const current = computed(() => props.clips[index.value])
const leftMin = computed(() => Math.ceil(props.clips.slice(index.value).reduce((s, c) => s + c.sec, 0) / 60 - time.value / 60))

function setMeta(clip: Clip) {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.metadata = new MediaMetadata({
    title: clip.title,
    artist: clip.track === 'civic' ? 'Examen civique' : 'Français B1',
    album: 'Objectif 10 ans — morning mix',
  })
}

function load(i: number, autoplay: boolean) {
  const a = el.value
  const clip = props.clips[i]
  if (!a || !clip) return
  index.value = i
  a.src = props.src(clip.id)
  a.playbackRate = rate.value
  setMeta(clip)
  if (autoplay) a.play().catch(() => (playing.value = false))
}

function toggle() {
  const a = el.value
  if (!a) return
  if (!a.src) load(index.value, true)
  else if (a.paused) a.play()
  else a.pause()
}

function next() {
  if (index.value < props.clips.length - 1) load(index.value + 1, true)
  else {
    el.value?.pause()
    index.value = 0
    el.value?.removeAttribute('src')
  }
}

function prev() {
  const a = el.value
  if (a && a.currentTime > 3) a.currentTime = 0
  else if (index.value > 0) load(index.value - 1, true)
}

function onEnded() {
  if (current.value) emit('listened', current.value)
  next()
}

watch(rate, (r) => {
  if (el.value) el.value.playbackRate = r
})

// a new mix (other settings) starts from the top
watch(() => props.clips.map((c) => c.id).join(), () => {
  el.value?.pause()
  el.value?.removeAttribute('src')
  index.value = 0
  time.value = 0
})

onMounted(() => {
  if (!('mediaSession' in navigator)) return
  navigator.mediaSession.setActionHandler('play', () => el.value?.play())
  navigator.mediaSession.setActionHandler('pause', () => el.value?.pause())
  navigator.mediaSession.setActionHandler('nexttrack', next)
  navigator.mediaSession.setActionHandler('previoustrack', prev)
})
onBeforeUnmount(() => el.value?.pause())

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
</script>

<template>
  <div class="space-y-4">
    <audio
      ref="el"
      preload="auto"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="time = el?.currentTime ?? 0"
      @ended="onEnded"
    />

    <UCard v-if="current">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <UBadge variant="subtle" :label="current.track === 'civic' ? 'Examen civique' : 'Français B1 · écoute'" />
          <UBadge v-if="current.draft" color="warning" variant="subtle" label="Draft answer" />
          <span class="ms-auto text-muted">{{ index + 1 }} / {{ clips.length }} · {{ leftMin }} min left</span>
        </div>
        <p class="min-h-12 text-base font-semibold" lang="fr">{{ current.title }}</p>
        <UProgress :model-value="time" :max="current.sec || 1" size="sm" />
        <div class="flex justify-between text-xs text-muted">
          <span>{{ fmt(time) }}</span><span>{{ fmt(current.sec) }}</span>
        </div>
        <div class="flex items-center justify-center gap-3">
          <UButton icon="i-lucide-skip-back" color="neutral" variant="ghost" size="xl" aria-label="Previous" @click="prev" />
          <UButton :icon="playing ? 'i-lucide-pause' : 'i-lucide-play'" size="xl" class="rounded-full" :aria-label="playing ? 'Pause' : 'Play'" @click="toggle" />
          <UButton icon="i-lucide-skip-forward" color="neutral" variant="ghost" size="xl" aria-label="Next" @click="next" />
        </div>
        <div class="flex items-center justify-center gap-1">
          <UButton
            v-for="r in RATES"
            :key="r"
            size="xs"
            :variant="rate === r ? 'solid' : 'outline'"
            color="neutral"
            @click="rate = r"
          >
            ×{{ r }}
          </UButton>
        </div>
      </div>
    </UCard>

    <ol class="space-y-1 text-sm" lang="fr">
      <li v-for="(c, i) in clips" :key="c.id">
        <button
          type="button"
          class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-elevated"
          :class="i === index ? 'bg-elevated font-medium' : ''"
          @click="load(i, true)"
        >
          <UIcon :name="i === index && playing ? 'i-lucide-volume-2' : c.track === 'civic' ? 'i-lucide-landmark' : 'i-lucide-headphones'" class="size-4 shrink-0 text-muted" />
          <span class="min-w-0 flex-1 truncate">{{ c.title }}</span>
          <span class="shrink-0 text-xs text-muted">{{ fmt(c.sec) }}</span>
        </button>
      </li>
    </ol>
  </div>
</template>
