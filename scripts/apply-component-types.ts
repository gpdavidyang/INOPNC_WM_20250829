#!/usr/bin/env node
/**
 * Script to apply new type system to components
 */

import * as fs from 'fs'
import * as path from 'path'

interface ComponentTypePattern {
  name: string
  filePattern: RegExp
  importStatement: string
  replacements: Array<{
    from: RegExp
    to: string
  }>
}

const componentPatterns: ComponentTypePattern[] = [
  {
    name: 'button-components',
    filePattern: /Button\.tsx$/,
    importStatement: "import type { ButtonProps } from '@/types/components'",
    replacements: [
      {
        from: /interface\s+\w*ButtonProps\s*{[^}]*}/g,
        to: ''
      },
      {
        from: /export\s+(?:default\s+)?function\s+(\w+Button)\s*\([^)]*\)/g,
        to: 'export default function $1({ children, variant = "primary", size = "md", disabled = false, loading = false, onClick, className, ...props }: ButtonProps)'
      }
    ]
  },
  {
    name: 'form-components',
    filePattern: /Form|Input|Select|Textarea/,
    importStatement: "import type { FormFieldProps, FormProps } from '@/types/components'",
    replacements: [
      {
        from: /:\s*React\.FormEvent<HTMLFormElement>/g,
        to: ': React.FormEvent<HTMLFormElement>'
      },
      {
        from: /:\s*React\.ChangeEvent<HTML(Input|Select|Textarea)Element>/g,
        to: ': React.ChangeEvent<HTML$1Element>'
      }
    ]
  },
  {
    name: 'layout-components',
    filePattern: /Layout|Header|Footer|Sidebar/,
    importStatement: "import type { LayoutProps } from '@/types/components'",
    replacements: [
      {
        from: /children\?:\s*React\.ReactNode/g,
        to: 'children: React.ReactNode'
      }
    ]
  },
  {
    name: 'data-display',
    filePattern: /Table|List|Card|Grid/,
    importStatement: "import type { DataDisplayProps } from '@/types/components'",
    replacements: [
      {
        from: /data:\s*unknown\[\]/g,
        to: 'data: T[]'
      },
      {
        from: /item:\s*unknown/g,
        to: 'item: T'
      }
    ]
  },
  {
    name: 'modal-dialog',
    filePattern: /Modal|Dialog|Drawer/,
    importStatement: "import type { ModalProps } from '@/types/components'",
    replacements: [
      {
        from: /isOpen\?:\s*boolean/g,
        to: 'isOpen: boolean'
      },
      {
        from: /onClose\?:\s*\(\)\s*=>\s*void/g,
        to: 'onClose: () => void'
      }
    ]
  }
]

async function processComponentFile(filePath: string): Promise<boolean> {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false
    let appliedImports = new Set<string>()

    // Skip if already processed
    if (content.includes("from '@/types/components'")) {
      return false
    }

    // Apply patterns
    for (const pattern of componentPatterns) {
      if (pattern.filePattern.test(filePath)) {
        // Apply replacements
        for (const replacement of pattern.replacements) {
          const matches = content.match(replacement.from)
          if (matches) {
            content = content.replace(replacement.from, replacement.to)
            modified = true
            appliedImports.add(pattern.importStatement)
          }
        }
      }
    }

    // Add generic type parameter support for data components
    if (/Table|List|Grid/.test(filePath) && modified) {
      // Add generic type parameter to component
      content = content.replace(
        /export\s+(?:default\s+)?function\s+(\w+)\s*\(/g,
        'export default function $1<T = unknown>('
      )
    }

    // Add imports if modifications were made
    if (modified && appliedImports.size > 0) {
      const importStatements = Array.from(appliedImports).join('\n')
      
      // Find the position to insert imports
      const firstImportIndex = content.search(/^import/m)
      if (firstImportIndex >= 0) {
        // Add after existing imports
        const lastImportMatch = content.match(/(import[^;]+;?\n)+/m)
        if (lastImportMatch) {
          const lastImportEnd = lastImportMatch.index! + lastImportMatch[0].length
          content = 
            content.slice(0, lastImportEnd) +
            importStatements + '\n' +
            content.slice(lastImportEnd)
        }
      } else {
        // Add at the beginning
        content = importStatements + '\n\n' + content
      }

      fs.writeFileSync(filePath, content)
      return true
    }

    return false
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Applying new type system to components...\n')

  // Find all component files
  const componentFiles = await glob('components/**/*.tsx', {
    ignore: [
      'node_modules/**',
      '**/*.test.tsx',
      '**/*.spec.tsx',
      '**/*.stories.tsx'
    ]
  })

  console.log(`📦 Found ${componentFiles.length} component files\n`)

  let processedCount = 0
  const results: string[] = []

  for (const file of componentFiles) {
    const processed = await processComponentFile(file)
    if (processed) {
      processedCount++
      results.push(file)
      console.log(`✅ ${file}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 COMPONENT TYPE APPLICATION REPORT')
  console.log('='.repeat(60))
  console.log(`\n  Total files: ${componentFiles.length}`)
  console.log(`  Files updated: ${processedCount}`)
  console.log(`  Files skipped: ${componentFiles.length - processedCount}`)

  if (results.length > 0) {
    console.log('\n📝 Updated components:')
    results.slice(0, 20).forEach((file, i) => {
      console.log(`  ${i + 1}. ${file}`)
    })
    if (results.length > 20) {
      console.log(`  ... and ${results.length - 20} more`)
    }
  }

  // Create components type definition file
  const typeDefPath = 'types/components/index.ts'
  if (!fs.existsSync(typeDefPath)) {
    const typeDef = `/**
 * Component type definitions
 * Auto-generated by apply-component-types.ts
 */


// Button Props
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: ReactNode
  fullWidth?: boolean
}

// Form Props
export interface FormProps extends FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

export interface FormFieldProps {
  label?: string
  name: string
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helperText?: string
}

// Layout Props
export interface LayoutProps {
  children: ReactNode
  className?: string
  sidebar?: boolean
  header?: boolean
  footer?: boolean
}

// Modal Props
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  showCloseButton?: boolean
}

// Data Display Props
export interface DataDisplayProps<T = unknown> extends HTMLAttributes<HTMLDivElement> {
  data: T[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  renderItem?: (item: T, index: number) => ReactNode
}

// Table Props
export interface TableColumn<T = unknown> {
  key: keyof T | string
  label: string
  render?: (value: unknown, item: T) => ReactNode
  sortable?: boolean
  width?: string | number
}

export interface TableProps<T = unknown> extends DataDisplayProps<T> {
  columns: TableColumn<T>[]
  onRowClick?: (item: T) => void
  selectable?: boolean
  onSelectionChange?: (selected: T[]) => void
}

// Card Props
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: ReactNode
  footer?: ReactNode
  hoverable?: boolean
  bordered?: boolean
}

// Common Props
export interface WithClassName {
  className?: string
}

export interface WithChildren {
  children: ReactNode
}

export interface WithLoading {
  loading?: boolean
}

export interface WithError {
  error?: string | null
}
`

    // Ensure directory exists
    const typeDir = path.dirname(typeDefPath)
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true })
    }

    fs.writeFileSync(typeDefPath, typeDef)
    console.log(`\n✨ Created type definitions at ${typeDefPath}`)
  }

  console.log('\n✅ Component type application complete!')
  console.log('\n📝 Next steps:')
  console.log('  1. Run: npm run build')
  console.log('  2. Fix any TypeScript errors')
  console.log('  3. Update components that need custom types')
  console.log('  4. Run tests to ensure functionality')
}

main().catch(error => {
  console.error('❌ Error:', error)
  process.exit(1)
})