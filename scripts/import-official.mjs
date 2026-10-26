/* Import the official CR knowledge-question list (texts only) into
   app/data/civic/official-cr.json.

   Source: formation-civique.interieur.gouv.fr — Licence Ouverte / Etalab 2.0.
   The page publishes questions only (no options, no answers); the 12
   situational questions of the exam are not public.

   Usage (download first, then parse the saved file):
     curl -sSL -o /tmp/cr.html https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/
     node scripts/import-official.mjs /tmp/cr.html
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_URL = 'https://formation-civique.interieur.gouv.fr/examen-civique/liste-officielle-des-questions-de-connaissance-cr/'

// headings on the official page → our theme ids
const THEMES = {
  'principes et valeurs de la republique': 'valeurs',
  'systeme institutionnel et politique': 'institutions',
  'droits et devoirs': 'droits',
  'histoire geographie et culture': 'histoire',
  'vivre dans la societe francaise': 'vie',
}

const htmlPath = process.argv[2]
if (!htmlPath) {
  console.error('usage: node scripts/import-official.mjs <saved-page.html>')
  process.exit(1)
}
const html = readFileSync(htmlPath, 'utf8')

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function decode(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// each theme is "<b>Heading :</b></p><ul><li>…</li>…</ul>"
const blockRe = /<b>([^<]+?)\s*:\s*<\/b><\/p>\s*<ul>([\s\S]*?)<\/ul>/g
const questions = []
const counts = {}
let m
while ((m = blockRe.exec(html))) {
  const theme = THEMES[fold(decode(m[1]))]
  if (!theme) {
    console.error(`unknown theme heading: "${decode(m[1])}"`)
    process.exit(1)
  }
  for (const li of m[2].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
    const q = decode(li[1])
    if (!q) continue
    // id from the text, so SRS progress survives a reordering of the list
    const id = `cr-${theme.slice(0, 4)}-${createHash('sha1').update(fold(q)).digest('hex').slice(0, 8)}`
    questions.push({ id, theme, q })
    counts[theme] = (counts[theme] || 0) + 1
  }
}

const ids = new Set(questions.map((q) => q.id))
if (ids.size !== questions.length) {
  console.error('duplicate question ids — two questions share the same text')
  process.exit(1)
}
if (Object.keys(counts).length !== 5) {
  console.error('expected 5 themes, found', counts)
  process.exit(1)
}

const out = {
  source: SOURCE_URL,
  licence: 'Licence Ouverte / Etalab 2.0',
  importedAt: new Date().toISOString().slice(0, 10),
  count: questions.length,
  counts,
  questions,
}
const target = join(dirname(fileURLToPath(import.meta.url)), '../app/data/civic/official-cr.json')
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, JSON.stringify(out, null, 2) + '\n')
console.log(`✔ ${questions.length} official questions`, counts)
