import { describe, expect, it } from 'vitest'
import en from '../i18n/locales/en.json'
import fr from '../i18n/locales/fr.json'
import ar from '../i18n/locales/ar.json'

type Tree = { [key: string]: string | Tree }
const flatten = (tree: Tree, prefix = ''): Record<string, string> =>
  Object.fromEntries(Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [[prefix + k, v]] : Object.entries(flatten(v, `${prefix}${k}.`))))

const EN = flatten(en), FR = flatten(fr), AR = flatten(ar)
const placeholders = (s: string) => [...new Set(s.match(/\{\w+\}/g) ?? [])].sort()

describe('translations', () => {
  it('have exactly the English keys', () => {
    expect(Object.keys(FR).sort()).toEqual(Object.keys(EN).sort())
    expect(Object.keys(AR).sort()).toEqual(Object.keys(EN).sort())
  })
  it('use the same placeholders as English', () => {
    for (const [key, text] of Object.entries(EN)) {
      const expected = placeholders(text).filter((p) => p !== '{n}') // plural forms may spell out the number
      for (const [lang, msgs] of [['fr', FR], ['ar', AR]] as const) {
        const got = placeholders(msgs[key]!)
        for (const p of expected) expect(got, `${lang}:${key} misses ${p}`).toContain(p)
      }
    }
  })
  it('give Arabic plurals all six forms (zero, one, two, few, many, other)', () => {
    for (const [key, text] of Object.entries(AR)) {
      if (text.includes('|')) expect(text.split('|'), key).toHaveLength(6)
    }
  })
})
