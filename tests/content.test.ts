import { describe, expect, it } from 'vitest'
import type { OfficialAnswer, QuizItem } from '../app/types/study'
import civic from '../app/data/civic/bank.json'
import french from '../app/data/french/bank.json'
import official from '../app/data/civic/official-cr.json'
import answersJson from '../app/data/civic/official-cr-answers.json'

const answers = answersJson as Record<string, OfficialAnswer>
const officialIds = new Set(official.questions.map((q) => q.id))

function expectWellFormed(id: string, options: string[], explain: string) {
  expect(options, id).toHaveLength(4)
  expect(new Set(options.map((o) => o.trim().toLowerCase())).size, `${id}: duplicate options`).toBe(4)
  expect(options.every((o) => o.trim().length > 0), `${id}: empty option`).toBe(true)
  expect(explain.length, `${id}: explanation`).toBeGreaterThan(10)
}

describe('official list', () => {
  it('has the 209 CR questions over 5 themes, unique ids', () => {
    expect(official.questions).toHaveLength(official.count)
    expect(officialIds.size).toBe(official.count)
    expect(Object.keys(official.counts)).toHaveLength(5)
  })
})

describe('drafted official answers', () => {
  it('only answer questions that exist in the official list', () => {
    for (const id of Object.keys(answers)) expect(officialIds.has(id), id).toBe(true)
  })
  it('are well-formed and point to an official fiche (or none)', () => {
    for (const [id, a] of Object.entries(answers)) {
      expectWellFormed(id, a.options, a.explain)
      expect(typeof a.verified, id).toBe('boolean')
      if (a.ref !== null) expect(a.ref, id).toMatch(/^https:\/\/formation-civique\.interieur\.gouv\.fr\//)
    }
  })
})

describe('ported banks', () => {
  it('are well-formed with ids unique across banks', () => {
    const items = [...civic.questions, ...french.questions] as QuizItem[]
    for (const q of items) expectWellFormed(q.id, q.options, q.explain)
    const ids = [...items.map((q) => q.id), ...officialIds]
    expect(new Set(ids).size).toBe(ids.length)
  })
})
