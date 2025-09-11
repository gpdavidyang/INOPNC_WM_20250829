import React from 'react';

/**
 * Defensive Rendering Utilities
 * 
 * These utilities help prevent React error #185 "Objects are not valid as React child"
 * by providing safe array and object handling for React rendering.
 */

/**
 * Safely maps over an array-like value with automatic array validation
 * @param value - Value that should be an array
 * @param mapFn - Function to apply to each array item
 * @param fallback - Fallback value if not an array (default: empty array)
 * @returns Array of mapped results or empty array
 */
export function safeMap<T, R>(
  value: unknown, 
  mapFn: (item: T, index: number, array: T[]) => R,
  fallback: R[] = []
): R[] {
  if (Array.isArray(value)) {
    return value.map(mapFn);
  }
  return fallback;
}

/**
 * Safely filters an array-like value with automatic array validation
 * @param value - Value that should be an array
 * @param filterFn - Function to test each element
 * @param fallback - Fallback value if not an array (default: empty array)
 * @returns Filtered array or fallback
 */
export function safeFilter<T>(
  value: unknown,
  filterFn: (item: T, index: number, array: T[]) => boolean,
  fallback: T[] = []
): T[] {
  if (Array.isArray(value)) {
    return value.filter(filterFn);
  }
  return fallback;
}

/**
 * Safely gets the length of an array-like value
 * @param value - Value that should be an array
 * @param fallback - Fallback length if not an array (default: 0)
 * @returns Length of array or fallback
 */
export function safeLength(value: unknown, fallback: number = 0): number {
  if (Array.isArray(value)) {
    return value.length;
  }
  return fallback;
}

/**
 * Safely slices an array-like value
 * @param value - Value that should be an array
 * @param start - Start index
 * @param end - End index (optional)
 * @param fallback - Fallback value if not an array (default: empty array)
 * @returns Sliced array or fallback
 */
export function safeSlice<T>(
  value: unknown,
  start?: number,
  end?: number,
  fallback: T[] = []
): T[] {
  if (Array.isArray(value)) {
    return value.slice(start, end);
  }
  return fallback;
}

/**
 * Safely ensures a value is an array
 * @param value - Value that should be an array
 * @param fallback - Fallback value if not an array (default: empty array)
 * @returns Value as array or fallback
 */
export function ensureArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
}

/**
 * Safely renders React children with validation to prevent rendering objects
 * @param value - Value to render
 * @param fallback - Fallback to render if value is invalid (default: null)
 * @returns Safe value for React rendering
 */
export function safeRender(value: unknown, fallback: React.ReactNode = null): React.ReactNode {
  // Allow basic primitive types and React elements
  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value)
  ) {
    return value;
  }
  
  // Don't render objects directly
  if (typeof value === 'object') {
    console.warn('[Defensive Rendering] Attempted to render object directly:', value);
    return fallback;
  }
  
  return value;
}

/**
 * Higher-order component for defensive array mapping in JSX
 * Usage: {renderArray(items, (item, index) => <Component key={item.id} item={item} />)}
 */
export function renderArray<T>(
  value: unknown,
  renderFn: (item: T, index: number) => React.ReactNode,
  emptyFallback: React.ReactNode = null
): React.ReactNode {
  if (!Array.isArray(value)) {
    console.warn('[Defensive Rendering] Expected array but got:', typeof value, value);
    return emptyFallback;
  }
  
  if (value.length === 0) {
    return emptyFallback;
  }
  
  return value.map((item, index) => {
    const rendered = renderFn(item, index);
    return safeRender(rendered);
  });
}

/**
 * Defensive object property access
 * @param obj - Object to access property from
 * @param key - Property key
 * @param fallback - Fallback value if property doesn't exist
 * @returns Property value or fallback
 */
export function safeGet<T>(obj: unknown, key: string | number, fallback: T): T {
  if (obj && typeof obj === 'object' && key in obj) {
    return (obj as any)[key] ?? fallback;
  }
  return fallback;
}

/**
 * React hook for defensive state management of arrays
 * @param initialValue - Initial array value
 * @returns [array, setArray] tuple with guaranteed array type
 */
export function useDefensiveArray<T>(initialValue: T[] = []): [T[], React.Dispatch<React.SetStateAction<T[]>>] {
  const [state, setState] = React.useState<T[]>(Array.isArray(initialValue) ? initialValue : []);
  
  const setDefensiveState = React.useCallback((newState: React.SetStateAction<T[]>) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' ? newState(prevState) : newState;
      return Array.isArray(nextState) ? nextState : [];
    });
  }, []);
  
  return [state, setDefensiveState];
}

/**
 * Type guard to check if a value is a non-empty array
 * @param value - Value to check
 * @returns true if value is a non-empty array
 */
export function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard to check if a value is a valid React child
 * @param value - Value to check
 * @returns true if value can be safely rendered by React
 */
export function isValidReactChild(value: unknown): value is React.ReactNode {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    React.isValidElement(value) ||
    Array.isArray(value)
  );
}