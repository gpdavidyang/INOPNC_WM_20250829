import { promises as fs } from 'fs'
import path from 'path'

const root = process.cwd()
const MB = 1024 * 1024
const MAX_CACHE_SIZE_MB = parseInt(process.env.NEXT_CACHE_MAX_MB || '350', 10)
const nextCacheTarget = path.join(root, '.next', 'cache', 'webpack', 'server-production')
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

async function getDirectorySize(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    let total = 0
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        total += await getDirectorySize(fullPath)
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath)
        total += stats.size
      }
    }
    return total
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return 0
    }
    throw error
  }
}

async function cleanNextCacheIfNeeded() {
  try {
    const cacheSize = await getDirectorySize(nextCacheTarget)
    if (cacheSize > MAX_CACHE_SIZE_MB * MB) {
      await fs.rm(nextCacheTarget, { recursive: true, force: true })
      const freed = (cacheSize / MB).toFixed(1)
      console.log(`[copy-brand-assets] Cleared stale Next.js cache (~${freed} MB) to free space`)
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      console.warn('[copy-brand-assets] Cache cleanup skipped:', error?.message || error)
    }
  }
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
  await cleanNextCacheIfNeeded()
  await Promise.all(sources.map(({ src, dest }) => copyIfExists(src, dest)))
}

main().catch(err => {
  console.warn('[copy-brand-assets] Failed:', err?.message || err)
  process.exit(0) // Do not fail the build if assets are missing
})
