/* Build the morning-audio clips with the macOS French voice (no API key,
   runs offline): one clip per civic item and per French listening item.

     Civic:     « Question. <q> » · 3 s pause · « Réponse : <answer>. <explanation> »
     Listening: « Écoutez. <text> » · « Question : <q> » · 3 s pause · « Réponse : … »

   Output: public/audio/<id>.m4a (AAC, mono, 32 kbps) and app/data/audio.json
   ({ clips: { [id]: { sec, hash } } }). A clip is rebuilt only when its text,
   voice or rate changed — re-run after fixing an answer.

   Usage: node scripts/audio/build.mjs [--voice "Thomas"] [--rate 170] [--only <id-prefix>]
   Better voices: System Settings → Accessibility → Spoken Content → System voice →
   Manage Voices → French (France), e.g. "Thomas (Enhanced)" or "Audrey (Premium)".
*/
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'))

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined }
const PREFERRED = ['Audrey (Premium)', 'Audrey (Enhanced)', 'Aurélie (Enhanced)', 'Thomas (Enhanced)', 'Thomas']
const rate = Number(opt('rate') ?? 170)
const only = opt('only')

// ---- texts -------------------------------------------------------------
const tidy = (s) => s
  .replace(/\[…\]|\[\.\.\.\]/g, '…')
  .replace(/_{2,}/g, ' blanc ')
  .replace(/→/g, ', ')
  .replace(/\s+/g, ' ')
  .trim()
const sentence = (s) => (/[.!?…]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`)
const PAUSE = '[[slnc 3000]]'
const BREATH = '[[slnc 600]]'

function civicText(item) {
  const intro = item.sit ? 'Mise en situation.' : 'Question.'
  return `${intro} ${tidy(item.q)} ${PAUSE} Réponse : ${sentence(tidy(item.options[0]))} ${BREATH} ${tidy(item.explain)}`
}
function listeningText(item) {
  const q = tidy(item.q.replace(/^Écoutez[^.]*\.\s*/, ''))
  return `Écoutez. ${BREATH} ${tidy(item.say)} [[slnc 1500]] Question : ${q} ${PAUSE} Réponse : ${sentence(tidy(item.options[0]))} ${BREATH} ${tidy(item.explain)}`
}

const official = read('app/data/civic/official-cr.json')
const answers = read('app/data/civic/official-cr-answers.json')
const civicBank = read('app/data/civic/bank.json')
const frenchBank = read('app/data/french/bank.json')

const jobs = [
  ...official.questions.filter((q) => answers[q.id]).map((q) => ({ id: q.id, text: civicText({ ...q, ...answers[q.id] }) })),
  ...civicBank.questions.map((q) => ({ id: q.id, text: civicText(q) })),
  ...frenchBank.questions.filter((q) => q.say).map((q) => ({ id: q.id, text: listeningText(q) })),
].filter((j) => !only || j.id.startsWith(only))

// ---- voice -------------------------------------------------------------
const { stdout: voiceList } = await run('say', ['-v', '?'])
const installed = new Set(voiceList.split('\n').map((l) => l.replace(/\s{2,}.*$/, '').trim()).filter(Boolean))
const voice = opt('voice') ?? PREFERRED.find((v) => installed.has(v))
if (!voice || !installed.has(voice)) {
  console.error(`French voice not found (${opt('voice') ?? PREFERRED.join(', ')}). Installed French voices:`)
  console.error(voiceList.split('\n').filter((l) => /fr_FR/.test(l)).join('\n'))
  process.exit(1)
}

// ---- build -------------------------------------------------------------
const outDir = join(root, 'public/audio')
const manifestPath = join(root, 'app/data/audio.json')
mkdirSync(outDir, { recursive: true })
const manifest = existsSync(manifestPath) ? read('app/data/audio.json') : { clips: {} }
const work = join(tmpdir(), `cr10-audio-${process.pid}`)
mkdirSync(work, { recursive: true })

const hashOf = (text) => createHash('sha1').update(`${voice}|${rate}|${text}`).digest('hex').slice(0, 10)
const todo = jobs.filter((j) => manifest.clips[j.id]?.hash !== hashOf(j.text) || !existsSync(join(outDir, `${j.id}.m4a`)))

async function build(job) {
  const txt = join(work, `${job.id}.txt`), aiff = join(work, `${job.id}.aiff`), out = join(outDir, `${job.id}.m4a`)
  writeFileSync(txt, job.text)
  await run('say', ['-v', voice, '-r', String(rate), '-f', txt, '-o', aiff])
  await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '32000', '-c', '1', aiff, out])
  const { stdout } = await run('afinfo', [out])
  const sec = Number((stdout.match(/estimated duration: ([\d.]+)/) || [])[1] || 0)
  manifest.clips[job.id] = { sec: Math.round(sec * 10) / 10, hash: hashOf(job.text) }
}

let done = 0
const queue = [...todo]
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let job = queue.shift(); job; job = queue.shift()) {
    await build(job)
    if (++done % 25 === 0) console.log(`  ${done}/${todo.length}`)
  }
}))
rmSync(work, { recursive: true, force: true })

// drop clips whose item no longer exists
const ids = new Set(jobs.map((j) => j.id))
if (!only) {
  for (const id of Object.keys(manifest.clips)) {
    if (!ids.has(id)) {
      delete manifest.clips[id]
      rmSync(join(outDir, `${id}.m4a`), { force: true })
    }
  }
}

manifest.voice = voice
manifest.rate = rate
manifest.generatedAt = new Date().toISOString().slice(0, 10)
const sorted = Object.fromEntries(Object.entries(manifest.clips).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(manifestPath, JSON.stringify({ voice, rate, generatedAt: manifest.generatedAt, clips: sorted }, null, 1) + '\n')

const total = Object.values(sorted).reduce((s, c) => s + c.sec, 0)
console.log(`✔ ${todo.length} clip(s) built with "${voice}" at ${rate} wpm · ${Object.keys(sorted).length} clips, ${Math.round(total / 60)} min in total`)
