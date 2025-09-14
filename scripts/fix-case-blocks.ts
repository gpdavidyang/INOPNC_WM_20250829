#!/usr/bin/env node
/**
 * Script to fix case blocks with missing braces
 */

import * as fs from 'fs'
import * as path from 'path'

function fixCaseBlocks(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8')
  
  // Fix case blocks - add braces and closing braces
  content = content.replace(/case\s+['"]([^'"]+)['"]\s*:\s*{?\s*\n/g, (match, caseName) => {
    if (match.includes('{')) {
      return match // Already has opening brace
    }
    return `case '${caseName}': {\n`
  })
  
  // Find and fix missing closing braces
  const lines = content.split('\n')
  const fixedLines: string[] = []
  let inCase = false
  let braceDepth = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (trimmed.startsWith('case ') && trimmed.includes(': {')) {
      inCase = true
      braceDepth = 1
      fixedLines.push(line)
    } else if (inCase) {
      // Count braces
      for (const char of line) {
        if (char === '{') braceDepth++
        if (char === '}') braceDepth--
      }
      
      fixedLines.push(line)
      
      // Check if we need to add closing brace before next case or default
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if ((nextLine.startsWith('case ') || nextLine.startsWith('default:')) && braceDepth > 0) {
          // Add missing closing brace
          const indent = line.match(/^\s*/)?.[0] || ''
          fixedLines.push(indent + '}')
          braceDepth = 0
          inCase = false
        }
      }
    } else {
      fixedLines.push(line)
    }
  }
  
  fs.writeFileSync(filePath, fixedLines.join('\n'))
  console.log(`Fixed case blocks in ${filePath}`)
}

// Fix all files with case blocks
const filesToFix = [
  'app/api/backup/route.ts',
  'app/api/unified-documents/bulk/route.ts',
  'app/api/unified-documents/v2/route.ts',
  'app/api/photo-grid-reports/bulk/route.ts',
  'app/api/admin/salary/route.ts',
  'app/api/admin/sites/[id]/workers/route.ts',
  'app/api/admin/daily-reports/export/route.ts',
  'app/api/partner/sites/route.ts',
  'app/api/partner/labor/by-site/route.ts',
  'app/api/partner/labor/summary/route.ts',
  'app/api/monitoring/metrics/route.ts',
  'lib/test-utils/mocks/analytics.mock.ts'
]

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    fixCaseBlocks(file)
  }
})