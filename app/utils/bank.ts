/* Question banks. Exam content stays in French, whatever the UI language. */
import type { OfficialQuestion, QuizItem, Theme, Track } from '../types/study'
import civic from '../data/civic/bank.json'
import french from '../data/french/bank.json'
import official from '../data/civic/official-cr.json'

export interface Bank {
  label: string
  themes: Theme[]
  items: QuizItem[]
}

export const BANKS: Record<Track, Bank> = {
  civic: { label: 'Civic exam', themes: civic.themes, items: civic.questions as QuizItem[] },
  french: { label: 'French B1', themes: french.themes, items: french.questions as QuizItem[] },
}

/** Official CR knowledge questions (texts only) — formation-civique.interieur.gouv.fr, Licence Ouverte. */
export const OFFICIAL = official as {
  source: string
  licence: string
  importedAt: string
  count: number
  counts: Record<string, number>
  questions: OfficialQuestion[]
}

export function themeLabel(track: Track, id: string): string {
  return BANKS[track].themes.find((t) => t.id === id)?.label ?? id
}

export function isTrack(value: unknown): value is Track {
  return value === 'civic' || value === 'french'
}
