import { describe, expect, it } from 'vitest'
import type { Level } from '../app/types/study'
import { evaluate, gapToTarget, selfBand } from '../app/utils/level'
import check from '../app/data/french/level-check.json'

const run = (...answers: [Level, boolean][]) => evaluate(answers.map(([level, correct]) => ({ level, correct })))

describe('evaluate', () => {
  it('starts at A1', () => {
    expect(run()).toEqual({ band: 'pre-A1', done: false, level: 'A1' })
  })
  it('passes a level with two right answers and moves on', () => {
    expect(run(['A1', true], ['A1', true])).toEqual({ band: 'A1', done: false, level: 'A2' })
    expect(run(['A1', true], ['A1', false], ['A1', true])).toEqual({ band: 'A1', done: false, level: 'A2' })
  })
  it('stops at the first failed level', () => {
    expect(run(['A1', true], ['A1', true], ['A2', false], ['A2', false])).toEqual({ band: 'A1', done: true, level: null })
    expect(run(['A1', false], ['A1', false])).toEqual({ band: 'pre-A1', done: true, level: null })
  })
  it('ends after B2', () => {
    const all = (['A1', 'A2', 'B1', 'B2'] as Level[]).flatMap((l): [Level, boolean][] => [[l, true], [l, true]])
    expect(run(...all)).toEqual({ band: 'B2', done: true, level: null })
  })
})

describe('selfBand and gap', () => {
  it('needs every lower statement ticked', () => {
    expect(selfBand({})).toBe('A1')
    expect(selfBand({ A2: true, B1: true })).toBe('B1')
    expect(selfBand({ B1: true, B2: true })).toBe('A1')
  })
  it('counts the levels missing to B1', () => {
    expect(gapToTarget('pre-A1')).toBe(3)
    expect(gapToTarget('A2')).toBe(1)
    expect(gapToTarget('B1')).toBe(0)
    expect(gapToTarget('B2')).toBe(0)
  })
})

describe('level-check items', () => {
  it('have 3 well-formed items per level and per skill, unique ids', () => {
    const ids = new Set(check.items.map((i) => i.id))
    expect(ids.size).toBe(check.items.length)
    for (const skill of ['gram', 'ce', 'co'])
      for (const level of ['A1', 'A2', 'B1', 'B2'])
        expect(check.items.filter((i) => i.theme === skill && i.level === level), `${skill} ${level}`).toHaveLength(3)
    for (const i of check.items) {
      expect(new Set(i.options).size, i.id).toBe(4)
      if (i.theme === 'co') expect(i.say, i.id).toBeTruthy()
    }
  })
})
