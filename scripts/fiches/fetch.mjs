/* Download the official revision fiches (formation-civique.interieur.gouv.fr,
   Licence Ouverte / Etalab 2.0) and extract their text into research/fiches.json
   (+ fiches.txt for grep). The raw HTML goes to a cache dir outside the repo.

   Usage: node scripts/fiches/fetch.mjs <cache-dir>
*/
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = 'https://formation-civique.interieur.gouv.fr'
const THEMES = [
  'principes-et-valeurs-de-la-republique',
  'systeme-institutionnel-et-politique',
  'droits-et-devoirs',
  'histoire-geographie-et-culture',
  'vivre-dans-la-societe-fran%C3%A7aise',
]
const cache = process.argv[2]
if (!cache) {
  console.error('usage: node scripts/fiches/fetch.mjs <cache-dir>')
  process.exit(1)
}
mkdirSync(cache, { recursive: true })
const out = join(dirname(fileURLToPath(import.meta.url)), '../../research')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(path) {
  const file = join(cache, encodeURIComponent(path) + '.html')
  if (existsSync(file)) return readFileSync(file, 'utf8')
  const res = await fetch(BASE + path, { headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) cr10-app study tool' } })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  const html = await res.text()
  writeFileSync(file, html)
  await sleep(300) // be gentle with the server
  return html
}

const decode = (s) => s.replace(/<(br|\/p|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d)).replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()

// theme page → section pages → leaf fiches (/fiches-par-thematiques/<theme>/<section>/<fiche>/)
const links = (html) => [...html.matchAll(/href="(\/fiches-par-thematiques\/[^"]+)"/g)].map((m) => m[1])
const depth = (path) => path.split('/').length // '/a/b/c/' → 5 for a section, 6 for a fiche
const sections = new Set(), leaves = new Set()
for (const t of THEMES) for (const l of links(await get(`/fiches-par-thematiques/${t}/`))) if (depth(l) === 5) sections.add(l)
for (const s of [...sections].sort()) for (const l of links(await get(s))) if (depth(l) >= 6) leaves.add(l)

const fiches = []
for (const path of [...leaves].sort()) {
  const html = await get(path)
  const title = decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0].replace(/<nav[\s\S]*?<\/nav>/g, '').replace(/<script[\s\S]*?<\/script>/g, '')
  const start = main.indexOf('<h1')
  fiches.push({ url: BASE + path, title, text: decode(start >= 0 ? main.slice(start) : main) })
}

mkdirSync(out, { recursive: true })
writeFileSync(join(out, 'fiches.json'), JSON.stringify({ source: BASE, licence: 'Licence Ouverte / Etalab 2.0', fetchedAt: new Date().toISOString().slice(0, 10), fiches }, null, 1) + '\n')
writeFileSync(join(out, 'fiches.txt'), fiches.map((f) => `=== ${f.title} | ${f.url}\n${f.text}`).join('\n\n') + '\n')
console.log(`✔ ${fiches.length} fiches → research/fiches.json, research/fiches.txt`)
