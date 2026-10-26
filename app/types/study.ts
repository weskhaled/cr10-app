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
