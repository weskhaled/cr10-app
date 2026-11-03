/* Morning audio: today's mix of clips, sized to the commute. */
import type { QuizItem, Track } from '../types/study'

export interface Clip {
  id: string
  track: Track
  title: string
  sec: number
  draft: boolean // unverified drafted answer (official list)
}

export interface ClipGroup {
  track: Track
  items: QuizItem[]
}

/** Takes clips group by group (in priority order) until the budget is filled; skips items without a clip. */
export function fillPlaylist(
  groups: ClipGroup[],
  clips: Record<string, { sec: number }>,
  budgetSec: number,
  verifiedOnly = false,
): Clip[] {
  const out: Clip[] = []
  const seen = new Set<string>()
  let total = 0
  for (const { track, items } of groups) {
    for (const item of items) {
      if (total >= budgetSec) return out
      const clip = clips[item.id]
      const draft = item.source === 'official-cr' && !item.verified
      if (!clip || seen.has(item.id) || (verifiedOnly && draft)) continue
      seen.add(item.id)
      out.push({ id: item.id, track, title: item.q, sec: clip.sec, draft })
      total += clip.sec
    }
  }
  return out
}

export const totalMinutes = (clips: Clip[]): number => Math.round(clips.reduce((s, c) => s + c.sec, 0) / 60)
