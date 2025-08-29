import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import * as Sentry from '@sentry/nextjs'
import { performanceTracker } from '@/lib/monitoring/performance-metrics'

// Direct access to environment variables for client-side with trim to remove any whitespace/newlines
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

// Extend window object for cookie caching
declare global {
  interface Window {
    __supabase_cookies?: Record<string, string>
  }
}

// Client-side validation
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables on client-side:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY
  })
}

// Query cache for optimizing repeated queries
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes default TTL

// Connection pool configuration
interface ClientConfig {
  enableQueryCache?: boolean
  enablePerformanceMonitoring?: boolean
  defaultCacheTTL?: number
  slowQueryThreshold?: number
}

const defaultConfig: ClientConfig = {
  enableQueryCache: true,
  enablePerformanceMonitoring: true,
  defaultCacheTTL: CACHE_TTL,
  slowQueryThreshold: 1000
}

// Enhanced client with monitoring and optimization
class EnhancedSupabaseClient {
  private client: ReturnType<typeof createBrowserClient<Database>>
  private config: ClientConfig

  constructor(config: ClientConfig = {}) {
    this.config = { ...defaultConfig, ...config }
    
    // CRITICAL FIX: Ensure proper cookie handling for session synchronization
    // Create client with explicit cookie configuration and realtime settings
    this.client = createBrowserClient<Database>(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        realtime: {
          // Enhanced WebSocket connection settings for better reliability
          heartbeatIntervalMs: 30000,      // 30 seconds heartbeat
          reconnectAfterMs: (attempt) => Math.min(attempt * 1000, 30000), // Exponential backoff
          timeout: 10000,                  // 10 seconds timeout
          logger: (level, message, ...args) => {
            // Only log errors in production, errors and warnings in development
            if (level === 'error' || (process.env.NODE_ENV === 'development' && level === 'warn')) {
              console.log(`[SUPABASE-REALTIME-${level.toUpperCase()}]`, message, ...args)
            }
          }
        },
        cookies: {
          // Get all cookies from document.cookie for proper session reading
          getAll() {
            const cookies: { name: string; value: string }[] = []
            if (typeof document !== 'undefined') {
              const cookieString = document.cookie
              if (cookieString) {
                cookieString.split(';').forEach(cookie => {
                  const [name, ...valueParts] = cookie.trim().split('=')
                  if (name) {
                    const value = valueParts.join('=') // Handle values with '=' in them
                    cookies.push({ 
                      name, 
                      value: value ? decodeURIComponent(value) : '' 
                    })
                  }
                })
              }
            }
            // Debug cookie reading only in development
            if (process.env.NODE_ENV === 'development') {
              console.log('[SUPABASE-CLIENT] Reading cookies:', cookies.filter(c => c.name.startsWith('sb-')).map(c => c.name))
            }
            return cookies
          },
          // Set cookies with proper options for session persistence
          setAll(cookiesToSet) {
            if (typeof document !== 'undefined') {
              cookiesToSet.forEach(({ name, value, options }) => {
                let cookieString = `${name}=${encodeURIComponent(value || '')}`
                
                // Set proper cookie options for session persistence
                if (options?.maxAge) {
                  cookieString += `; max-age=${options.maxAge}`
                }
                if (options?.expires) {
                  cookieString += `; expires=${options.expires.toUTCString()}`
                }
                // Always set path to root for session cookies
                cookieString += `; path=${options?.path || '/'}`
                
                if (options?.domain) {
                  cookieString += `; domain=${options.domain}`
                }
                if (options?.secure) {
                  cookieString += '; secure'
                }
                // Use 'lax' for better compatibility with server-side sessions
                cookieString += `; samesite=${options?.sameSite || 'lax'}`
                
                document.cookie = cookieString
                // Debug cookie setting only in development
                if (process.env.NODE_ENV === 'development') {
                  console.log('[SUPABASE-CLIENT] Setting cookie:', name)
                }
              })
            }
          }
        }
      }
    )
  }

  // Wrap queries with performance monitoring and caching
  from(table: keyof Database['public']['Tables']) {
    const originalFrom = this.client.from(table)
    
    return {
      ...originalFrom,
      select: (columns?: string) => {
        const query = originalFrom.select(columns)
        
        return this.wrapQueryBuilder(query, table, 'select', columns)
      },
      
      // Add monitoring to other operations
      insert: (values: any) => this.wrapMutation(originalFrom.insert(values), table, 'insert'),
      update: (values: any) => this.wrapMutation(originalFrom.update(values), table, 'update'),
      delete: () => this.wrapMutation(originalFrom.delete(), table, 'delete'),
      upsert: (values: any) => this.wrapMutation(originalFrom.upsert(values), table, 'upsert')
    }
  }

  // Wrap query builder with performance monitoring and caching
  private wrapQueryBuilder(query: any, table: string, operation: string, columns?: string) {
    if (!this.config.enablePerformanceMonitoring) {
      return query
    }

    const cacheKey = this.generateCacheKey(table, operation, columns)
    
    // Return a proxy that preserves all query builder methods
    return new Proxy(query, {
      get: (target, prop) => {
        // If it's a terminal method (then, catch, finally), wrap with monitoring
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return async (...args: any[]) => {
            const startTime = performance.now()
            
            return Sentry.startSpan({
              name: `Supabase ${operation}: ${table}`,
              op: 'db.query',
              attributes: {
                'db.table': table,
                'db.operation': operation,
                'db.columns': columns || '*'
              }
            }, async (span) => {
              try {
                // Check cache for SELECT operations
                if (operation === 'select' && this.config.enableQueryCache) {
                  const cached = this.getCachedQuery(cacheKey)
                  if (cached) {
                    performanceTracker.recordMetric('supabaseCacheHit', 1)
                    span.setAttribute('cache.hit', true)
                    return Promise.resolve(cached)
                  }
                }
                
                const result = await target[prop](...args)
                const duration = performance.now() - startTime
                
                performanceTracker.recordMetric('supabaseQueryTime', duration)
                span.setMeasurement?.('db.query.duration', duration, 'millisecond')
                
                if (duration > this.config.slowQueryThreshold!) {
                  Sentry.captureMessage(
                    `Slow Supabase ${operation}: ${table} took ${duration}ms`,
                    'warning'
                  )
                }
                
                // Cache successful SELECT results
                if (operation === 'select' && this.config.enableQueryCache && result?.data) {
                  this.setCachedQuery(cacheKey, result, this.config.defaultCacheTTL!)
                  performanceTracker.recordMetric('supabaseCacheMiss', 1)
                }
                
                return result
              } catch (error) {
                const duration = performance.now() - startTime
                span.setMeasurement?.('db.query.duration', duration, 'millisecond')
                
                Sentry.captureException(error, {
                  tags: { component: 'supabase-client' },
                  contexts: {
                    query: {
                      table,
                      operation,
                      columns,
                      duration
                    }
                  }
                })
                
                performanceTracker.recordMetric('supabaseQueryError', 1)
                throw error
              }
            })
          }
        }
        
        // For all other properties, return them as-is to preserve the query builder chain
        const value = target[prop]
        
        // If it's a function, wrap it to maintain the proxy chain
        if (typeof value === 'function') {
          return (...args: any[]) => {
            const result = value.apply(target, args)
            // If the result is chainable (has query builder methods), wrap it too
            if (result && typeof result === 'object' && 'then' in result) {
              return this.wrapQueryBuilder(result, table, operation, columns)
            }
            return result
          }
        }
        
        return value
      }
    })
  }

  // Wrap mutations with monitoring
  private wrapMutation(query: any, table: string, operation: string) {
    if (!this.config.enablePerformanceMonitoring) {
      return query
    }

    return {
      ...query,
      then: async (resolve: any, reject: any) => {
        const startTime = performance.now()
        
        return Sentry.startSpan({
          name: `Supabase ${operation}: ${table}`,
          op: 'db.mutation',
          attributes: {
            'db.table': table,
            'db.operation': operation
          }
        }, async (span) => {
          try {
            const result = await query
            const duration = performance.now() - startTime
            
            performanceTracker.recordMetric('supabaseMutationTime', duration)
            span.setMeasurement?.('db.mutation.duration', duration, 'millisecond')
            
            if (duration > this.config.slowQueryThreshold!) {
              Sentry.captureMessage(
                `Slow Supabase ${operation}: ${table} took ${duration}ms`,
                'warning'
              )
            }
            
            // Clear relevant cache entries after mutations
            if (this.config.enableQueryCache) {
              this.invalidateTableCache(table)
            }
            
            return resolve(result)
          } catch (error) {
            const duration = performance.now() - startTime
            span.setMeasurement?.('db.mutation.duration', duration, 'millisecond')
            
            Sentry.captureException(error, {
              tags: { component: 'supabase-client' },
              contexts: {
                mutation: {
                  table,
                  operation,
                  duration
                }
              }
            })
            
            performanceTracker.recordMetric('supabaseMutationError', 1)
            return reject(error)
          }
        })
      }
    }
  }

  // Auth methods - CRITICAL: Use raw client directly for proper cookie handling
  get auth() {
    // Return the raw auth client to ensure proper cookie management
    // The enhanced wrapper was interfering with session cookie propagation
    return this.client.auth
  }

  // Storage methods with monitoring
  get storage() {
    return {
      from: (bucket: string) => ({
        ...this.client.storage.from(bucket),
        upload: async (path: string, file: any, options?: any) => {
          return performanceTracker.trackApiCall(
            `storage.upload.${bucket}`,
            () => this.client.storage.from(bucket).upload(path, file, options)
          )
        }
      })
    }
  }

  // Cache management
  private generateCacheKey(table: string, operation: string, columns?: string): string {
    return `${table}:${operation}:${columns || '*'}`
  }

  private getCachedQuery(key: string) {
    const cached = queryCache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      queryCache.delete(key)
      return null
    }
    
    return cached.data
  }

  private setCachedQuery(key: string, data: any, ttl: number) {
    queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private invalidateTableCache(table: string) {
    for (const [key] of queryCache) {
      if (key.startsWith(`${table}:`)) {
        queryCache.delete(key)
      }
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: queryCache.size,
      entries: Array.from(queryCache.keys())
    }
  }

  // Clear cache manually
  clearCache(table?: string) {
    if (table) {
      this.invalidateTableCache(table)
    } else {
      queryCache.clear()
    }
  }

  // Access original client if needed
  get raw() {
    return this.client
  }
}

// CRITICAL FIX: Singleton with fresh cookie handlers
// The singleton maintains auth state listeners but uses fresh cookie handlers
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

// Cookie handlers that always read current state
const createCookieHandlers = () => ({
  getAll() {
    const cookies: { name: string; value: string }[] = []
    if (typeof document !== 'undefined') {
      const cookieString = document.cookie
      if (cookieString) {
        cookieString.split(';').forEach(cookie => {
          const [name, ...valueParts] = cookie.trim().split('=')
          if (name) {
            const value = valueParts.join('=')
            cookies.push({ 
              name, 
              value: value ? decodeURIComponent(value) : '' 
            })
          }
        })
      }
    }
    return cookies
  },
  setAll(cookiesToSet: any[]) {
    if (typeof document !== 'undefined') {
      cookiesToSet.forEach(({ name, value, options }) => {
        let cookieString = `${name}=${encodeURIComponent(value || '')}`
        if (options?.maxAge) {
          cookieString += `; max-age=${options.maxAge}`
        }
        if (options?.expires) {
          cookieString += `; expires=${options.expires.toUTCString()}`
        }
        cookieString += `; path=${options?.path || '/'}`
        if (options?.domain) {
          cookieString += `; domain=${options.domain}`
        }
        if (options?.secure) {
          cookieString += '; secure'
        }
        cookieString += `; samesite=${options?.sameSite || 'lax'}`
        document.cookie = cookieString
      })
    }
  }
})

export function createClient(config?: ClientConfig) {
  // CRITICAL FIX: Always create fresh cookie handlers to avoid caching issues
  // Supabase caches the handlers, so we need to bypass the singleton for cookies
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!,
      {
        realtime: {
          // Enhanced WebSocket connection settings for better reliability
          heartbeatIntervalMs: 30000,      // 30 seconds heartbeat
          reconnectAfterMs: (attempt) => Math.min(attempt * 1000, 30000), // Exponential backoff
          timeout: 10000,                  // 10 seconds timeout
          logger: (level, message, ...args) => {
            // Only log errors in production, errors and warnings in development
            if (level === 'error' || (process.env.NODE_ENV === 'development' && level === 'warn')) {
              console.log(`[SUPABASE-REALTIME-${level.toUpperCase()}]`, message, ...args)
            }
          }
        },
        cookies: {
          getAll() {
            const cookies: { name: string; value: string }[] = []
            if (typeof document !== 'undefined') {
              // First, try to get from locally cached cookies (for immediate access)
              const localCookies = window.__supabase_cookies || {}
              Object.entries(localCookies).forEach(([name, value]) => {
                cookies.push({ name, value: value as string })
              })
              
              // Then also read from document.cookie (for persistence)
              const cookieString = document.cookie
              // Debug cookie reading only in development
              if (process.env.NODE_ENV === 'development') {
                console.log('[SUPABASE-CLIENT] Reading cookies, raw string:', cookieString)
              }
              if (cookieString) {
                cookieString.split(';').forEach(cookie => {
                  const [name, ...valueParts] = cookie.trim().split('=')
                  if (name) {
                    const value = valueParts.join('=')
                    // Only add if not already in local cache
                    if (!cookies.find(c => c.name === name)) {
                      cookies.push({ 
                        name, 
                        value: value ? decodeURIComponent(value) : '' 
                      })
                    }
                  }
                })
              }
              
              const sbCookies = cookies.filter(c => c.name.startsWith('sb-'))
              // Debug cookie info only in development
              if (process.env.NODE_ENV === 'development') {
                console.log('[SUPABASE-CLIENT] Found Supabase cookies:', sbCookies.map(c => c.name))
                console.log('[SUPABASE-CLIENT] Local cache cookies:', Object.keys(localCookies))
              }
            }
            return cookies
          },
          setAll(cookiesToSet: any[]) {
            if (typeof document !== 'undefined') {
              // Debug cookie setting only in development
              if (process.env.NODE_ENV === 'development') {
                console.log('[SUPABASE-CLIENT] Setting cookies:', cookiesToSet.map(c => c.name))
              }
              cookiesToSet.forEach(({ name, value, options }) => {
                let cookieString = `${name}=${encodeURIComponent(value || '')}`
                if (options?.maxAge) {
                  cookieString += `; max-age=${options.maxAge}`
                }
                if (options?.expires) {
                  cookieString += `; expires=${options.expires.toUTCString()}`
                }
                cookieString += `; path=${options?.path || '/'}`
                if (options?.domain) {
                  cookieString += `; domain=${options.domain}`
                }
                if (options?.secure) {
                  cookieString += '; secure'
                }
                cookieString += `; samesite=${options?.sameSite || 'lax'}`
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[SUPABASE-CLIENT] Setting cookie string:', cookieString)
                }
                document.cookie = cookieString
                
                // CRITICAL: Store cookies locally for immediate access
                // Browser may not make cookies available instantly via document.cookie
                if (!window.__supabase_cookies) {
                  window.__supabase_cookies = {}
                }
                window.__supabase_cookies[name] = value || ''
                if (process.env.NODE_ENV === 'development') {
                  console.log('[SUPABASE-CLIENT] ✅ Cookie cached locally:', name)
                }
              })
            }
          }
        }
      }
    )
    
    // Only log client creation in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[SUPABASE-CLIENT] Created new browser client instance')
    }
  }
  
  return browserClient
}

// Enhanced client for specific use cases that need monitoring
export function createEnhancedClient(config?: ClientConfig) {
  return new EnhancedSupabaseClient(config)
}

// Function to clear query cache and reset browser client
export function resetClient() {
  // Clear the cached browser client to force fresh instance
  browserClient = undefined
  queryCache.clear()
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 [SUPABASE-CLIENT] Browser client and query cache cleared')
  }
}

// Force session refresh from cookies
export async function forceSessionRefresh() {
  if (browserClient) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 [SUPABASE-CLIENT] Forcing session refresh from cookies...')
      }
      
      // Clear the cached client first
      browserClient = undefined
      
      // Create a fresh client instance
      const freshClient = createClient()
      
      // Force the client to read session from cookies
      const { data: { session }, error } = await freshClient.auth.getSession()
      
      if (session) {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [SUPABASE-CLIENT] Session refreshed successfully:', session.user?.email)
        }
        return { success: true, session }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ [SUPABASE-CLIENT] No session found after refresh')
        }
        return { success: false, error: error?.message || 'No session found' }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ [SUPABASE-CLIENT] Session refresh failed:', error)
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
  return { success: false, error: 'No client instance' }
}

// Export for direct access to raw client if needed
export function createRawClient() {
  // Also use proper cookie configuration for raw client
  return createBrowserClient<Database>(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies: { name: string; value: string }[] = []
          if (typeof document !== 'undefined') {
            const cookieString = document.cookie
            if (cookieString) {
              cookieString.split(';').forEach(cookie => {
                const [name, ...valueParts] = cookie.trim().split('=')
                if (name) {
                  const value = valueParts.join('=')
                  cookies.push({ 
                    name, 
                    value: value ? decodeURIComponent(value) : '' 
                  })
                }
              })
            }
          }
          return cookies
        },
        setAll(cookiesToSet) {
          if (typeof document !== 'undefined') {
            cookiesToSet.forEach(({ name, value, options }) => {
              let cookieString = `${name}=${encodeURIComponent(value || '')}`
              if (options?.maxAge) {
                cookieString += `; max-age=${options.maxAge}`
              }
              if (options?.expires) {
                cookieString += `; expires=${options.expires.toUTCString()}`
              }
              cookieString += `; path=${options?.path || '/'}`
              if (options?.domain) {
                cookieString += `; domain=${options.domain}`
              }
              if (options?.secure) {
                cookieString += '; secure'
              }
              cookieString += `; samesite=${options?.sameSite || 'lax'}`
              document.cookie = cookieString
            })
          }
        }
      }
    }
  )
}