#!/usr/bin/env node
/**
 * Script to automatically fix common 'any' type patterns
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface FixPattern {
  name: string
  pattern: RegExp
  replacement: string | ((match: string, ...args: string[]) => string)
  description: string
}

const fixPatterns: FixPattern[] = [
  {
    name: 'any-array-to-unknown',
    pattern: /:\s*any\[\]/g,
    replacement: ': unknown[]',
    description: 'Replace any[] with unknown[]'
  },
  {
    name: 'array-any-to-unknown',
    pattern: /:\s*Array<any>/g,
    replacement: ': Array<unknown>',
    description: 'Replace Array<any> with Array<unknown>'
  },
  {
    name: 'record-string-any',
    pattern: /:\s*Record<string,\s*any>/g,
    replacement: ': Record<string, unknown>',
    description: 'Replace Record<string, any> with Record<string, unknown>'
  },
  {
    name: 'record-any-any',
    pattern: /:\s*Record<any,\s*any>/g,
    replacement: ': Record<string, unknown>',
    description: 'Replace Record<any, any> with Record<string, unknown>'
  },
  {
    name: 'object-index-any',
    pattern: /:\s*{\s*\[key:\s*string\]:\s*any\s*}/g,
    replacement: ': Record<string, unknown>',
    description: 'Replace { [key: string]: any } with Record<string, unknown>'
  },
  {
    name: 'promise-any',
    pattern: /:\s*Promise<any>/g,
    replacement: ': Promise<unknown>',
    description: 'Replace Promise<any> with Promise<unknown>'
  },
  {
    name: 'event-any',
    pattern: /\(e:\s*any\)/g,
    replacement: (match) => {
      // Try to determine event type from context
      return '(e: Event)'
    },
    description: 'Replace (e: any) with proper event type'
  },
  {
    name: 'error-any',
    pattern: /\(error:\s*any\)/g,
    replacement: '(error: unknown)',
    description: 'Replace (error: any) with (error: unknown)'
  },
  {
    name: 'catch-error-any',
    pattern: /catch\s*\(\s*(\w+):\s*any\s*\)/g,
    replacement: 'catch ($1)',
    description: 'Remove : any from catch blocks (TypeScript 4.0+)'
  },
  {
    name: 'function-return-any',
    pattern: /\):\s*any\s*{/g,
    replacement: '): unknown {',
    description: 'Replace function return type any with unknown'
  }
]

interface FixResult {
  file: string
  fixes: Array<{
    pattern: string
    count: number
  }>
  totalFixes: number
}

async function fixAnyTypesInFile(filePath: string): Promise<FixResult | null> {
  // Skip protected files
  const protectedFiles = [
    'lib/supabase/client.ts',
    'lib/supabase/server.ts',
    'middleware.ts',
    'app/auth/actions.ts'
  ]
  
  if (protectedFiles.some(file => filePath.includes(file))) {
    return null
  }

  const content = fs.readFileSync(filePath, 'utf-8')
  let modifiedContent = content
  const fixes: Array<{ pattern: string; count: number }> = []
  let totalFixes = 0

  // Skip if file has @ts-nocheck
  if (content.includes('@ts-nocheck')) {
    return null
  }

  for (const pattern of fixPatterns) {
    const matches = modifiedContent.match(pattern.pattern)
    if (matches && matches.length > 0) {
      const count = matches.length
      
      if (typeof pattern.replacement === 'string') {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement)
      } else {
        modifiedContent = modifiedContent.replace(pattern.pattern, pattern.replacement)
      }
      
      fixes.push({ pattern: pattern.name, count })
      totalFixes += count
    }
  }

  if (totalFixes > 0) {
    // Add import for unknown type utilities if needed
    if (!modifiedContent.includes("from '@/types") && totalFixes > 10) {
      const importStatement = "import type { AsyncState, ApiResponse } from '@/types/utils'\n"
      const firstImportIndex = modifiedContent.search(/^import/m)
      if (firstImportIndex >= 0) {
        modifiedContent = 
          modifiedContent.slice(0, firstImportIndex) + 
          importStatement + 
          modifiedContent.slice(firstImportIndex)
      }
    }

    fs.writeFileSync(filePath, modifiedContent)
    return { file: filePath, fixes, totalFixes }
  }

  return null
}

async function fixAnyTypes(targetDir?: string): Promise<void> {
  const pattern = targetDir ? `${targetDir}/**/*.{ts,tsx}` : '**/*.{ts,tsx}'
  
  const files = await glob(pattern, {
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.test.ts',
      '*.spec.ts',
      'scripts/**',
      'types/**' // Don't modify type definitions
    ],
    absolute: false
  })

  console.log(`\n🔧 Processing ${files.length} files...`)

  const results: FixResult[] = []
  let totalFilesFixed = 0
  let totalFixesApplied = 0

  for (const file of files) {
    const result = await fixAnyTypesInFile(file)
    if (result) {
      results.push(result)
      totalFilesFixed++
      totalFixesApplied += result.totalFixes
    }
  }

  // Generate report
  console.log('\n' + '='.repeat(60))
  console.log('✨ ANY TYPE FIX REPORT')
  console.log('='.repeat(60))

  console.log('\n📊 SUMMARY:')
  console.log(`  Files processed: ${files.length}`)
  console.log(`  Files fixed: ${totalFilesFixed}`)
  console.log(`  Total fixes applied: ${totalFixesApplied}`)

  if (results.length > 0) {
    console.log('\n📝 TOP FIXED FILES:')
    const topFixed = results
      .sort((a, b) => b.totalFixes - a.totalFixes)
      .slice(0, 10)
    
    topFixed.forEach(({ file, totalFixes }, index) => {
      console.log(`  ${index + 1}. ${file}: ${totalFixes} fixes`)
    })

    console.log('\n🔧 FIX PATTERNS APPLIED:')
    const patternCounts = new Map<string, number>()
    results.forEach(result => {
      result.fixes.forEach(fix => {
        patternCounts.set(fix.pattern, (patternCounts.get(fix.pattern) || 0) + fix.count)
      })
    })

    Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([pattern, count]) => {
        const patternInfo = fixPatterns.find(p => p.name === pattern)
        console.log(`  ${pattern}: ${count} (${patternInfo?.description})`)
      })
  }

  // Write detailed report
  const reportPath = 'any-types-fix-report.json'
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      filesProcessed: files.length,
      filesFixed: totalFilesFixed,
      totalFixes: totalFixesApplied
    },
    results
  }, null, 2))

  console.log(`\n✅ Fix report saved to: ${reportPath}`)
  console.log('\n⚠️  Please review changes and run tests before committing!')
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const targetDir = args[0]

  try {
    console.log('🚀 Starting automatic any type fixes...')
    if (targetDir) {
      console.log(`   Targeting directory: ${targetDir}`)
    }
    
    await fixAnyTypes(targetDir)
    
    console.log('\n✨ Fixes complete! Next steps:')
    console.log('  1. Run: npm run build')
    console.log('  2. Fix any TypeScript errors')
    console.log('  3. Run: npm test')
    console.log('  4. Review and commit changes')
    
  } catch (error) {
    console.error('❌ Error during fixing:', error)
    process.exit(1)
  }
}

main()