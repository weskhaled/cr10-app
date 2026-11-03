/* Merge drafted answers for the official questions into
   app/data/civic/official-cr-answers.json.

   Drafts: one JSON file per theme ({ [id]: { options, explain, ref, note? } }).
   Every merged entry is `verified: false`; entries already verified are kept
   as they are unless --force is passed.

   Usage: node scripts/merge-drafts.mjs [drafts-dir (default research/drafts)] [--force]
*/
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const force = args.includes('--force')
const draftsDir = args.find((a) => a !== '--force') ?? join(here, '../research/drafts')

const dataDir = join(here, '../app/data/civic')
const official = JSON.parse(readFileSync(join(dataDir, 'official-cr.json'), 'utf8'))
const target = join(dataDir, 'official-cr-answers.json')
const answers = existsSync(target) ? JSON.parse(readFileSync(target, 'utf8')) : {}

let added = 0, kept = 0, missing = 0
for (const theme of Object.keys(official.counts)) {
  const file = join(draftsDir, `${theme}.json`)
  const drafts = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
  for (const q of official.questions.filter((x) => x.theme === theme)) {
    const d = drafts[q.id]
    if (!d) { missing++; continue }
    if (answers[q.id]?.verified && !force) { kept++; continue }
    answers[q.id] = { options: d.options, explain: d.explain, ref: d.ref ?? null, verified: false, ...(d.note ? { note: d.note } : {}) }
    added++
  }
}

// keep the file in official-list order
const ordered = Object.fromEntries(official.questions.filter((q) => answers[q.id]).map((q) => [q.id, answers[q.id]]))
writeFileSync(target, JSON.stringify(ordered, null, 2) + '\n')
console.log(`✔ ${added} drafts merged · ${kept} verified answers kept · ${missing} questions without a draft`)
