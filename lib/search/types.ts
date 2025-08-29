export type SearchOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'gte' | 'lte' | 'between'

export interface SearchFilter {
  field: string
  operator: SearchOperator
  value: any
  values?: any[] // For 'between' operator
}

export interface SearchOptions {
  query?: string // Global search query
  filters: SearchFilter[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface SearchResult<T> {
  items: T[]
  total: number
  hasMore: boolean
  filters: AppliedFilter[]
}

export interface AppliedFilter {
  field: string
  operator: SearchOperator
  value: any
  values?: any[]
  label: string
  displayValue: string
}

export interface SearchFieldConfig {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  operators: SearchOperator[]
  options?: { value: any; label: string }[] // For select fields
  placeholder?: string
}

// Predefined search configurations for different entities
export interface DailyReportSearchConfig {
  fields: SearchFieldConfig[]
  defaultSort: { field: string; order: 'asc' | 'desc' }
  quickFilters: QuickFilter[]
}

export interface QuickFilter {
  id: string
  label: string
  filters: SearchFilter[]
  icon?: string
}