import { describe, expect, it } from 'vitest'
import { isDue, isMastered, review } from '../app/utils/srs'

const today = '2026-10-26'

describe('review', () => {
  it('starts a new card in box 2 when right, box 1 when wrong', () => {
    expect(review(undefined, true, today)).toEqual({ box: 2, due: '2026-10-28', seen: 1, lapses: 0, first: today, last: today })
    expect(review(undefined, false, today)).toEqual({ box: 1, due: '2026-10-27', seen: 1, lapses: 1, first: today, last: today })
  })
  it('climbs the boxes and caps at box 5', () => {
    let card = review(undefined, true, today)
    for (let i = 0; i < 6; i++) card = review(card, true, today)
    expect(card.box).toBe(5)
    expect(card.due).toBe('2026-11-09')
    expect(isMastered(card)).toBe(true)
  })
  it('sends a wrong answer back to box 1', () => {
    const card = review({ box: 4, due: today, seen: 5, lapses: 0, first: '2026-10-01', last: '2026-10-19' }, false, today)
    expect(card).toMatchObject({ box: 1, due: '2026-10-27', lapses: 1, seen: 6, first: '2026-10-01' })
    expect(isMastered(card)).toBe(false)
  })
  it('is due on or after its due date', () => {
    const card = review(undefined, true, today)
    expect(isDue(card, '2026-10-27')).toBe(false)
    expect(isDue(card, '2026-10-28')).toBe(true)
  })
})
