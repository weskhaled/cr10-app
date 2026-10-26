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
    return !!s && s.learned + s.reviewed > 0
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
