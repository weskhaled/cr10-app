import { describe, expect, it } from 'vitest'
import type { QuizItem } from '../app/types/study'
import { fillPlaylist, totalMinutes } from '../app/utils/audio'

const item = (id: string, extra: Partial<QuizItem> = {}): QuizItem =>
  ({ id, theme: 't', q: `q ${id}`, options: ['a', 'b', 'c', 'd'], explain: '', source: 'legacy', ...extra })
const clips = { a: { sec: 30 }, b: { sec: 30 }, c: { sec: 30 }, d: { sec: 30 } }

describe('fillPlaylist', () => {
  it('takes groups in order until the budget is reached', () => {
    const list = fillPlaylist([{ track: 'civic', items: [item('a'), item('b')] }, { track: 'french', items: [item('c'), item('d')] }], clips, 80)
    expect(list.map((c) => `${c.track}:${c.id}`)).toEqual(['civic:a', 'civic:b', 'french:c'])
    expect(totalMinutes(list)).toBe(2)
  })
  it('skips items without a clip and duplicates', () => {
    const list = fillPlaylist([{ track: 'civic', items: [item('x'), item('a'), item('a')] }], clips, 999)
    expect(list.map((c) => c.id)).toEqual(['a'])
  })
  it('marks unverified official answers as drafts and can leave them out', () => {
    const groups = [{ track: 'civic' as const, items: [item('a', { source: 'official-cr', verified: false }), item('b', { source: 'official-cr', verified: true }), item('c')] }]
    expect(fillPlaylist(groups, clips, 999).map((c) => c.draft)).toEqual([true, false, false])
    expect(fillPlaylist(groups, clips, 999, true).map((c) => c.id)).toEqual(['b', 'c'])
  })
})
