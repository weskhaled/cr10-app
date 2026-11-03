<script setup lang="ts">
import type { Track } from '~/types/study'
import type { ExamStatus } from '~/utils/deadline'

const { settings, days, today, deadline, currentStreak, checkStats, plan } = useStudy()

const tracks = computed(() =>
  (['civic', 'french'] as Track[]).map((id) => {
    const exam = deadline.value[id]
    return { id, label: BANKS[id].label, plan: plan(id), exam, line: examLine(exam) }
  }),
)

const PHASES = {
  prep: { color: 'info', icon: 'i-lucide-calendar-clock', title: 'Getting ready' },
  filing: { color: 'success', icon: 'i-lucide-mail-check', title: 'ANEF filing window open' },
  late: { color: 'warning', icon: 'i-lucide-triangle-alert', title: 'Past the usual filing date' },
  expired: { color: 'error', icon: 'i-lucide-octagon-alert', title: 'Your titre’s expiry date has passed' },
} as const
const phase = computed(() => PHASES[deadline.value.phase])

const phaseText = computed(() => {
  const d = deadline.value
  switch (d.phase) {
    case 'prep':
      return `The filing window opens on ${formatDate(d.filingOpens)} and closes on ${formatDate(d.filingCloses)}.`
    case 'filing':
      return `Submit on ANEF by ${formatDate(d.filingCloses)} — ${d.daysToFilingClose} days left.`
    case 'late':
      return 'File on ANEF as soon as possible and check with your préfecture.'
    default:
      return 'Contact your préfecture now.'
  }
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
    return { color: 'error', text: `Booked for ${formatDate(exam.date)} — results may arrive after the window closes (${formatDate(d.filingCloses)}). Ask the centre for an earlier session.` }
  if (exam.booked) return { color: 'success', text: `Booked for ${formatDate(exam.date)} — in ${exam.daysLeft} days.` }
  if (today.value > d.latestBooking)
    return { color: 'error', text: `Not booked, and the usual booking date (${formatDate(d.latestBooking)}) has passed. Book the earliest session you can.` }
  return { color: 'warning', text: `Not booked. Book by ${formatDate(d.latestBooking)} for a session on or before ${formatDate(d.latestExam)}.` }
}

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
      <h1 class="text-2xl font-bold">Today <span class="font-normal text-muted">· {{ formatDate(today) }}</span></h1>
      <UBadge v-if="currentStreak" color="warning" variant="subtle" size="lg" icon="i-lucide-flame" :label="`${currentStreak}-day streak`" />
    </div>

    <!-- deadlines -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-semibold">Your deadlines</h2>
          <UButton to="/settings" size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil">Edit dates</UButton>
        </div>
      </template>
      <div class="space-y-3">
        <UAlert :color="phase.color" variant="subtle" :icon="phase.icon" :title="phase.title" :description="phaseText" />
        <p class="text-sm">
          Titre expires on <b>{{ formatDate(settings.expiry || '2027-03-01') }}</b>
          <span class="text-muted">({{ deadline.daysToExpiry }} days)</span>.
        </p>
        <div v-for="t in tracks" :key="t.id" class="flex items-start gap-2 text-sm">
          <UIcon :name="LINE_STYLE[t.line.color].icon" class="mt-0.5 size-4 shrink-0" :class="LINE_STYLE[t.line.color].cls" />
          <p><b>{{ t.label }}:</b> {{ t.line.text }}</p>
        </div>
        <p class="text-xs text-muted">
          Typical values: filing 4 → 2 months before expiry, results within ~4 weeks, booking ~3 weeks ahead.
          Confirm with your préfecture and exam centre.
        </p>
      </div>
    </UCard>

    <!-- study tracks -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UCard v-for="t in tracks" :key="t.id">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-semibold">{{ t.label }}</h2>
            <UBadge v-if="t.plan.reviews.length + t.plan.fresh.length === 0" color="success" variant="subtle" icon="i-lucide-check" label="Done for today" />
          </div>
          <p class="text-sm">
            <b>{{ t.plan.reviews.length }}</b> to review · <b>{{ t.plan.newLeft }}</b> new left today
          </p>
          <div class="space-y-1">
            <div class="flex justify-between text-xs text-muted">
              <span>Mastered</span><span>{{ t.plan.mastered }} / {{ t.plan.total }}</span>
            </div>
            <UProgress :model-value="t.plan.mastered" :max="t.plan.total" size="sm" color="success" />
            <div class="flex justify-between text-xs text-muted">
              <span>Seen</span><span>{{ t.plan.seen }} / {{ t.plan.total }}</span>
            </div>
            <UProgress :model-value="t.plan.seen" :max="t.plan.total" size="sm" />
          </div>
          <p class="text-xs text-muted">
            Pace: {{ t.plan.quota }} new/day to see everything before {{ formatDate(t.exam.date) }}.
          </p>
          <UButton :to="`/session/${t.id}`" block :variant="t.plan.reviews.length + t.plan.fresh.length ? 'solid' : 'outline'" trailing-icon="i-lucide-arrow-right">
            {{ t.plan.reviews.length + t.plan.fresh.length ? 'Start session' : 'Practice more' }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- official list -->
    <UCard>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold">Official civic questions (CR)</h2>
          <p class="text-sm text-muted">
            {{ OFFICIAL.count }} knowledge questions published by the ministry, in your civic sessions.
            The answers are drafts: check each one against its official fiche.
          </p>
          <p class="mt-1 text-sm">
            <span class="text-success"><b>{{ checkStats.verified + checkStats.ok }}</b> checked</span> ·
            <span class="text-warning"><b>{{ checkStats.toCheck }}</b> to check</span>
            <template v-if="checkStats.flagged"> · <span class="text-error"><b>{{ checkStats.flagged }}</b> flagged</span></template>
          </p>
        </div>
        <UButton to="/official" variant="outline" icon="i-lucide-list-checks">Review answers</UButton>
      </div>
    </UCard>

    <!-- day-by-day log -->
    <div>
      <h2 class="mb-2 text-sm font-semibold text-muted">Last 14 days</h2>
      <div class="flex gap-1">
        <div
          v-for="h in history"
          :key="h.d"
          :title="`${formatDate(h.d)} — ${h.n} items`"
          class="h-6 flex-1 rounded-sm"
          :class="h.n === 0 ? 'bg-elevated' : h.n < 10 ? 'bg-primary/40' : h.n < 25 ? 'bg-primary/70' : 'bg-primary'"
        />
      </div>
    </div>
  </div>
</template>
