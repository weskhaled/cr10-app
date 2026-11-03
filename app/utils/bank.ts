/* Question banks. Exam content stays in French, whatever the UI language. */
import type { OfficialAnswer, OfficialQuestion, QuizItem, Theme, Track } from '../types/study'
import civic from '../data/civic/bank.json'
import french from '../data/french/bank.json'
import official from '../data/civic/official-cr.json'
import officialAnswers from '../data/civic/official-cr-answers.json'

export interface Bank {
  label: string
  themes: Theme[]
  items: QuizItem[]
}

/** Official CR knowledge questions — formation-civique.interieur.gouv.fr, Licence Ouverte. */
export const OFFICIAL = official as {
  source: string
  licence: string
  importedAt: string
  count: number
  counts: Record<string, number>
  questions: OfficialQuestion[]
}

/** Drafted options/answers for the official questions (the ministry publishes questions only). */
export const OFFICIAL_ANSWERS = officialAnswers as Record<string, OfficialAnswer>

const officialItems: QuizItem[] = OFFICIAL.questions.flatMap((q) => {
  const a = OFFICIAL_ANSWERS[q.id]
  if (!a) return []
  return [{ ...q, options: a.options, explain: a.explain, source: 'official-cr', verified: a.verified, ...(a.ref ? { ref: a.ref } : {}), ...(a.note ? { note: a.note } : {}) }]
})

// official questions first: the exam's knowledge questions come from that list
export const BANKS: Record<Track, Bank> = {
  civic: { label: 'Civic exam', themes: civic.themes, items: [...officialItems, ...(civic.questions as QuizItem[])] },
  french: { label: 'French B1', themes: french.themes, items: french.questions as QuizItem[] },
}

export function themeLabel(track: Track, id: string): string {
  return BANKS[track].themes.find((t) => t.id === id)?.label ?? id
}

export function isTrack(value: unknown): value is Track {
  return value === 'civic' || value === 'french'
}
