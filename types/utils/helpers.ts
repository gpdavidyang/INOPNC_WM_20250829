/**
 * 타입 헬퍼 유틸리티 함수들
 */

import { DeepPartial, Nullable } from './index'

// Merge two types deeply
export type DeepMerge<T, U> = T extends object
  ? U extends object
    ? {
        [K in keyof T | keyof U]: K extends keyof T
          ? K extends keyof U
            ? DeepMerge<T[K], U[K]>
            : T[K]
          : K extends keyof U
          ? U[K]
          : never
      }
    : U
  : U

// Pick multiple nested properties
export type DeepPick<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? { [K in Key]: DeepPick<T[K], Rest> }
    : never
  : Path extends keyof T
  ? { [K in Path]: T[K] }
  : never

// Omit multiple nested properties
export type DeepOmit<T, K extends PropertyKey> = T extends object
  ? {
      [P in keyof T as P extends K ? never : P]: DeepOmit<T[P], K>
    }
  : T

// Convert Date properties to string
export type StringifyDates<T> = T extends Date
  ? string
  : T extends object
  ? {
      [K in keyof T]: StringifyDates<T[K]>
    }
  : T

// Convert string properties to Date where applicable
export type ParseDates<T, K extends keyof T = keyof T> = {
  [P in keyof T]: P extends K ? Date : T[P]
}

// Make specific nested properties optional
export type DeepOptional<T, Path extends string> = Path extends `${infer Key}.${infer Rest}`
  ? Key extends keyof T
    ? Omit<T, Key> & { [K in Key]?: DeepOptional<T[K], Rest> }
    : T
  : Path extends keyof T
  ? Omit<T, Path> & { [K in Path]?: T[K] }
  : T

// Extract keys of specific type
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

// Extract properties of specific type
export type PropertiesOfType<T, U> = Pick<T, KeysOfType<T, U>>

// Exclude properties of specific type
export type ExcludePropertiesOfType<T, U> = Omit<T, KeysOfType<T, U>>

// Convert union to intersection
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never

// Get function arguments type
export type ArgumentsType<T extends (...args: unknown[]) => unknown> = 
  T extends (...args: infer A) => unknown ? A : never

// Get function return type (built-in ReturnType alternative)
export type ReturnTypeOf<T extends (...args: unknown[]) => unknown> = 
  T extends (...args: unknown[]) => infer R ? R : never

// Get promise resolved type
export type PromiseType<T extends Promise<unknown>> = 
  T extends Promise<infer U> ? U : never

// Create branded type for type safety
export type Brand<T, B> = T & { __brand: B }

// Create opaque type
export type Opaque<T, K> = T & { __opaque: K }

// XOR type (exactly one of two types)
export type XOR<T, U> = (T | U) extends object
  ? (T & { [K in Exclude<keyof U, keyof T>]?: never }) |
    (U & { [K in Exclude<keyof T, keyof U>]?: never })
  : T | U

// Type safe object entries
export type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

// Type safe object from entries
export type FromEntries<T extends ReadonlyArray<readonly [PropertyKey, unknown]>> = {
  [K in T[number] as K[0]]: K[1]
}

// Flatten type for better IDE hints
export type Flatten<T> = T extends object
  ? { [K in keyof T]: T[K] }
  : T

// Create a type that represents either T or a Promise of T
export type MaybePromise<T> = T | Promise<T>

// Create a type that represents either T or an array of T
export type MaybeArray<T> = T | T[]

// Create readonly version with specific keys mutable
export type ReadonlyExcept<T, K extends keyof T> = 
  Readonly<Omit<T, K>> & Pick<T, K>

// Create mutable version with specific keys readonly
export type MutableExcept<T, K extends keyof T> = 
  Omit<T, K> & Readonly<Pick<T, K>>

// Type for class constructors
export type Constructor<T = object> = new (...args: unknown[]) => T

// Type for abstract class constructors
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T

// Diff type - properties in T but not in U
export type Diff<T, U> = T extends U ? never : T

// Intersection type helper
export type Common<T, U> = T extends U ? T : never

// Replace type - replace properties in T with properties from U
export type Replace<T, U> = Omit<T, keyof U> & U