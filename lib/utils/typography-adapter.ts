/**
 * Typography Adapter
 * 
 * This file provides backward compatibility for typography functions
 * to prevent breaking changes during refactoring.
 */


/**
 * @deprecated Use getFullTypographyClass instead
 * This function is kept for backward compatibility
 */
export function getTypographyClass(size: string, isLargeFont: boolean): string {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `getTypographyClass is deprecated. Use getFullTypographyClass('body', '${size}', ${isLargeFont}) instead.`
    )
  }
  
  return getFullTypographyClass('body', size, isLargeFont)
}

/**
 * Migration helper to convert old calls to new format
 */
export function migrateTypographyCall(oldCall: string): string {
  // Match: getTypographyClass('size', isLargeFont)
  const match = oldCall.match(/getTypographyClass\(['"`]([\w-]+)['"`],\s*(\w+)\)/)
  
  if (match) {
    const [, size, isLargeFont] = match
    return `getFullTypographyClass('body', '${size}', ${isLargeFont})`
  }
  
  return oldCall
}