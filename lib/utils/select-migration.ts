/**
 * Select Migration Utility
 * Helps convert from old HTML select component to new Radix UI Select component
 */

import { ReactNode } from 'react'

/**
 * Migration guide for converting old Select to new Select
 * 
 * OLD:
 * ```tsx
 * import { Select, SelectItem } from '@/components/ui/select'
 * 
 * <Select value={value} onChange={(e) => setValue(e.target.value)}>
 *   <SelectItem value="option1">Option 1</SelectItem>
 *   <SelectItem value="option2">Option 2</SelectItem>
 * </Select>
 * ```
 * 
 * NEW:
 * ```tsx
 * import { 
 *   Select, 
 *   SelectContent, 
 *   SelectItem, 
 *   SelectTrigger, 
 *   SelectValue 
 * } from '@/components/ui/select-new'
 * 
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="Select an option" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="option1">Option 1</SelectItem>
 *     <SelectItem value="option2">Option 2</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */

interface MigrationChecklistItem {
  step: string
  description: string
  example?: string
}

export const SELECT_MIGRATION_CHECKLIST: MigrationChecklistItem[] = [
  {
    step: '1. Update imports',
    description: 'Change import from @/components/ui/select to @/components/ui/select-new',
    example: `// OLD
import { Select, SelectItem } from '@/components/ui/select'

// NEW
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select-new'`
  },
  {
    step: '2. Convert onChange to onValueChange',
    description: 'Replace onChange handler with onValueChange',
    example: `// OLD
onChange={(e) => setValue(e.target.value)}

// NEW
onValueChange={setValue}`
  },
  {
    step: '3. Add SelectTrigger and SelectContent wrappers',
    description: 'Wrap the select with proper structure',
    example: `// OLD
<Select value={value} onChange={handler}>
  <SelectItem>...</SelectItem>
</Select>

// NEW
<Select value={value} onValueChange={handler}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem>...</SelectItem>
  </SelectContent>
</Select>`
  },
  {
    step: '4. Handle disabled state',
    description: 'Move disabled prop to SelectTrigger',
    example: `// OLD
<Select disabled={isDisabled}>

// NEW
<Select>
  <SelectTrigger disabled={isDisabled}>`
  },
  {
    step: '5. Handle className',
    description: 'Apply className to SelectTrigger instead of Select',
    example: `// OLD
<Select className="w-full">

// NEW
<Select>
  <SelectTrigger className="w-full">`
  },
  {
    step: '6. Add placeholder',
    description: 'Use SelectValue placeholder prop for default text',
    example: `<SelectValue placeholder="Select an option" />`
  }
]

/**
 * Helper function to convert onChange event handler to onValueChange
 */
export function convertOnChangeHandler(
  oldHandler: string
): string {
  // Pattern: onChange={(e) => setValue(e.target.value)}
  const onChangePattern = /onChange=\{(\(e\)|e) => (.+)\(e\.target\.value\)\}/
  const match = oldHandler.match(onChangePattern)
  
  if (match) {
    const setterFunction = match[2]
    return `onValueChange={${setterFunction}}`
  }
  
  return oldHandler
}

/**
 * Common patterns and their replacements
 */
export const COMMON_PATTERNS = {
  // Import patterns
  oldImport: `import { Select, SelectItem } from '@/components/ui/select'`,
  newImport: `import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select-new'`,
  
  // Basic select pattern
  oldBasicSelect: `<Select value={value} onChange={(e) => setValue(e.target.value)}>
  <SelectItem value="option">Option</SelectItem>
</Select>`,
  
  newBasicSelect: `<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>`,
  
  // With className
  oldWithClass: `<Select className="w-full" value={value} onChange={handler}>`,
  newWithClass: `<Select value={value} onValueChange={handler}>
  <SelectTrigger className="w-full">`,
  
  // With disabled
  oldDisabled: `<Select disabled={isDisabled} value={value} onChange={handler}>`,
  newDisabled: `<Select value={value} onValueChange={handler}>
  <SelectTrigger disabled={isDisabled}>`
}

/**
 * TypeScript type mappings
 */
export interface SelectMigrationTypes {
  // Old types
  oldOnChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  
  // New types
  newOnValueChange: (value: string) => void
}

/**
 * Files that need migration
 */
export const FILES_TO_MIGRATE = [
  '/components/daily-reports/daily-report-list-new.tsx',
  '/components/daily-reports/daily-report-form-new.tsx',
  '/components/markup/dialogs/open-dialog.tsx',
  '/components/daily-reports/daily-report-form-enhanced.tsx',
  '/components/markup/dialogs/save-dialog.tsx',
  '/components/markup/list/markup-document-list.tsx',
  '/app/components/page.tsx'
]

/**
 * Migration notes for specific files
 */
export const FILE_SPECIFIC_NOTES = {
  '/components/markup/dialogs/save-dialog.tsx': 'Uses onChange handler with e.target.value, needs conversion to onValueChange',
  '/components/daily-reports/daily-report-form-enhanced.tsx': 'May have multiple select components, check all instances',
  '/app/components/page.tsx': 'Demo page - ensure all examples are updated'
}