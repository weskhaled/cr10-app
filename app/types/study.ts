export type Track = 'civic' | 'french'

export interface Theme {
  id: string
  label: string
}

/** A multiple-choice item. `options[0]` is the correct answer; options are shuffled at display. */
export interface QuizItem {
  id: string
  theme: string
  q: string
  options: string[]
  explain: string
  source: 'legacy' | 'official-cr'
  verified?: boolean // official-cr: answer checked against the official fiche
  ref?: string // official fiche supporting the answer
  note?: string // why the drafted answer needs a closer check
  sit?: boolean // civic: mise en situation
  say?: string // french: text read aloud (listening)
  ctx?: string // french: reading passage
  img?: string // inline SVG (trusted, local)
}

/** Official knowledge question — text only until options/answers are added. */
export interface OfficialQuestion {
  id: string
  theme: string
  q: string
}

/** Drafted options/answer for an official question, keyed by question id. */
export interface OfficialAnswer {
  options: string[] // options[0] is the correct answer
  explain: string
  ref: string | null
  verified: boolean
  note?: string
}

/** The user's own check of a drafted answer against the fiche. */
export interface AnswerCheck {
  status: 'ok' | 'flagged'
  on: string // ISO date
}

/** Leitner card state, one per item seen at least once. Dates are ISO `YYYY-MM-DD`. */
export interface CardState {
  box: number
  due: string
  seen: number
  lapses: number
  first: string // day first seen — counts towards that day's new-item quota
  last: string
}

export interface DayStats {
  learned: number
  reviewed: number
  correct: number
  wrong: number
}

export interface Settings {
  expiry: string // titre de séjour expiry
  civicExam: string // booked date, '' if not booked
  frenchExam: string // booked TCF/TEF date, '' if not booked
}

export type Level = 'A1' | 'A2' | 'B1' | 'B2'
export type Band = 'pre-A1' | Level

/** A placement item of the French level check; `theme` is the skill (co / ce / gram). */
export interface LevelItem extends Omit<QuizItem, 'source'> {
  level: Level
}

export type TestedSkill = 'gram' | 'ce' | 'co'
export type SelfSkill = 'ee' | 'eo'

export interface LevelResult {
  on: string // ISO date
  bands: Record<TestedSkill, Band>
  self: Record<SelfSkill, Band>
}
