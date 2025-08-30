const fs = require('fs');
const path = require('path');

// Copy public folder contents to .next/static for Vercel deployment
function copyPublicToStatic() {
  const publicDir = path.join(process.cwd(), 'public');
  const staticDir = path.join(process.cwd(), '.next/static');
  
  if (!fs.existsSync(publicDir)) {
    console.log('Public directory does not exist');
    return;
  }
  
  // Create .next/static if it doesn't exist
  if (!fs.existsSync(staticDir)) {
    fs.mkdirSync(staticDir, { recursive: true });
  }
  
  // Copy files recursively
  function copyRecursive(src, dest) {
    const srcStats = fs.statSync(src);
    
    if (srcStats.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest);
      }
      fs.readdirSync(src).forEach(item => {
        copyRecursive(path.join(src, item), path.join(dest, item));
      });
    } else {
      fs.copyFileSync(src, dest);
      console.log(`Copied: ${src} -> ${dest}`);
    }
  }
  
  // Copy specific files that are failing
  const criticalFiles = [
    'manifest.json',
    'sw.js',
    'robots.txt',
    'INOPNC_logo.png'
  ];
  
  const iconsDir = path.join(publicDir, 'icons');
  if (fs.existsSync(iconsDir)) {
    const iconsDest = path.join(staticDir, 'icons');
    copyRecursive(iconsDir, iconsDest);
  }
  
  // Copy critical files
  criticalFiles.forEach(file => {
    const src = path.join(publicDir, file);
    const dest = path.join(staticDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied critical file: ${file}`);
    }
  });
  
  console.log('Public files copied to .next/static');
}

copyPublicToStatic();