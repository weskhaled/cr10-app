/* One-off port of the question banks from the first version of the kit
   (carte-resident-prep/assets/data/*.js, plain `window.X = …` files)
   into typed JSON under app/data/.

   Usage: node scripts/port-legacy.mjs ../carte-resident-prep/assets/data
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const srcDir = process.argv[2]
if (!srcDir) {
  console.error('usage: node scripts/port-legacy.mjs <legacy assets/data dir>')
  process.exit(1)
}

const window = {}
for (const f of ['civic-data.js', 'french-data.js']) {
  vm.runInNewContext(readFileSync(join(srcDir, f), 'utf8'), { window })
}

// legacy convention kept: options[0] is the correct answer, shuffled at display
const toItem = (kind) => (q) => {
  if (q.answer !== 0) throw new Error(`${q.id}: expected answer 0`)
  const { answer: _answer, ...rest } = q
  return { ...rest, id: `${kind}-${q.id}`, source: 'legacy' }
}

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../app/data')
function write(rel, data) {
  const target = join(dataDir, rel)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, JSON.stringify(data, null, 2) + '\n')
}

write('civic/bank.json', {
  themes: window.CIVIC_THEMES,
  questions: window.CIVIC_QUESTIONS.map(toItem('civ')),
})
write('french/bank.json', {
  themes: window.FRENCH_THEMES,
  questions: window.FRENCH_QUESTIONS.map(toItem('fr')),
  writing: window.FRENCH_EE_TASKS,
  speaking: window.FRENCH_EO_PARTS,
})

console.log(`✔ civic ${window.CIVIC_QUESTIONS.length} · french ${window.FRENCH_QUESTIONS.length} · EE ${window.FRENCH_EE_TASKS.length} · EO ${window.FRENCH_EO_PARTS.length}`)
