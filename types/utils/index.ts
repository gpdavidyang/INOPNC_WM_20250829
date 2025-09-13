/**
 * 유틸리티 타입 정의
 */

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Make all properties required recursively
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

// Make all properties readonly recursively
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

// Make specific properties nullable
export type Nullable<T> = T | null

// Make specific properties optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Make specific properties required
export type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>

// Extract non-nullable type
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

// Await type for Promises
export type Awaited<T> = T extends Promise<infer U> ? U : T

// Extract array element type
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never

// Object value types
export type ValueOf<T> = T[keyof T]

// String literal union from object keys
export type KeysOf<T> = keyof T extends string ? keyof T : never

// Function types
export type AsyncFunction<T = void, U = void> = (args: T) => Promise<U>
export type SyncFunction<T = void, U = void> = (args: T) => U
export type VoidFunction = () => void
export type AsyncVoidFunction = () => Promise<void>

// Event handler types
export type EventHandler<T = Event> = (event: T) => void
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>

// Form types
export type FormData<T> = {
  [K in keyof T]: T[K] extends File ? File : 
                  T[K] extends File[] ? File[] :
                  T[K] extends Date ? string :
                  T[K]
}

// API Response types
export type SuccessResponse<T> = {
  success: true
  data: T
  error?: never
}

export type ErrorResponse = {
  success: false
  data?: never
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse

// Pagination types
export type PaginationParams = {
  page: number
  limit: number
  sort?: string
  order?: 'asc' | 'desc'
}

export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

// Filter types
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in' | 'between'

export type Filter<T = unknown> = {
  field: string
  operator: FilterOperator
  value: T
}

export type SortOrder = {
  field: string
  direction: 'asc' | 'desc'
}

// Date range types
export type DateRange = {
  start: Date | string
  end: Date | string
}

// Coordinate types
export type Coordinates = {
  latitude: number
  longitude: number
}

// File types
export type FileInfo = {
  name: string
  size: number
  type: string
  lastModified: number
  url?: string
}

// Status types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: Error | null
  state: LoadingState
}

// Theme types
export type ColorScheme = 'light' | 'dark' | 'auto'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// Validation types
export type ValidationRule = {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: unknown) => boolean | string
}

export type ValidationErrors<T> = Partial<Record<keyof T, string>>

// Permission types
export type Permission = {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
  granted: boolean
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type NotificationPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right'

// Re-export specific utility modules
export * from './guards'
export * from './helpers'