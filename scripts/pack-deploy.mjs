import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const skipDirs = new Set(['node_modules', '.next', '.git', 'scripts', 'program', '.vercel'])
const files = []

function walk(dir, base = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(e.name)) continue
    if (e.name.startsWith('_')) continue
    if (e.name === '.env.local' || e.name === 'package-lock.json') continue
    const rel = base ? `${base}/${e.name}` : e.name
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      walk(full, rel)
      continue
    }
    if (!/\.(ts|tsx|js|mjs|json|css|md|ico|toml)$/i.test(e.name) && e.name !== 'vercel.json') continue
    files.push({ file: rel.replace(/\\/g, '/'), data: fs.readFileSync(full, 'utf8') })
  }
}

walk(root)
files.push({
  file: '.env.local',
  data: `NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_CLUSTER=devnet
FEE_RECIPIENT=ApuMe4AJTv7B7rLord3pxjGAAhmeuwR9ttaQVkJShUuh
`,
})

const out = path.join(root, '_vercel_deploy.json')
fs.writeFileSync(out, JSON.stringify(files))
const kb = Math.round(Buffer.byteLength(JSON.stringify(files)) / 1024)
console.log(files.length, 'files', kb + 'kb')
console.log('tokens.json included:', files.some((f) => f.file === 'data/tokens.json'))
