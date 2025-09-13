/**
 * 타입 가드 유틸리티 함수들
 */

// Check if value is defined (not null or undefined)
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

// Check if value is null
export function isNull(value: unknown): value is null {
  return value === null
}

// Check if value is undefined
export function isUndefined(value: unknown): value is undefined {
  return value === undefined
}

// Check if value is a string
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// Check if value is a number
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

// Check if value is a boolean
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

// Check if value is an array
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value)
}

// Check if value is an object (not null, not array)
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

// Check if value is a function
export function isFunction<T extends (...args: unknown[]) => unknown>(
  value: unknown
): value is T {
  return typeof value === 'function'
}

// Check if value is a Date
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

// Check if value is a Promise
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (
    isObject(value) && 
    'then' in value && 
    isFunction(value.then)
  )
}

// Check if value is an Error
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

// Check if value is a valid email
export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

// Check if value is a valid URL
export function isUrl(value: unknown): value is string {
  if (!isString(value)) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

// Check if value is a valid phone number
export function isPhoneNumber(value: unknown): value is string {
  if (!isString(value)) return false
  const phoneRegex = /^[\d\s\-+()]+$/
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10
}

// Check if value is empty (null, undefined, empty string, empty array, empty object)
export function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (isString(value) || isArray(value)) return value.length === 0
  if (isObject(value)) return Object.keys(value).length === 0
  return false
}

// Check if value is not empty
export function isNotEmpty(value: unknown): boolean {
  return !isEmpty(value)
}

// Check if object has property
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj
}

// Check if value is of specific type from union
export function isOfType<T extends string>(
  value: unknown,
  type: T
): value is T {
  return value === type
}

// Check if value is one of allowed values
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  allowedValues: T
): value is T[number] {
  return allowedValues.includes(value)
}

// Check if all items in array match predicate
export function allMatch<T>(
  array: T[],
  predicate: (item: T) => boolean
): boolean {
  return array.every(predicate)
}

// Check if any item in array matches predicate
export function anyMatch<T>(
  array: T[],
  predicate: (item: T) => boolean
): boolean {
  return array.some(predicate)
}

// Type assertion helper
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new TypeError(message || 'Type assertion failed')
  }
}

// Safe type casting
export function safeCast<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T {
  return guard(value) ? value : defaultValue
}