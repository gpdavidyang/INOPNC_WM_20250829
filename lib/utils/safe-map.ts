/**
 * Safe map utility to prevent React error #185
 * This utility ensures that map operations always return valid React children
 * and handles edge cases like undefined, null, or invalid objects
 */

import { ReactNode } from 'react'

/**
 * Safely map over an array with defensive checks
 * @param array - The array to map over (can be undefined or null)
 * @param mapFn - The mapping function
 * @param componentName - Optional component name for debugging
 * @returns Array of React nodes or empty array
 */
export function safeMap<T>(
  array: T[] | undefined | null,
  mapFn: (item: T, index: number, array: T[]) => ReactNode,
  componentName?: string
): ReactNode[] {
  // Handle null/undefined arrays
  if (!array) {
    if (componentName) {
      console.debug(`[${componentName}] safeMap called with null/undefined array`)
    }
    return []
  }

  // Ensure it's actually an array
  if (!Array.isArray(array)) {
    console.warn(
      `[${componentName || 'Unknown'}] safeMap called with non-array:`,
      typeof array,
      array
    )
    return []
  }

  // Map with defensive checks for each item
  const results: ReactNode[] = []
  
  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    
    // Skip invalid items
    if (item === undefined || item === null) {
      console.warn(
        `[${componentName || 'Unknown'}] Skipping null/undefined item at index ${i}`
      )
      continue
    }

    try {
      const result = mapFn(item, i, array)
      
      // Validate the result is a valid React child
      if (result !== undefined && result !== null) {
        // Check if result is a plain object (not a React element)
        if (
          typeof result === 'object' &&
          !Array.isArray(result) &&
          !result.$$typeof && // Not a React element
          !result._owner && // Not a React element
          !result.props // Not a React element
        ) {
          console.error(
            `[${componentName || 'Unknown'}] Map function returned invalid React child (plain object) at index ${i}:`,
            result
          )
          continue
        }
        
        results.push(result)
      }
    } catch (error) {
      console.error(
        `[${componentName || 'Unknown'}] Error in map function at index ${i}:`,
        error
      )
    }
  }

  return results
}

/**
 * Type guard to check if a value is a valid array for mapping
 */
export function isValidArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value !== null && value !== undefined
}

/**
 * Ensure an array has at least one item before mapping
 */
export function hasItems<T>(array: T[] | undefined | null): array is T[] {
  return Array.isArray(array) && array.length > 0
}