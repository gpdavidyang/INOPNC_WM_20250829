/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs')
const path = require('path')

// Copy public folder contents to .next/static AND root for Vercel deployment
function copyPublicToStatic() {
  const publicDir = path.join(process.cwd(), 'public')
  const staticDir = path.join(process.cwd(), '.next/static')
  const rootDir = path.join(process.cwd(), '.next/server/app')

  if (!fs.existsSync(publicDir)) {
    console.log('Public directory does not exist')
    return
  }

  // Create .next/static if it doesn't exist
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true })
  }

  // Create .next/server/app if it doesn't exist
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true })
  }

  // Copy files recursively
  function copyRecursive(src, dest) {
    const srcStats = fs.statSync(src)

    if (srcStats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest)
      }
      fs.readdirSync(src).forEach(item => {
        copyRecursive(path.join(src, item), path.join(dest, item))
      })
    } else {
      fs.copyFileSync(src, dest)
      console.log(`Copied: ${src} -> ${dest}`)
    }
  }

  // Copy specific files that are failing
  const criticalFiles = ['manifest.json', 'sw.js', 'robots.txt', 'INOPNC_logo.png']

  const iconsDir = path.join(publicDir, 'icons')
  if (fs.existsSync(iconsDir)) {
    const iconsDest = path.join(staticDir, 'icons')
    copyRecursive(iconsDir, iconsDest)
  }

  // Copy critical files to both locations
  criticalFiles.forEach(file => {
    const src = path.join(publicDir, file)
    const staticDest = path.join(staticDir, file)
    const rootDest = path.join(process.cwd(), '.next/server/app', file)

    if (fs.existsSync(src)) {
      // Copy to static directory
      fs.copyFileSync(src, staticDest)
      console.log(`Copied critical file to static: ${file}`)

      // Also copy to root level for direct access
      try {
        fs.copyFileSync(src, rootDest)
        console.log(`Copied critical file to root: ${file}`)
      } catch (err) {
        console.log(`Could not copy to root: ${file} (${err.message})`)
      }
    }
  })

  console.log('Public files copied to .next/static and root')
}

copyPublicToStatic()
