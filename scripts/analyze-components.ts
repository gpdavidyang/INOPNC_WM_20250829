#!/usr/bin/env node
/**
 * Script to analyze and identify duplicate components
 */

import * as fs from 'fs'
import * as path from 'path'

interface ComponentInfo {
  path: string
  name: string
  size: number
  imports: string[]
  exports: string[]
  hasDefaultExport: boolean
  isMobileComponent: boolean
  isDeprecated: boolean
  similarComponents: string[]
}

async function analyzeComponent(filePath: string): Promise<ComponentInfo> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const fileName = path.basename(filePath, path.extname(filePath))
  const stats = fs.statSync(filePath)
  
  // Extract imports
  const importMatches = content.match(/import .* from ['"]([^'"]+)['"]/g) || []
  const imports = importMatches.map(imp => {
    const match = imp.match(/from ['"]([^'"]+)['"]/)
    return match ? match[1] : ''
  }).filter(Boolean)
  
  // Extract exports
  const exportMatches = content.match(/export\s+(const|function|class|interface|type|enum)\s+(\w+)/g) || []
  const exports = exportMatches.map(exp => {
    const match = exp.match(/export\s+(?:const|function|class|interface|type|enum)\s+(\w+)/)
    return match ? match[1] : ''
  }).filter(Boolean)
  
  // Check for default export
  const hasDefaultExport = /export\s+default/.test(content)
  
  // Check if it's a mobile component
  const isMobileComponent = 
    filePath.includes('mobile') || 
    filePath.includes('Mobile') ||
    content.includes('TouchableOpacity') ||
    content.includes('mobile-only') ||
    content.includes('@media (max-width')
  
  // Check if deprecated
  const isDeprecated = 
    content.includes('@deprecated') ||
    content.includes('DEPRECATED') ||
    filePath.includes('deprecated') ||
    filePath.includes('old') ||
    filePath.includes('legacy')
  
  return {
    path: filePath,
    name: fileName,
    size: stats.size,
    imports,
    exports,
    hasDefaultExport,
    isMobileComponent,
    isDeprecated,
    similarComponents: [] // Will be filled later
  }
}

function findSimilarComponents(components: ComponentInfo[]): void {
  // Group by similar names
  const nameGroups = new Map<string, ComponentInfo[]>()
  
  for (const comp of components) {
    // Normalize name for comparison
    const baseName = comp.name
      .replace(/Mobile|Desktop|New|Old|V2|Legacy|Deprecated/gi, '')
      .replace(/[-_]/g, '')
      .toLowerCase()
    
    if (!nameGroups.has(baseName)) {
      nameGroups.set(baseName, [])
    }
    nameGroups.get(baseName)!.push(comp)
  }
  
  // Mark similar components
  for (const [baseName, group] of nameGroups.entries()) {
    if (group.length > 1) {
      for (const comp of group) {
        comp.similarComponents = group
          .filter(c => c !== comp)
          .map(c => c.path)
      }
    }
  }
}

async function analyzeDuplicatePatterns(components: ComponentInfo[]) {
  const patterns = {
    mobileDesktopPairs: [] as Array<{ mobile: string; desktop: string }>,
    versionedComponents: [] as Array<{ original: string; versions: string[] }>,
    deprecatedActive: [] as Array<{ deprecated: string; active: string }>,
    identicalExports: [] as Array<{ components: string[]; exports: string[] }>
  }
  
  // Find mobile/desktop pairs
  for (const comp of components) {
    if (comp.name.includes('Mobile')) {
      const desktopName = comp.name.replace('Mobile', '')
      const desktopComp = components.find(c => c.name === desktopName)
      if (desktopComp) {
        patterns.mobileDesktopPairs.push({
          mobile: comp.path,
          desktop: desktopComp.path
        })
      }
    }
  }
  
  // Find versioned components (V2, V3, New, etc.)
  const versionPattern = /(V\d+|New|Old|Legacy)$/i
  for (const comp of components) {
    if (versionPattern.test(comp.name)) {
      const baseName = comp.name.replace(versionPattern, '')
      const original = components.find(c => c.name === baseName)
      if (original) {
        const existing = patterns.versionedComponents.find(v => v.original === original.path)
        if (existing) {
          existing.versions.push(comp.path)
        } else {
          patterns.versionedComponents.push({
            original: original.path,
            versions: [comp.path]
          })
        }
      }
    }
  }
  
  // Find deprecated/active pairs
  for (const comp of components) {
    if (comp.isDeprecated) {
      const activeName = comp.name
        .replace(/deprecated|old|legacy/gi, '')
        .replace(/[-_]/g, '')
      
      const activeComp = components.find(c => 
        !c.isDeprecated && 
        c.name.toLowerCase().replace(/[-_]/g, '') === activeName.toLowerCase()
      )
      
      if (activeComp) {
        patterns.deprecatedActive.push({
          deprecated: comp.path,
          active: activeComp.path
        })
      }
    }
  }
  
  // Find components with identical exports
  const exportSignatures = new Map<string, ComponentInfo[]>()
  for (const comp of components) {
    if (comp.exports.length > 0) {
      const signature = comp.exports.sort().join(',')
      if (!exportSignatures.has(signature)) {
        exportSignatures.set(signature, [])
      }
      exportSignatures.get(signature)!.push(comp)
    }
  }
  
  for (const [signature, comps] of exportSignatures.entries()) {
    if (comps.length > 1) {
      patterns.identicalExports.push({
        components: comps.map(c => c.path),
        exports: signature.split(',')
      })
    }
  }
  
  return patterns
}

async function main() {
  console.log('🔍 Analyzing component structure...\n')
  
  // Find all component files
  const componentFiles = await glob('components/**/*.{tsx,jsx}', {
    ignore: [
      'node_modules/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/examples/**'
    ]
  })
  
  // Also check app directory for page components
  const appFiles = await glob('app/**/components/**/*.{tsx,jsx}', {
    ignore: [
      'node_modules/**',
      '**/*.test.*',
      '**/*.spec.*'
    ]
  })
  
  const allFiles = [...componentFiles, ...appFiles]
  console.log(`📦 Found ${allFiles.length} component files\n`)
  
  // Analyze each component
  const components: ComponentInfo[] = []
  for (const file of allFiles) {
    const info = await analyzeComponent(file)
    components.push(info)
  }
  
  // Find similar components
  findSimilarComponents(components)
  
  // Analyze patterns
  const patterns = await analyzeDuplicatePatterns(components)
  
  // Generate report
  console.log('=' + '='.repeat(70))
  console.log('📊 COMPONENT ANALYSIS REPORT')
  console.log('=' + '='.repeat(70))
  
  console.log('\n📱 MOBILE COMPONENTS:')
  const mobileComponents = components.filter(c => c.isMobileComponent)
  console.log(`  Total: ${mobileComponents.length}`)
  mobileComponents.slice(0, 10).forEach(c => {
    console.log(`  - ${c.name} (${c.path})`)
  })
  
  console.log('\n⚠️  DEPRECATED COMPONENTS:')
  const deprecatedComponents = components.filter(c => c.isDeprecated)
  console.log(`  Total: ${deprecatedComponents.length}`)
  deprecatedComponents.forEach(c => {
    console.log(`  - ${c.name} (${c.path})`)
  })
  
  console.log('\n🔄 DUPLICATE PATTERNS:')
  
  console.log('\n  Mobile/Desktop Pairs:')
  patterns.mobileDesktopPairs.slice(0, 10).forEach(pair => {
    console.log(`    📱 ${path.basename(pair.mobile)}`)
    console.log(`    🖥️  ${path.basename(pair.desktop)}`)
    console.log('')
  })
  
  console.log('  Versioned Components:')
  patterns.versionedComponents.slice(0, 10).forEach(item => {
    console.log(`    Original: ${path.basename(item.original)}`)
    item.versions.forEach(v => {
      console.log(`    Version:  ${path.basename(v)}`)
    })
    console.log('')
  })
  
  console.log('  Components with Similar Names:')
  const grouped = components.filter(c => c.similarComponents.length > 0)
  const uniqueGroups = new Set<string>()
  grouped.forEach(comp => {
    const groupKey = [comp.path, ...comp.similarComponents].sort().join('|')
    if (!uniqueGroups.has(groupKey)) {
      uniqueGroups.add(groupKey)
      console.log(`    Group: ${comp.name}`)
      console.log(`      - ${comp.path}`)
      comp.similarComponents.forEach(similar => {
        console.log(`      - ${similar}`)
      })
      console.log('')
    }
  })
  
  // Size analysis
  const totalSize = components.reduce((sum, c) => sum + c.size, 0)
  const avgSize = Math.round(totalSize / components.length)
  const largeComponents = components.filter(c => c.size > avgSize * 2).sort((a, b) => b.size - a.size)
  
  console.log('\n📏 SIZE ANALYSIS:')
  console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  Average component size: ${(avgSize / 1024).toFixed(2)} KB`)
  console.log(`  Large components (>${(avgSize * 2 / 1024).toFixed(0)} KB):`)
  largeComponents.slice(0, 10).forEach(c => {
    console.log(`    - ${c.name}: ${(c.size / 1024).toFixed(2)} KB`)
  })
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:')
  console.log(`  1. Remove ${deprecatedComponents.length} deprecated components`)
  console.log(`  2. Consolidate ${patterns.mobileDesktopPairs.length} mobile/desktop pairs`)
  console.log(`  3. Clean up ${patterns.versionedComponents.length} versioned components`)
  console.log(`  4. Review ${largeComponents.length} large components for splitting`)
  
  // Calculate potential savings
  const duplicateSizeEstimate = 
    patterns.mobileDesktopPairs.length * avgSize * 0.5 + // Assume 50% code duplication
    patterns.versionedComponents.reduce((sum, v) => sum + v.versions.length * avgSize * 0.7, 0) + // 70% duplication
    deprecatedComponents.reduce((sum, c) => sum + c.size, 0)
  
  console.log('\n💰 POTENTIAL SAVINGS:')
  console.log(`  Estimated duplicate code: ${(duplicateSizeEstimate / 1024 / 1024).toFixed(2)} MB`)
  console.log(`  Component count reduction: ~${deprecatedComponents.length + patterns.versionedComponents.length + Math.floor(patterns.mobileDesktopPairs.length / 2)} components`)
  
  // Write detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalComponents: components.length,
      mobileComponents: mobileComponents.length,
      deprecatedComponents: deprecatedComponents.length,
      duplicatePairs: patterns.mobileDesktopPairs.length,
      versionedComponents: patterns.versionedComponents.length,
      totalSize: totalSize,
      averageSize: avgSize,
      estimatedDuplicateSize: duplicateSizeEstimate
    },
    patterns,
    components: components.map(c => ({
      ...c,
      imports: c.imports.length,
      exports: c.exports.length
    }))
  }
  
  fs.writeFileSync('component-analysis-report.json', JSON.stringify(report, null, 2))
  console.log('\n📄 Detailed report saved to: component-analysis-report.json')
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})