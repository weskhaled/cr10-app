import { describe, expect, it } from 'vitest'
import type { QuizItem } from '../app/types/study'
import { buildQueue, roundRobin, stableShuffle, streak, themeQueue } from '../app/utils/plan'

const item = (id: string, theme: string): QuizItem =>
  ({ id, theme, q: id, options: ['a', 'b', 'c', 'd'], explain: '', source: 'legacy' })

const items = [item('a1', 'a'), item('a2', 'a'), item('a3', 'a'), item('b1', 'b'), item('c1', 'c')]

describe('buildQueue', () => {
  it('returns due reviews oldest first, then new items across themes', () => {
    const cards = {
      a1: { box: 3, due: '2026-10-25', seen: 3, lapses: 0, first: '2026-10-20', last: '2026-10-21' },
      b1: { box: 1, due: '2026-10-24', seen: 1, lapses: 1, first: '2026-10-20', last: '2026-10-23' },
      c1: { box: 2, due: '2026-10-30', seen: 1, lapses: 0, first: '2026-10-20', last: '2026-10-26' },
    }
    const q = buildQueue(items, cards, '2026-10-26', 5)
    expect(q.reviews.map((i) => i.id)).toEqual(['b1', 'a1'])
    expect(q.fresh.map((i) => i.id)).toEqual(['a2', 'a3'])
  })
  it('caps new items at the quota left for today', () => {
    expect(buildQueue(items, {}, '2026-10-26', 2).fresh.map((i) => i.id)).toEqual(['a1', 'b1'])
    expect(buildQueue(items, {}, '2026-10-26', -1).fresh).toEqual([])
  })
})

describe('roundRobin', () => {
  it('interleaves groups and keeps every item', () => {
    expect(roundRobin(items, (i) => i.theme).map((i) => i.id)).toEqual(['a1', 'b1', 'c1', 'a2', 'a3'])
  })
})

describe('streak', () => {
  const day = { learned: 1, reviewed: 0, correct: 1, wrong: 0 }
  it('counts consecutive active days', () => {
    expect(streak({ '2026-10-24': day, '2026-10-25': day, '2026-10-26': day }, '2026-10-26')).toBe(3)
  })
  it('still counts yesterday when today has not started', () => {
    expect(streak({ '2026-10-24': day, '2026-10-25': day }, '2026-10-26')).toBe(2)
  })
  it('breaks on a missed day', () => {
    expect(streak({ '2026-10-23': day, '2026-10-25': day }, '2026-10-26')).toBe(1)
  })
})

describe('stableShuffle', () => {
  it('gives the same order for the same seed and keeps every item', () => {
    const a = stableShuffle([0, 1, 2, 3], 'cr-vale-1')
    expect(stableShuffle([0, 1, 2, 3], 'cr-vale-1')).toEqual(a)
    expect([...a].sort()).toEqual([0, 1, 2, 3])
  })
  it('does not leave the first option first for most seeds', () => {
    const firstStays = Array.from({ length: 200 }, (_, i) => stableShuffle([0, 1, 2, 3], `id-${i}`)[0] === 0).filter(Boolean).length
    expect(firstStays).toBeLessThan(90) // ~50 expected for a fair shuffle
  })
})

describe('themeQueue', () => {
  it('takes due cards, then unseen, then the weakest others', () => {
    const cards = {
      a1: { box: 3, due: '2026-10-30', seen: 3, lapses: 0, first: '2026-10-20', last: '2026-10-26' },
      a2: { box: 2, due: '2026-10-25', seen: 1, lapses: 0, first: '2026-10-20', last: '2026-10-23' },
      b1: { box: 1, due: '2026-10-28', seen: 1, lapses: 1, first: '2026-10-20', last: '2026-10-27' },
    }
    expect(themeQueue(items, cards, '2026-10-26', 4).map((i) => i.id)).toEqual(['a2', 'a3', 'c1', 'b1'])
  })
})
