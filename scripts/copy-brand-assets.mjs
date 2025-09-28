import { promises as fs } from 'fs'
import path from 'path'

const root = process.cwd()
const sources = [
  {
    src: path.join(root, 'dy_memo', 'DY_INOPNC', 'INOPNC_제공문서', 'INOPNC_Logo-가로조합-n.png'),
    dest: path.join(root, 'public', 'images', 'inopnc-logo-n.png'),
  },
  {
    src: path.join(root, 'dy_memo', 'DY_INOPNC', 'INOPNC_제공문서', 'INOPNC_Logo-가로조합-w.png'),
    dest: path.join(root, 'public', 'images', 'inopnc-logo-w.png'),
  },
  {
    src: path.join(root, 'dy_memo', 'DY_INOPNC', 'INOPNC_제공문서', 'INOPNC_Logo-가로조합_g.png'),
    dest: path.join(root, 'public', 'images', 'inopnc-logo-g.png'),
  },
]

async function ensureDir(p) {
  try { await fs.mkdir(p, { recursive: true }) } catch {}
}

async function copyIfExists(src, dest) {
  try {
    await fs.stat(src)
  } catch {
    console.warn(`[copy-brand-assets] Source not found: ${src}`)
    return
  }
  await ensureDir(path.dirname(dest))
  await fs.copyFile(src, dest)
  console.log(`[copy-brand-assets] Copied to ${path.relative(root, dest)}`)
}

async function main() {
  await Promise.all(sources.map(({ src, dest }) => copyIfExists(src, dest)))
}

main().catch(err => {
  console.warn('[copy-brand-assets] Failed:', err?.message || err)
  process.exit(0) // Do not fail the build if assets are missing
})

