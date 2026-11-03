/* Serve the generated site (.output/public) to try the production build,
   service worker included. Usage: node scripts/serve-static.mjs [port] */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../.output/public')
const port = Number(process.env.PORT) || Number(process.argv[2]) || 3011
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.m4a': 'audio/mp4', '.txt': 'text/plain; charset=utf-8',
}

async function resolve(path) {
  for (const candidate of [path, join(path, 'index.html'), join(root, '200.html')]) {
    try {
      if ((await stat(candidate)).isFile()) return candidate
    } catch {}
  }
  return null
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = normalize(join(root, decodeURIComponent(url.pathname)))
  if (!path.startsWith(root)) return res.writeHead(403).end()
  const file = await resolve(path)
  if (!file) return res.writeHead(404).end('404')
  const data = await readFile(file)
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-cache' })
  res.end(data)
}).listen(port, () => console.log(`cr10-app build → http://localhost:${port}`))
