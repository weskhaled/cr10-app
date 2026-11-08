/* Daily plan: which items to study today, and the day-by-day log. */
import type { CardState, DayStats, QuizItem } from '../types/study'
import { addDays } from './dates'
import { isDue } from './srs'

export interface DailyQueue {
  reviews: QuizItem[]
  fresh: QuizItem[]
}

/** Due reviews (oldest first, weakest box first) + up to `newLeft` unseen items spread across themes. */
export function buildQueue(
  items: QuizItem[],
  cards: Record<string, CardState>,
  today: string,
  newLeft: number,
): DailyQueue {
  const reviews = items
    .filter((i) => cards[i.id] && isDue(cards[i.id]!, today))
    .sort((a, b) => {
      const ca = cards[a.id]!, cb = cards[b.id]!
      return ca.due.localeCompare(cb.due) || ca.box - cb.box
    })
  const unseen = items.filter((i) => !cards[i.id])
  return { reviews, fresh: roundRobin(unseen, (i) => i.theme).slice(0, Math.max(0, newLeft)) }
}

/** Interleaves groups so consecutive items come from different groups; order inside a group is kept. */
export function roundRobin<T>(list: T[], key: (item: T) => string): T[] {
  const groups = new Map<string, T[]>()
  for (const item of list) {
    const k = key(item)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(item)
  }
  const queues = [...groups.values()]
  const out: T[] = []
  for (let i = 0; out.length < list.length; i++) {
    for (const q of queues) if (q[i]) out.push(q[i]!)
  }
  return out
}

/** Consecutive active days ending today (or yesterday, if today hasn't started yet). */
export function streak(days: Record<string, DayStats>, today: string): number {
  const active = (d: string) => {
    const s = days[d]
    return !!s && s.learned + s.reviewed + (s.listened ?? 0) > 0
  }
  let d = active(today) ? today : addDays(today, -1)
  let n = 0
  while (active(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

/** Fisher–Yates, returns a new array. */
export function shuffle<T>(list: readonly T[]): T[] {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Shuffle that always gives the same order for the same seed (e.g. an item id),
    so a list doesn't reshuffle on every render — and the right answer isn't always first. */
export function stableShuffle<T>(list: readonly T[], seed: string): T[] {
  let h = 2166136261 // FNV-1a
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const random = () => { // mulberry32
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/** Practice one theme: due cards first, then unseen ones, then the weakest of the rest. */
export function themeQueue(items: QuizItem[], cards: Record<string, CardState>, today: string, size = 10): QuizItem[] {
  const box = (i: QuizItem) => cards[i.id]?.box ?? 0
  const due = items.filter((i) => cards[i.id] && isDue(cards[i.id]!, today)).sort((a, b) => box(a) - box(b))
  const unseen = items.filter((i) => !cards[i.id])
  const rest = items.filter((i) => cards[i.id] && !isDue(cards[i.id]!, today)).sort((a, b) => box(a) - box(b))
  return [...due, ...unseen, ...rest].slice(0, size)
}
