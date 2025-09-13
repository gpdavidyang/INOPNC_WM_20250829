#!/usr/bin/env node
/**
 * Script to analyze and report on 'any' type usage in the codebase
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface AnyTypeLocation {
  file: string
  line: number
  column: number
  context: string
  type: 'explicit' | 'implicit' | 'assertion'
}

interface AnalysisResult {
  totalFiles: number
  filesWithAny: number
  totalAnyInstances: number
  byType: {
    explicit: number
    implicit: number
    assertion: number
  }
  byDirectory: Record<string, number>
  topFiles: Array<{ file: string; count: number }>
  locations: AnyTypeLocation[]
}

async function analyzeAnyTypes(): Promise<AnalysisResult> {
  const files = await glob('**/*.{ts,tsx}', {
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.test.ts',
      '*.spec.ts',
      'scripts/**'
    ],
    absolute: false
  })

  const result: AnalysisResult = {
    totalFiles: files.length,
    filesWithAny: 0,
    totalAnyInstances: 0,
    byType: {
      explicit: 0,
      implicit: 0,
      assertion: 0
    },
    byDirectory: {},
    topFiles: [],
    locations: []
  }

  const fileCountMap = new Map<string, number>()

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    let fileAnyCount = 0

    lines.forEach((line, lineIndex) => {
      // Skip comments
      const commentIndex = line.indexOf('//')
      const lineToCheck = commentIndex >= 0 ? line.substring(0, commentIndex) : line

      // Check for explicit any
      const explicitAnyRegex = /:\s*any(?:\s|>|,|\)|;|$)/g
      let match
      while ((match = explicitAnyRegex.exec(lineToCheck)) !== null) {
        result.byType.explicit++
        fileAnyCount++
        result.locations.push({
          file,
          line: lineIndex + 1,
          column: match.index,
          context: line.trim(),
          type: 'explicit'
        })
      }

      // Check for type assertions with any
      const assertionRegex = /as\s+any(?:\s|>|,|\)|;|$)/g
      while ((match = assertionRegex.exec(lineToCheck)) !== null) {
        result.byType.assertion++
        fileAnyCount++
        result.locations.push({
          file,
          line: lineIndex + 1,
          column: match.index,
          context: line.trim(),
          type: 'assertion'
        })
      }

      // Check for Array<any> or any[]
      const arrayAnyRegex = /(?:Array<any>|any\[\])/g
      while ((match = arrayAnyRegex.exec(lineToCheck)) !== null) {
        result.byType.explicit++
        fileAnyCount++
        result.locations.push({
          file,
          line: lineIndex + 1,
          column: match.index,
          context: line.trim(),
          type: 'explicit'
        })
      }
    })

    if (fileAnyCount > 0) {
      result.filesWithAny++
      result.totalAnyInstances += fileAnyCount
      fileCountMap.set(file, fileAnyCount)

      // Update directory stats
      const dir = path.dirname(file).split('/')[0]
      result.byDirectory[dir] = (result.byDirectory[dir] || 0) + fileAnyCount
    }
  }

  // Get top files with most any types
  result.topFiles = Array.from(fileCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([file, count]) => ({ file, count }))

  return result
}

async function generateReport(result: AnalysisResult) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 ANY TYPE ANALYSIS REPORT')
  console.log('='.repeat(60))

  console.log('\n📈 SUMMARY:')
  console.log(`  Total TypeScript files: ${result.totalFiles}`)
  console.log(`  Files with 'any': ${result.filesWithAny} (${((result.filesWithAny / result.totalFiles) * 100).toFixed(1)}%)`)
  console.log(`  Total 'any' instances: ${result.totalAnyInstances}`)

  console.log('\n🏷️ BY TYPE:')
  console.log(`  Explicit (: any): ${result.byType.explicit}`)
  console.log(`  Type assertions (as any): ${result.byType.assertion}`)

  console.log('\n📁 BY DIRECTORY:')
  const sortedDirs = Object.entries(result.byDirectory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  sortedDirs.forEach(([dir, count]) => {
    console.log(`  ${dir}: ${count}`)
  })

  console.log('\n🔝 TOP FILES WITH MOST "ANY" TYPES:')
  result.topFiles.slice(0, 10).forEach(({ file, count }, index) => {
    console.log(`  ${index + 1}. ${file}: ${count} instances`)
  })

  console.log('\n🎯 PRIORITY FIXES (High-impact files):')
  const priorityFiles = result.topFiles
    .filter(f => 
      f.file.includes('components/') || 
      f.file.includes('lib/') || 
      f.file.includes('app/api/')
    )
    .slice(0, 5)

  priorityFiles.forEach(({ file, count }) => {
    console.log(`  - ${file}: ${count} instances`)
  })

  // Write detailed report to file
  const reportPath = 'any-types-report.json'
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2))
  console.log(`\n✅ Detailed report saved to: ${reportPath}`)

  // Generate migration suggestions
  console.log('\n💡 SUGGESTED FIXES:')
  console.log('  1. Replace any[] with specific array types or unknown[]')
  console.log('  2. Replace Record<string, any> with Record<string, unknown>')
  console.log('  3. Use generics for function parameters instead of any')
  console.log('  4. Import and use types from /types directory')
  console.log('  5. Use type guards from /types/utils/guards.ts')

  return result
}

// Main execution
async function main() {
  try {
    console.log('🔍 Analyzing TypeScript files for "any" types...')
    const result = await analyzeAnyTypes()
    await generateReport(result)
    
    // Set exit code based on any count (for CI)
    if (result.totalAnyInstances > 5000) {
      console.log('\n⚠️  High number of any types detected!')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error)
    process.exit(1)
  }
}

main()