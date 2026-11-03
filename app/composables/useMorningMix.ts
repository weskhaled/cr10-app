/* Today's morning-audio mix: today's new civic items, the ones you missed,
   a few French listening items, then upcoming civic items to fill the commute. */
import audio from '~/data/audio.json'

const CLIPS = (audio as { clips: Record<string, { sec: number }> }).clips
const FRENCH_PER_MIX = 3

export function useMorningMix() {
  const { plan, cards, settings } = useStudy()
  const base = useRuntimeConfig().app.baseURL

  const mix = computed(() => {
    const civic = plan('civic')
    const missed = BANKS.civic.items.filter((i) => cards.value[i.id]?.box === 1)
    const upcoming = roundRobin(BANKS.civic.items.filter((i) => !cards.value[i.id] && !civic.fresh.includes(i)), (i) => i.theme)
    const listening = BANKS.french.items.filter((i) => i.say)
    const french = [...listening.filter((i) => !cards.value[i.id]), ...listening.filter((i) => cards.value[i.id])]
    return fillPlaylist(
      [
        { track: 'civic', items: civic.fresh },
        { track: 'civic', items: missed },
        { track: 'french', items: french.slice(0, FRENCH_PER_MIX) },
        { track: 'civic', items: upcoming },
      ],
      CLIPS,
      settings.value.commuteMin * 60,
      settings.value.verifiedAudioOnly,
    )
  })

  const src = (id: string) => `${base}audio/${id}.m4a`
  const allSources = Object.keys(CLIPS).map(src)

  return { mix, src, allSources, clipCount: allSources.length }
}
