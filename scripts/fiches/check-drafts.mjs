/* Validate drafted answers for one theme: node scripts/fiches/check-drafts.mjs <theme>
   Drafts live in research/drafts/<theme>.json as { [questionId]: { options, explain, ref, note? } }. */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const theme = process.argv[2]
const official = JSON.parse(readFileSync(join(root, 'app/data/civic/official-cr.json'), 'utf8'))
const urls = new Set(JSON.parse(readFileSync(join(root, 'research/fiches.json'), 'utf8')).fiches.map((f) => f.url))
const file = join(root, 'research/drafts', `${theme}.json`)
const drafts = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
const ids = official.questions.filter((q) => q.theme === theme).map((q) => q.id)
if (!ids.length) {
  console.error(`unknown theme "${theme}"`)
  process.exit(1)
}

let errors = 0, longest = 0, noRef = 0
const missing = []
const fail = (m) => { errors++; console.error('✘', m) }
for (const id of ids) {
  const d = drafts[id]
  if (!d) { missing.push(id); continue }
  if (!Array.isArray(d.options) || d.options.length !== 4) { fail(`${id}: needs 4 options`); continue }
  if (d.options.some((o) => typeof o !== 'string' || !o.trim())) fail(`${id}: empty option`)
  if (new Set(d.options.map((o) => o.trim().toLowerCase())).size !== 4) fail(`${id}: duplicate options`)
  if (d.options.some((o) => o.length > 160)) fail(`${id}: option over 160 chars`)
  if (d.options.some((o) => /toutes les r[ée]ponses|aucune des r[ée]ponses/i.test(o))) fail(`${id}: "all/none of the above" option`)
  if (Math.max(...d.options.map((o) => o.length)) === d.options[0].length) longest++
  if (!d.explain || d.explain.length < 20 || d.explain.length > 450) fail(`${id}: explain missing or not 20–450 chars`)
  if (d.ref === null || d.ref === undefined) noRef++
  else if (!urls.has(d.ref)) fail(`${id}: ref is not a fiche URL: ${d.ref}`)
}
for (const id of Object.keys(drafts)) if (!ids.includes(id)) fail(`${id}: not a ${theme} question`)
const done = ids.length - missing.length
console.log(`${theme}: ${done}/${ids.length} drafted, ${errors} errors, ${noRef} without ref, correct option longest in ${longest}/${done || 1} (keep well under half)`)
if (missing.length) console.log(`missing: ${missing.join(' ')}`)
process.exit(errors || missing.length ? 1 : 0)
