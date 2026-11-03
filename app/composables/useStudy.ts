/* All study state, persisted in localStorage under `cr10v2:` and shared
   by every page. */
import type { AnswerCheck, CardState, DayStats, LevelResult, QuizItem, Settings, Track } from '~/types/study'

const DEFAULT_SETTINGS: Settings = { expiry: '2027-03-01', civicExam: '', frenchExam: '' }
const EMPTY_DAY: DayStats = { learned: 0, reviewed: 0, correct: 0, wrong: 0 }

export const STORAGE_KEYS = ['cr10v2:settings', 'cr10v2:cards', 'cr10v2:days', 'cr10v2:checks', 'cr10v2:levels'] as const

export interface TrackPlan {
  total: number
  seen: number
  mastered: number
  learnedToday: number
  quota: number // new items per day at the current pace
  newLeft: number // new items still to do today
  reviews: QuizItem[]
  fresh: QuizItem[]
}

export const useStudy = createSharedComposable(() => {
  const settings = useLocalStorage<Settings>('cr10v2:settings', { ...DEFAULT_SETTINGS }, { mergeDefaults: true })
  const cards = useLocalStorage<Record<string, CardState>>('cr10v2:cards', {})
  const days = useLocalStorage<Record<string, DayStats>>('cr10v2:days', {})
  // your checks of drafted official answers — applied to the data with scripts/apply-checks.mjs
  const checks = useLocalStorage<Record<string, AnswerCheck>>('cr10v2:checks', {})
  // French level-check results, oldest first
  const levels = useLocalStorage<LevelResult[]>('cr10v2:levels', [])
  const lastLevel = computed(() => levels.value.at(-1) ?? null)

  // re-evaluated every minute so the day rolls over at midnight
  const now = useNow({ scheduler: (cb) => useIntervalFn(cb, 60_000) })
  const today = computed(() => isoToday(now.value))

  // an emptied expiry field falls back to the default instead of breaking the dates
  const deadline = computed(() =>
    computeDeadline({ ...settings.value, expiry: settings.value.expiry || DEFAULT_SETTINGS.expiry }, today.value))
  const currentStreak = computed(() => streak(days.value, today.value))

  function plan(track: Track): TrackPlan {
    const items = BANKS[track].items
    const t = today.value
    let seen = 0, mastered = 0, learnedToday = 0
    for (const item of items) {
      const card = cards.value[item.id]
      if (!card) continue
      seen++
      if (isMastered(card)) mastered++
      if (card.first === t) learnedToday++
    }
    // the quota is sized on what was unseen this morning, so learning doesn't move the target
    const quota = dailyNewQuota(items.length - seen + learnedToday, t, deadline.value[track].date)
    const newLeft = Math.max(0, quota - learnedToday)
    return { total: items.length, seen, mastered, learnedToday, quota, newLeft, ...buildQueue(items, cards.value, t, newLeft) }
  }

  /** Records the first answer of the day for an item: schedules it and updates the day log. */
  function grade(item: QuizItem, correct: boolean): void {
    const t = today.value
    const prev = cards.value[item.id]
    cards.value[item.id] = review(prev, correct, t)
    const d = days.value[t] ?? { ...EMPTY_DAY }
    days.value[t] = {
      learned: d.learned + (prev ? 0 : 1),
      reviewed: d.reviewed + (prev ? 1 : 0),
      correct: d.correct + (correct ? 1 : 0),
      wrong: d.wrong + (correct ? 0 : 1),
    }
  }

  function setCheck(id: string, status: AnswerCheck['status'] | null): void {
    if (status) checks.value[id] = { status, on: today.value }
    else delete checks.value[id]
  }

  /** Drafted official answers: how many are verified in the data, checked or flagged by you. */
  const checkStats = computed(() => {
    const n = { drafted: 0, verified: 0, ok: 0, flagged: 0, toCheck: 0 }
    for (const [id, a] of Object.entries(OFFICIAL_ANSWERS)) {
      n.drafted++
      const status = checks.value[id]?.status
      if (status === 'flagged') n.flagged++
      else if (a.verified) n.verified++
      else if (status === 'ok') n.ok++
      else n.toCheck++
    }
    return n
  })

  /** Unseen items beyond today's quota, for an extra round. */
  function extra(track: Track, count: number): QuizItem[] {
    const unseen = BANKS[track].items.filter((i) => !cards.value[i.id])
    return roundRobin(unseen, (i) => i.theme).slice(0, count)
  }

  return { settings, cards, days, checks, levels, lastLevel, today, deadline, currentStreak, checkStats, plan, grade, extra, setCheck }
})
