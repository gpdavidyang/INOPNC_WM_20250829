
interface CacheEntry {
  data: unknown
  timestamp: number
}

class QueryCache {
  private cache: Map<string, CacheEntry> = new Map()
  private ttl: number = 60000 // 1 minute default TTL

  constructor(ttl?: number) {
    if (ttl) this.ttl = ttl
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean up old entries periodically
    if (this.cache.size > 100) {
      this.cleanup()
    }
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

// Global cache instance
const queryCache = new QueryCache()

// Performance monitoring wrapper
export function withPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  options?: { cache?: boolean; ttl?: number }
): Promise<T> {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return async () => {
    // Check cache first if enabled
    if (options?.cache) {
      const cacheKey = queryName
      const cached = queryCache.get(cacheKey)
      if (cached) {
        if (!isProduction) {
          console.debug(`[CACHE HIT] ${queryName}`)
        }
        return cached
      }
    }

    const start = performance.now()
    
    try {
      const result = await queryFn()
      
      // Cache the result if caching is enabled
      if (options?.cache) {
        queryCache.set(queryName, result)
      }
      
      const duration = performance.now() - start
      
      // Only log slow queries in development
      if (!isProduction && duration > 1000) {
        console.warn(`[SLOW QUERY] ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      
      if (!isProduction) {
        console.error(`[QUERY ERROR] ${queryName} failed after ${duration.toFixed(2)}ms`, error)
      }
      
      throw error
    }
  }
}

// Optimized query patterns
export const QueryPatterns = {
  // Use select to only fetch needed fields
  selectFields: (fields: string[]) => fields.join(','),
  
  // Pagination helpers
  paginate: (page: number = 1, limit: number = 20) => ({
    from: (page - 1) * limit,
    to: page * limit - 1
  }),
  
  // Common filters
  activeOnly: { status: 'active' },
  recentFirst: { column: 'created_at', ascending: false }
}

// Query debouncer for search
export class QueryDebouncer {
  private timeoutId: NodeJS.Timeout | null = null
  private delay: number

  constructor(delay: number = 300) {
    this.delay = delay
  }

  debounce<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
      }

      this.timeoutId = setTimeout(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, this.delay)
    })
  }

  cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }
}

// Batch query helper
export async function batchQueries<T>(
  queries: Array<() => Promise<T>>,
  batchSize: number = 3
): Promise<T[]> {
  const results: T[] = []
  
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(q => q()))
    results.push(...batchResults)
  }
  
  return results
}

// Export cache control
export const cacheControl = {
  clear: () => queryCache.clear(),
  cleanup: () => queryCache.cleanup()
}