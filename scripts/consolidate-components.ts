#!/usr/bin/env node
/**
 * Script to consolidate duplicate components
 */

import * as fs from 'fs'
import * as path from 'path'

interface ConsolidationPlan {
  group: string
  keep: string
  remove: string[]
  updateImports: Array<{ from: string; to: string }>
}

const consolidationPlans: ConsolidationPlan[] = [
  // Daily Reports
  {
    group: 'daily-report-list',
    keep: 'components/daily-reports/daily-report-list-new.tsx',
    remove: [
      'components/daily-reports/daily-report-list.tsx',
      'components/daily-reports/DailyReportListMobile.tsx'
    ],
    updateImports: [
      { 
        from: '@/components/daily-reports/daily-report-list',
        to: '@/components/daily-reports/daily-report-list-new'
      },
      {
        from: '@/components/daily-reports/DailyReportListMobile',
        to: '@/components/daily-reports/daily-report-list-new'
      }
    ]
  },
  {
    group: 'daily-report-detail',
    keep: 'components/daily-reports/daily-report-detail-new.tsx',
    remove: [
      'components/daily-reports/daily-report-detail.tsx',
      'components/daily-reports/DailyReportDetailMobile.tsx',
      'components/daily-reports/DailyReportDetailMobile-new.tsx'
    ],
    updateImports: [
      {
        from: '@/components/daily-reports/daily-report-detail',
        to: '@/components/daily-reports/daily-report-detail-new'
      },
      {
        from: '@/components/daily-reports/DailyReportDetailMobile',
        to: '@/components/daily-reports/daily-report-detail-new'
      },
      {
        from: '@/components/daily-reports/DailyReportDetailMobile-new',
        to: '@/components/daily-reports/daily-report-detail-new'
      }
    ]
  },
  // Dashboard tabs
  {
    group: 'home-tab',
    keep: 'components/dashboard/tabs/home-tab-new.tsx',
    remove: ['components/dashboard/tabs/home-tab.tsx'],
    updateImports: [
      {
        from: '@/components/dashboard/tabs/home-tab',
        to: '@/components/dashboard/tabs/home-tab-new'
      }
    ]
  },
  {
    group: 'site-info-tab',
    keep: 'components/dashboard/tabs/site-info-tab-new.tsx',
    remove: ['components/dashboard/tabs/site-info-tab.tsx'],
    updateImports: [
      {
        from: '@/components/dashboard/tabs/site-info-tab',
        to: '@/components/dashboard/tabs/site-info-tab-new'
      }
    ]
  },
  {
    group: 'documents-tab',
    keep: 'components/dashboard/tabs/documents-tab-new.tsx',
    remove: ['components/dashboard/tabs/documents-tab.tsx'],
    updateImports: [
      {
        from: '@/components/dashboard/tabs/documents-tab',
        to: '@/components/dashboard/tabs/documents-tab-new'
      }
    ]
  },
  // UI Components
  {
    group: 'button',
    keep: 'components/ui/button.tsx',
    remove: ['components/ui/button-new.tsx'],
    updateImports: [
      {
        from: '@/components/ui/button-new',
        to: '@/components/ui/button'
      }
    ]
  },
  {
    group: 'input',
    keep: 'components/ui/input.tsx',
    remove: ['components/ui/input-new.tsx'],
    updateImports: [
      {
        from: '@/components/ui/input-new',
        to: '@/components/ui/input'
      }
    ]
  },
  // Admin components
  {
    group: 'SiteManagementList',
    keep: 'components/admin/sites/SiteManagementList.tsx',
    remove: ['components/admin/SiteManagementList.tsx'],
    updateImports: [
      {
        from: '@/components/admin/SiteManagementList',
        to: '@/components/admin/sites/SiteManagementList'
      }
    ]
  },
  {
    group: 'NotificationCenter',
    keep: 'components/admin/notifications/NotificationCenter.tsx',
    remove: ['components/admin/NotificationCenter.tsx'],
    updateImports: [
      {
        from: '@/components/admin/NotificationCenter',
        to: '@/components/admin/notifications/NotificationCenter'
      }
    ]
  },
  {
    group: 'AnalyticsDashboard',
    keep: 'components/admin/analytics/AnalyticsDashboard.tsx',
    remove: ['components/admin/AnalyticsDashboard.tsx'],
    updateImports: [
      {
        from: '@/components/admin/AnalyticsDashboard',
        to: '@/components/admin/analytics/AnalyticsDashboard'
      }
    ]
  },
  // Document components
  {
    group: 'DocumentFilters',
    keep: 'components/documents/common/DocumentFilters.tsx',
    remove: [
      'components/documents/UnifiedDocumentViewer/DocumentFilters.tsx',
      'components/admin/documents/shared/DocumentFilters.tsx'
    ],
    updateImports: [
      {
        from: '@/components/documents/UnifiedDocumentViewer/DocumentFilters',
        to: '@/components/documents/common/DocumentFilters'
      },
      {
        from: '@/components/admin/documents/shared/DocumentFilters',
        to: '@/components/documents/common/DocumentFilters'
      }
    ]
  },
  {
    group: 'DocumentCard',
    keep: 'components/documents/common/DocumentCard.tsx',
    remove: ['components/admin/documents/shared/DocumentCard.tsx'],
    updateImports: [
      {
        from: '@/components/admin/documents/shared/DocumentCard',
        to: '@/components/documents/common/DocumentCard'
      }
    ]
  },
  // Environment status
  {
    group: 'environment-status',
    keep: 'components/debug/environment-status.tsx',
    remove: ['components/debug/EnvironmentStatus.tsx'],
    updateImports: [
      {
        from: '@/components/debug/EnvironmentStatus',
        to: '@/components/debug/environment-status'
      }
    ]
  }
]

async function updateImports(filePath: string, importUpdate: { from: string; to: string }) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    
    // Update various import patterns
    const patterns = [
      // Standard imports
      new RegExp(`from ['"]${importUpdate.from}['"]`, 'g'),
      // Dynamic imports
      new RegExp(`import\\(['"]${importUpdate.from}['"]\\)`, 'g'),
      // Require statements
      new RegExp(`require\\(['"]${importUpdate.from}['"]\\)`, 'g')
    ]
    
    let modified = false
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          return match.replace(importUpdate.from, importUpdate.to)
        })
        modified = true
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error)
    return false
  }
}

async function consolidateGroup(plan: ConsolidationPlan) {
  console.log(`\n📦 Consolidating ${plan.group}...`)
  
  // Check if keep file exists
  if (!fs.existsSync(plan.keep)) {
    console.log(`  ⚠️  Keep file not found: ${plan.keep}`)
    return { success: false, error: 'Keep file not found' }
  }
  
  // Check which files to remove actually exist
  const filesToRemove = plan.remove.filter(file => fs.existsSync(file))
  
  if (filesToRemove.length === 0) {
    console.log(`  ℹ️  No files to remove`)
    return { success: true, removed: 0, updated: 0 }
  }
  
  // Find all files that might import the removed components
  const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      'scripts/**'
    ]
  })
  
  // Update imports in all files
  let updatedCount = 0
  for (const file of allFiles) {
    for (const importUpdate of plan.updateImports) {
      if (await updateImports(file, importUpdate)) {
        updatedCount++
      }
    }
  }
  
  // Backup and remove old files
  const backupDir = 'backup/components'
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  for (const file of filesToRemove) {
    const backupPath = path.join(backupDir, path.basename(file) + '.backup')
    fs.copyFileSync(file, backupPath)
    fs.unlinkSync(file)
    console.log(`  ✅ Removed: ${file}`)
  }
  
  console.log(`  📝 Updated ${updatedCount} import statements`)
  
  return {
    success: true,
    removed: filesToRemove.length,
    updated: updatedCount
  }
}

async function renameTempFiles() {
  // Rename -new files to remove the suffix
  const renames = [
    {
      from: 'components/daily-reports/daily-report-list-new.tsx',
      to: 'components/daily-reports/daily-report-list.tsx'
    },
    {
      from: 'components/daily-reports/daily-report-detail-new.tsx',
      to: 'components/daily-reports/daily-report-detail.tsx'
    },
    {
      from: 'components/dashboard/tabs/home-tab-new.tsx',
      to: 'components/dashboard/tabs/home-tab.tsx'
    },
    {
      from: 'components/dashboard/tabs/site-info-tab-new.tsx',
      to: 'components/dashboard/tabs/site-info-tab.tsx'
    },
    {
      from: 'components/dashboard/tabs/documents-tab-new.tsx',
      to: 'components/dashboard/tabs/documents-tab.tsx'
    }
  ]
  
  console.log('\n🔄 Renaming temporary files...')
  
  for (const rename of renames) {
    if (fs.existsSync(rename.from) && !fs.existsSync(rename.to)) {
      fs.renameSync(rename.from, rename.to)
      console.log(`  ✅ Renamed: ${path.basename(rename.from)} → ${path.basename(rename.to)}`)
      
      // Update imports
      const allFiles = await glob('**/*.{ts,tsx,js,jsx}', {
        ignore: [
          'node_modules/**',
          '.next/**',
          'dist/**',
          'build/**',
          'scripts/**'
        ]
      })
      
      for (const file of allFiles) {
        await updateImports(file, {
          from: rename.from.replace('.tsx', '').replace('components/', '@/components/'),
          to: rename.to.replace('.tsx', '').replace('components/', '@/components/')
        })
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting component consolidation...\n')
  
  const results = {
    successful: 0,
    failed: 0,
    totalRemoved: 0,
    totalUpdated: 0
  }
  
  // Process each consolidation plan
  for (const plan of consolidationPlans) {
    const result = await consolidateGroup(plan)
    
    if (result.success) {
      results.successful++
      results.totalRemoved += result.removed || 0
      results.totalUpdated += result.updated || 0
    } else {
      results.failed++
    }
  }
  
  // Rename -new files
  await renameTempFiles()
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 CONSOLIDATION SUMMARY')
  console.log('='.repeat(60))
  console.log(`  Groups processed: ${results.successful + results.failed}`)
  console.log(`  Successful: ${results.successful}`)
  console.log(`  Failed: ${results.failed}`)
  console.log(`  Files removed: ${results.totalRemoved}`)
  console.log(`  Imports updated: ${results.totalUpdated}`)
  
  // Clean up empty directories
  const emptyDirs = [
    'components/daily-reports/old',
    'components/dashboard/old',
    'components/ui/old'
  ]
  
  for (const dir of emptyDirs) {
    if (fs.existsSync(dir)) {
      try {
        fs.rmdirSync(dir)
        console.log(`  🗑️  Removed empty directory: ${dir}`)
      } catch (e) {
        // Directory not empty, ignore
      }
    }
  }
  
  console.log('\n✅ Component consolidation complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Run: npm run build')
  console.log('  2. Test affected components')
  console.log('  3. Commit changes')
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})