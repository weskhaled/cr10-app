/* French text-to-speech with the browser's voices (listening items). */

let voice: SpeechSynthesisVoice | null = null

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  voice =
    voices.find((v) => /^fr[-_]FR/i.test(v.lang) && /google|thomas|amelie|audrey|siri/i.test(v.name)) ??
    voices.find((v) => /^fr[-_]FR/i.test(v.lang)) ??
    voices.find((v) => /^fr/i.test(v.lang)) ??
    null
  return voice
}

export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Returns false when speech synthesis is unavailable (show the transcript instead). */
export function speakFrench(text: string, rate = 0.92): boolean {
  if (!canSpeak()) return false
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = voice ?? pickVoice()
  if (v) u.voice = v
  u.lang = 'fr-FR'
  u.rate = rate
  speechSynthesis.speak(u)
  return true
}

export function stopSpeech(): void {
  if (canSpeak()) speechSynthesis.cancel()
}

if (canSpeak()) speechSynthesis.addEventListener('voiceschanged', pickVoice)
