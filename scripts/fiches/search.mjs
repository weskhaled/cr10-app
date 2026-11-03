/* Keyword search over the official fiches (research/fiches.json).
     node scripts/fiches/search.mjs "<query>" [k]        top-k fiches + best-matching sentences
     node scripts/fiches/search.mjs --pack <theme> [k]    the same for every official question of a theme
*/
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const { fiches } = JSON.parse(readFileSync(join(root, 'research/fiches.json'), 'utf8'))
const official = JSON.parse(readFileSync(join(root, 'app/data/civic/official-cr.json'), 'utf8'))

const STOP = new Set(('a au aux avec ce ces cette dans de des du elle en est et etre il ils la le les leur lui mais ne ni on ou par pas pour qu que quel quelle quelles quels qui sa se ses son sont sur un une vos votre vous y peut peuvent faut doit doivent ' +
  'proposition propositions suivantes parmi correcte quoi quand comment combien pourquoi cela fait faire tout tous toute toutes plus moins entre sous sans ont france francais francaise').split(' '))
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const terms = (s) => fold(s).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w))

const docs = fiches.map((f) => ({ ...f, words: terms(f.title + ' ' + f.text), sentences: f.text.split(/(?<=[.!?:])\s+|\n/).filter((x) => x.length > 25) }))
const df = new Map()
for (const d of docs) for (const w of new Set(d.words)) df.set(w, (df.get(w) || 0) + 1)
const idf = (w) => Math.log((docs.length + 1) / ((df.get(w) || 0) + 1))

function search(query, k = 3) {
  const q = [...new Set(terms(query))]
  return docs
    .map((d) => {
      const tf = new Map()
      for (const w of d.words) tf.set(w, (tf.get(w) || 0) + 1)
      const inTitle = new Set(terms(d.title))
      const score = q.reduce((s, w) => s + (tf.has(w) ? (1 + Math.log(tf.get(w))) * idf(w) * (inTitle.has(w) ? 2 : 1) : 0), 0)
      return { d, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ d, score }) => ({
      score: +score.toFixed(1),
      title: d.title,
      url: d.url,
      best: d.sentences
        .map((s) => ({ s, n: terms(s).filter((w) => q.includes(w)).reduce((t, w) => t + idf(w), 0) }))
        .sort((a, b) => b.n - a.n).slice(0, 3).filter((x) => x.n > 0).map((x) => x.s.trim().slice(0, 260)),
    }))
}

const [mode, arg, kArg] = process.argv.slice(2)
const print = (r, pad = '') => {
  console.log(`${pad}[${r.score}] ${r.title} — ${r.url}`)
  for (const s of r.best) console.log(`${pad}   · ${s}`)
}
if (mode === '--pack') {
  for (const q of official.questions.filter((x) => x.theme === arg)) {
    console.log(`\n### ${q.id} — ${q.q}`)
    for (const r of search(q.q, Number(kArg) || 2)) print(r, '  ')
  }
} else if (mode) {
  for (const r of search(mode, Number(arg) || 3)) print(r)
} else {
  console.error('usage: search.mjs "<query>" [k] | --pack <theme> [k]')
  process.exit(1)
}
