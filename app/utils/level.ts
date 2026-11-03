/* French level check (placement): per skill, levels A1 → B2 in order,
   3 items per level. A level is passed with 2 right answers (the 3rd item
   is skipped when the first two are right) and the skill stops at the
   first level failed. The result is an estimate, not a TCF score. */
import type { Band, Level, TestedSkill } from '../types/study'

export const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2']
export const PER_LEVEL = 3
export const PASS = 2
export const TARGET: Level = 'B1'

export interface SkillState {
  band: Band // highest level passed so far
  done: boolean
  level: Level | null // level being tested, null when done
}

export function evaluate(answers: { level: Level; correct: boolean }[]): SkillState {
  let band: Band = 'pre-A1'
  for (const level of LEVELS) {
    const at = answers.filter((a) => a.level === level)
    const right = at.filter((a) => a.correct).length
    if (right >= PASS) {
      band = level
      continue
    }
    if (at.length - right > PER_LEVEL - PASS) return { band, done: true, level: null }
    return { band, done: false, level }
  }
  return { band, done: true, level: null }
}

/** Self-assessment: the highest level whose statement is ticked, all lower ones ticked too. */
export function selfBand(ticked: Partial<Record<Level, boolean>>): Band {
  let band: Band = 'A1' // the statements start at A2
  for (const level of LEVELS.slice(1)) {
    if (!ticked[level]) break
    band = level
  }
  return band
}

export const bandRank = (band: Band): number => (band === 'pre-A1' ? 0 : LEVELS.indexOf(band) + 1)

/** Levels still missing to reach B1 (0 when reached). */
export const gapToTarget = (band: Band): number => Math.max(0, bandRank(TARGET) - bandRank(band))

export const SKILL_ORDER: TestedSkill[] = ['gram', 'ce', 'co']
