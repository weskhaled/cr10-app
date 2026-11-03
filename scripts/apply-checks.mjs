/* Apply the checks made in the app ("Matches the fiche" / "Something's wrong")
   to app/data/civic/official-cr-answers.json.

   Export a backup from Settings, then:
     node scripts/apply-checks.mjs ~/Downloads/cr10-backup-YYYY-MM-DD.json

   "ok" → verified: true. "flagged" → listed so the answer can be fixed
   (it stays unverified).
*/
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const backupPath = process.argv[2]
if (!backupPath) {
  console.error('usage: node scripts/apply-checks.mjs <cr10-backup.json>')
  process.exit(1)
}
const backup = JSON.parse(readFileSync(backupPath, 'utf8'))
const checks = backup?.data?.['cr10v2:checks']
if (backup?.app !== 'cr10-app' || !checks) {
  console.error('not a cr10-app backup with checks')
  process.exit(1)
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../app/data/civic')
const target = join(dataDir, 'official-cr-answers.json')
const answers = JSON.parse(readFileSync(target, 'utf8'))
const questions = Object.fromEntries(JSON.parse(readFileSync(join(dataDir, 'official-cr.json'), 'utf8')).questions.map((q) => [q.id, q.q]))

let verified = 0
const flagged = []
for (const [id, check] of Object.entries(checks)) {
  if (!answers[id]) continue
  if (check.status === 'ok' && !answers[id].verified) {
    answers[id].verified = true
    verified++
  } else if (check.status === 'flagged') {
    answers[id].verified = false
    flagged.push(id)
  }
}
writeFileSync(target, JSON.stringify(answers, null, 2) + '\n')

const total = Object.values(answers).filter((a) => a.verified).length
console.log(`✔ ${verified} newly verified · ${total}/${Object.keys(answers).length} verified in total`)
if (flagged.length) {
  console.log(`\n⚑ ${flagged.length} flagged answer(s) to fix:`)
  for (const id of flagged) console.log(`  ${id}  ${questions[id]}\n      → ${answers[id].options[0]}`)
}
