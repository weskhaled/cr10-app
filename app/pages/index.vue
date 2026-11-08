<script setup lang="ts">
import type { Band, Track } from '~/types/study'
import type { ExamStatus } from '~/utils/deadline'

const { t } = useI18n()
const { date } = useLocaleUi()
const { settings, days, today, deadline, currentStreak, checkStats, lastLevel, plan } = useStudy()
const { mix } = useMorningMix()

const tracks = computed(() =>
  (['civic', 'french'] as Track[]).map((id) => {
    const exam = deadline.value[id]
    return { id, label: t(`track.${id}`), plan: plan(id), exam, line: examLine(exam) }
  }),
)

const PHASES = {
  prep: { color: 'info', icon: 'i-lucide-calendar-clock' },
  filing: { color: 'success', icon: 'i-lucide-mail-check' },
  late: { color: 'warning', icon: 'i-lucide-triangle-alert' },
  expired: { color: 'error', icon: 'i-lucide-octagon-alert' },
} as const
const phase = computed(() => PHASES[deadline.value.phase])
const phaseText = computed(() => {
  const d = deadline.value
  return t(`today.phase.${d.phase}.text`, {
    open: date(d.filingOpens),
    close: date(d.filingCloses),
    days: t('common.days', d.daysToFilingClose),
  })
})

// full class names, so Tailwind sees them
const LINE_STYLE = {
  success: { icon: 'i-lucide-circle-check', cls: 'text-success' },
  warning: { icon: 'i-lucide-circle-alert', cls: 'text-warning' },
  error: { icon: 'i-lucide-circle-alert', cls: 'text-error' },
} as const

function examLine(exam: ExamStatus): { color: keyof typeof LINE_STYLE; text: string } {
  const d = deadline.value
  if (exam.booked && exam.tooLate)
    return { color: 'error', text: t('today.exam.tooLate', { date: date(exam.date), close: date(d.filingCloses) }) }
  if (exam.booked) return { color: 'success', text: t('today.exam.booked', { date: date(exam.date), days: t('common.days', exam.daysLeft) }) }
  if (today.value > d.latestBooking) return { color: 'error', text: t('today.exam.missedBooking', { date: date(d.latestBooking) }) }
  return { color: 'warning', text: t('today.exam.notBooked', { booking: date(d.latestBooking), latest: date(d.latestExam) }) }
}

// French level estimate
const bandLabel = (b: Band) => (b === 'pre-A1' ? '<A1' : b)
const levelSummary = computed(() => {
  const r = lastLevel.value
  if (!r) return null
  const skills = [
    { id: 'gram', band: r.bands.gram },
    { id: 'ce', band: r.bands.ce },
    { id: 'co', band: r.bands.co },
    { id: 'ee', band: r.self.ee },
    { id: 'eo', band: r.self.eo },
  ]
  return { on: r.on, skills, below: skills.filter((s) => gapToTarget(s.band) > 0).length, stale: daysBetween(r.on, today.value) > 14 }
})

// last 14 days, oldest first
const history = computed(() =>
  Array.from({ length: 14 }, (_, i) => {
    const d = addDays(today.value, i - 13)
    const s = days.value[d]
    return { d, n: s ? s.learned + s.reviewed : 0 }
  }),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <h1 class="text-2xl font-bold">{{ t('today.title') }} <span class="font-normal text-muted">· {{ date(today) }}</span></h1>
      <UBadge v-if="currentStreak" color="warning" variant="subtle" size="lg" icon="i-lucide-flame" :label="t('today.streak', currentStreak)" />
    </div>

    <!-- deadlines -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold">{{ t('today.deadlines') }}</h2>
          <UButton to="/settings" size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil">{{ t('today.editDates') }}</UButton>
        </div>
      </template>
      <div class="space-y-3">
        <UAlert :color="phase.color" variant="subtle" :icon="phase.icon" :title="t(`today.phase.${deadline.phase}.title`)" :description="phaseText" />
        <p class="text-sm">
          {{ t('today.expiresOn') }} <b>{{ date(settings.expiry || '2027-03-01') }}</b>
          <span class="text-muted">({{ t('common.days', deadline.daysToExpiry) }})</span>
        </p>
        <div v-for="tr in tracks" :key="tr.id" class="flex items-start gap-2 text-sm">
          <UIcon :name="LINE_STYLE[tr.line.color].icon" class="mt-0.5 size-4 shrink-0" :class="LINE_STYLE[tr.line.color].cls" />
          <p><b>{{ tr.label }}:</b> {{ tr.line.text }}</p>
        </div>
        <p class="text-xs text-muted">{{ t('today.deadlinesNote') }}</p>
      </div>
    </UCard>

    <!-- study tracks -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UCard v-for="tr in tracks" :key="tr.id">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold">{{ tr.label }}</h2>
            <UBadge v-if="tr.plan.reviews.length + tr.plan.fresh.length === 0" color="success" variant="subtle" icon="i-lucide-check" :label="t('today.doneForToday')" />
          </div>
          <p class="text-sm">{{ t('today.queue', { review: tr.plan.reviews.length, fresh: tr.plan.newLeft }) }}</p>
          <div class="space-y-1">
            <div class="flex justify-between text-xs text-muted">
              <span>{{ t('today.mastered') }}</span><span dir="ltr">{{ tr.plan.mastered }} / {{ tr.plan.total }}</span>
            </div>
            <UProgress :model-value="tr.plan.mastered" :max="tr.plan.total" size="sm" color="success" />
            <div class="flex justify-between text-xs text-muted">
              <span>{{ t('today.seen') }}</span><span dir="ltr">{{ tr.plan.seen }} / {{ tr.plan.total }}</span>
            </div>
            <UProgress :model-value="tr.plan.seen" :max="tr.plan.total" size="sm" />
          </div>
          <p class="text-xs text-muted">{{ t('today.pace', { n: tr.plan.quota, date: date(tr.exam.date) }) }}</p>
          <UButton
            :to="`/session/${tr.id}`"
            block
            :variant="tr.plan.reviews.length + tr.plan.fresh.length ? 'solid' : 'outline'"
            trailing-icon="i-lucide-arrow-right"
            :ui="{ trailingIcon: 'rtl:-scale-x-100' }"
          >
            {{ tr.plan.reviews.length + tr.plan.fresh.length ? t('today.start') : t('today.practiceMore') }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- morning audio -->
    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">{{ t('today.audioTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('today.audioText', { clips: mix.length, min: totalMinutes(mix) }) }}</p>
        </div>
        <UButton to="/listen" icon="i-lucide-headphones">{{ t('nav.listen') }}</UButton>
      </div>
    </UCard>

    <!-- French level -->
    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <h2 class="font-semibold">{{ t('today.levelTitle') }}</h2>
          <p v-if="!levelSummary" class="text-sm text-muted">{{ t('today.levelNone') }}</p>
          <template v-else>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="s in levelSummary.skills"
                :key="s.id"
                :color="gapToTarget(s.band) ? 'warning' : 'success'"
                variant="subtle"
                :label="`${t(`skill.${s.id}`)} ${bandLabel(s.band)}`"
              />
            </div>
            <p class="text-xs text-muted">
              {{ date(levelSummary.on) }} · {{ levelSummary.below ? t('today.levelBelow', { n: levelSummary.below }) : t('today.levelAllGood') }}
              <template v-if="levelSummary.stale"> · {{ t('today.levelStale') }}</template>
            </p>
          </template>
        </div>
        <UButton to="/level" :variant="levelSummary && !levelSummary.stale ? 'outline' : 'solid'" icon="i-lucide-gauge">
          {{ levelSummary ? t('common.retake') : t('nav.level') }}
        </UButton>
      </div>
    </UCard>

    <!-- official list -->
    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">{{ t('today.officialTitle') }}</h2>
          <p class="text-sm text-muted">{{ t('today.officialText', { n: OFFICIAL.count }) }}</p>
          <p class="mt-1 text-sm">
            <span class="text-success">{{ t('check.checked', { n: checkStats.verified + checkStats.ok }) }}</span> ·
            <span class="text-warning">{{ t('check.toCheck', { n: checkStats.toCheck }) }}</span>
            <template v-if="checkStats.flagged"> · <span class="text-error">{{ t('check.flagged', { n: checkStats.flagged }) }}</span></template>
          </p>
        </div>
        <UButton to="/official" variant="outline" icon="i-lucide-graduation-cap">{{ t('today.studyThem') }}</UButton>
      </div>
    </UCard>

    <!-- day-by-day log -->
    <div>
      <h2 class="mb-2 text-sm font-semibold text-muted">{{ t('today.last14') }}</h2>
      <div class="flex gap-1">
        <div
          v-for="h in history"
          :key="h.d"
          :title="t('today.dayItems', { date: date(h.d), n: h.n })"
          class="h-6 flex-1 rounded-sm"
          :class="h.n === 0 ? 'bg-elevated' : h.n < 10 ? 'bg-primary/40' : h.n < 25 ? 'bg-primary/70' : 'bg-primary'"
        />
      </div>
    </div>
  </div>
</template>
