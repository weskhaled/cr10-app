/* Spaced repetition: Leitner boxes with intervals compressed for a
   ~30-day horizon. Right → next box; wrong → back to box 1. */
import type { CardState } from '../types/study'
import { addDays } from './dates'

export const INTERVALS = [0, 1, 2, 4, 7, 14] // days until next review, indexed by box 1–5
export const MAX_BOX = 5
export const MASTERED_BOX = 4

export function review(card: CardState | undefined, correct: boolean, today: string): CardState {
  // a new card answered right starts in box 2
  const box = correct ? Math.min(MAX_BOX, (card?.box ?? 1) + 1) : 1
  return {
    box,
    due: addDays(today, INTERVALS[box]!),
    seen: (card?.seen ?? 0) + 1,
    lapses: (card?.lapses ?? 0) + (correct ? 0 : 1),
    first: card?.first ?? today,
    last: today,
  }
}

export const isDue = (card: CardState, today: string): boolean => card.due <= today

export const isMastered = (card: CardState | undefined): boolean => !!card && card.box >= MASTERED_BOX
