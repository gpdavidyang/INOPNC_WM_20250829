#!/usr/bin/env node
/**
 * Script to remove legacy code and unused files
 */

import * as fs from 'fs'
import * as path from 'path'

interface LegacyPattern {
  type: 'file' | 'directory' | 'pattern'
  path?: string
  pattern?: RegExp
  description: string
}

const legacyPatterns: LegacyPattern[] = [
  // Old backup files
  {
    type: 'pattern',
    pattern: /\.(backup|old|deprecated|orig)$/,
    description: 'Backup and old files'
  },
  // Deprecated folders
  {
    type: 'directory',
    path: 'components/deprecated',
    description: 'Deprecated components folder'
  },
  {
    type: 'directory',
    path: 'components/old',
    description: 'Old components folder'
  },
  {
    type: 'directory',
    path: 'app/old',
    description: 'Old app folder'
  },
  // Test files that shouldn't be in production
  {
    type: 'pattern',
    pattern: /\.test\.(ts|tsx|js|jsx)$/,
    description: 'Test files in src'
  },
  {
    type: 'pattern',
    pattern: /\.spec\.(ts|tsx|js|jsx)$/,
    description: 'Spec files in src'
  },
  // Storybook files
  {
    type: 'pattern',
    pattern: /\.stories\.(ts|tsx|js|jsx)$/,
    description: 'Storybook files'
  },
  // Temporary files
  {
    type: 'pattern',
    pattern: /\.(tmp|temp)$/,
    description: 'Temporary files'
  },
  // Mac system files
  {
    type: 'pattern',
    pattern: /\.DS_Store$/,
    description: 'Mac DS_Store files'
  },
  // Editor files
  {
    type: 'pattern',
    pattern: /\.(swp|swo|swn)$/,
    description: 'Vim swap files'
  }
]

async function removeLegacyFiles(): Promise<number> {
  let removedCount = 0
  
  // Find and remove files matching patterns
  for (const legacy of legacyPatterns) {
    if (legacy.type === 'pattern' && legacy.pattern) {
      const files = await glob('**/*', {
        ignore: ['node_modules/**', '.git/**', '.next/**', 'backup/**'],
        dot: true
      })
      
      for (const file of files) {
        if (legacy.pattern.test(file)) {
          try {
            fs.unlinkSync(file)
            console.log(`  ✅ Removed: ${file}`)
            removedCount++
          } catch (error) {
            // File might not exist or no permission
          }
        }
      }
    } else if (legacy.type === 'directory' && legacy.path) {
      if (fs.existsSync(legacy.path)) {
        try {
          fs.rmSync(legacy.path, { recursive: true, force: true })
          console.log(`  ✅ Removed directory: ${legacy.path}`)
          removedCount++
        } catch (error) {
          console.error(`  ❌ Failed to remove: ${legacy.path}`)
        }
      }
    }
  }
  
  return removedCount
}

async function removeUnusedImports(): Promise<number> {
  let cleanedCount = 0
  
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
  })
  
  for (const file of files) {
    try {
      let content = fs.readFileSync(file, 'utf-8')
      const originalContent = content
      
      // Remove unused imports (basic detection)
      const importRegex = /import\s+(?:{[^}]*}|[\w\s,*]+)\s+from\s+['"][^'"]+['"]/g
      const imports = content.match(importRegex) || []
      
      for (const importStatement of imports) {
        // Extract imported items
        const match = importStatement.match(/import\s+{([^}]+)}|import\s+([\w]+)/)
        if (match) {
          const importedItems = match[1] ? 
            match[1].split(',').map(item => item.trim().split(' as ')[0].trim()) :
            [match[2]]
          
          // Check if imported items are used in the file
          let isUsed = false
          for (const item of importedItems) {
            // Skip type imports
            if (item.startsWith('type ')) continue
            
            // Create regex to find usage (not in import statements)
            const usageRegex = new RegExp(`\\b${item}\\b(?![^'"]*['"]|[^{]*})`, 'g')
            const contentWithoutImports = content.replace(importRegex, '')
            
            if (usageRegex.test(contentWithoutImports)) {
              isUsed = true
              break
            }
          }
          
          if (!isUsed) {
            // Remove the import
            content = content.replace(importStatement + '\n', '')
            content = content.replace(importStatement, '')
          }
        }
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content)
        cleanedCount++
      }
    } catch (error) {
      // Skip files with errors
    }
  }
  
  return cleanedCount
}

async function removeEmptyDirectories(dir: string = '.'): Promise<number> {
  let removedCount = 0
  
  const checkAndRemove = (dirPath: string): boolean => {
    try {
      const files = fs.readdirSync(dirPath)
      
      if (files.length === 0) {
        fs.rmdirSync(dirPath)
        console.log(`  ✅ Removed empty directory: ${dirPath}`)
        removedCount++
        return true
      }
      
      // Check subdirectories
      let allEmpty = true
      for (const file of files) {
        const fullPath = path.join(dirPath, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          if (!checkAndRemove(fullPath)) {
            allEmpty = false
          }
        } else {
          allEmpty = false
        }
      }
      
      // Re-check if directory is now empty
      if (allEmpty && fs.readdirSync(dirPath).length === 0) {
        fs.rmdirSync(dirPath)
        console.log(`  ✅ Removed empty directory: ${dirPath}`)
        removedCount++
        return true
      }
      
      return false
    } catch (error) {
      return false
    }
  }
  
  // Start from components and app directories
  const startDirs = ['components', 'app', 'lib', 'hooks']
  for (const startDir of startDirs) {
    if (fs.existsSync(startDir)) {
      checkAndRemove(startDir)
    }
  }
  
  return removedCount
}

async function analyzeDuplicateCode(): Promise<void> {
  console.log('\n📊 Analyzing duplicate code patterns...')
  
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**', 'scripts/**']
  })
  
  const codePatterns = new Map<string, string[]>()
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    
    // Extract function signatures
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g
    let match
    
    while ((match = functionRegex.exec(content)) !== null) {
      const funcName = match[1]
      if (!codePatterns.has(funcName)) {
        codePatterns.set(funcName, [])
      }
      codePatterns.get(funcName)!.push(file)
    }
  }
  
  // Report duplicate functions
  const duplicates = Array.from(codePatterns.entries())
    .filter(([_, files]) => files.length > 1)
    .sort((a, b) => b[1].length - a[1].length)
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  Duplicate function names found:')
    duplicates.slice(0, 10).forEach(([funcName, files]) => {
      console.log(`  ${funcName}: ${files.length} files`)
      files.slice(0, 3).forEach(file => {
        console.log(`    - ${file}`)
      })
    })
  }
}

async function main() {
  console.log('🧹 Starting legacy code removal...\n')
  
  console.log('📁 Removing legacy files...')
  const filesRemoved = await removeLegacyFiles()
  
  console.log('\n📦 Cleaning unused imports...')
  const filesCleaned = await removeUnusedImports()
  
  console.log('\n🗂️  Removing empty directories...')
  const dirsRemoved = await removeEmptyDirectories()
  
  // Analyze remaining code
  await analyzeDuplicateCode()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🎯 LEGACY CODE REMOVAL SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Files removed: ${filesRemoved}`)
  console.log(`  Files cleaned: ${filesCleaned}`)
  console.log(`  Empty directories removed: ${dirsRemoved}`)
  
  // Calculate space saved
  const backupDir = 'backup/components'
  if (fs.existsSync(backupDir)) {
    const getDirectorySize = (dirPath: string): number => {
      let size = 0
      const files = fs.readdirSync(dirPath)
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          size += getDirectorySize(fullPath)
        } else {
          size += stat.size
        }
      }
      
      return size
    }
    
    const backupSize = getDirectorySize(backupDir)
    console.log(`\n💾 Space saved: ${(backupSize / 1024 / 1024).toFixed(2)} MB`)
  }
  
  console.log('\n✅ Legacy code removal complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Run: npm run build')
  console.log('  2. Run: npm test')
  console.log('  3. Review and commit changes')
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})