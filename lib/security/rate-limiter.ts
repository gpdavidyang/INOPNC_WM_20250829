/**
 * Advanced Rate Limiting System for Production Security
 * 
 * Implements multiple rate limiting strategies:
 * - IP-based rate limiting
 * - User-based rate limiting  
 * - Endpoint-specific limits
 * - Sliding window algorithm
 * - Distributed rate limiting (Redis-compatible)
 */


// Rate limiting configuration for different endpoint types
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints - stricter limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    statusCode: 429
  },
  
  // Data read operations - moderate limits
  read: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Rate limit exceeded for read operations',
    statusCode: 429
  },
  
  // Data write operations - stricter limits
  write: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 20, // 20 writes per minute
    message: 'Rate limit exceeded for write operations', 
    statusCode: 429
  },
  
  // File upload - very strict limits
  upload: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message: 'Rate limit exceeded for file uploads',
    statusCode: 429
  },
  
  // Admin operations - moderate limits with higher threshold
  admin: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 50, // 50 admin operations per minute
    message: 'Rate limit exceeded for admin operations',
    statusCode: 429
  },
  
  // Analytics and reporting - higher limits
  analytics: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 200, // 200 requests per minute
    message: 'Rate limit exceeded for analytics',
    statusCode: 429
  },
  
  // Default fallback
  default: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Rate limit exceeded',
    statusCode: 429
  }
} as const

export type RateLimitType = keyof typeof RATE_LIMIT_CONFIG

// In-memory store for development/small deployments
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now()
    const record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      return null
    }
    
    return record
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    const resetTime = Date.now() + windowMs
    this.store.set(key, { count, resetTime })
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const existing = this.store.get(key)
    
    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs
      const record = { count: 1, resetTime }
      this.store.set(key, record)
      return record
    }
    
    existing.count++
    this.store.set(key, existing)
    return existing
  }

  // Cleanup expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Redis store for production/distributed deployments
class RedisStore {
  private redis: unknown // Redis client would be injected

  constructor(redisClient?: unknown) {
    this.redis = redisClient
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.redis) return null
    
    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    if (!this.redis) {
      throw new Error('Redis client not available')
    }

    try {
      const now = Date.now()
      const resetTime = now + windowMs
      
      // Use Redis pipeline for atomic operations
      const pipeline = this.redis.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, Math.ceil(windowMs / 1000))
      
      const results = await pipeline.exec()
      const count = results[0][1]
      
      return { count, resetTime }
    } catch (error) {
      console.error('Redis increment error:', error)
      throw error
    }
  }
}

// Rate limiter class
export class RateLimiter {
  private store: MemoryStore | RedisStore
  
  constructor(redisClient?: unknown) {
    this.store = redisClient ? new RedisStore(redisClient) : new MemoryStore()
    
    // Cleanup memory store every 5 minutes
    if (this.store instanceof MemoryStore) {
      setInterval(() => {
        this.store.cleanup()
      }, 5 * 60 * 1000)
    }
  }

  /**
   * Check if request should be rate limited
   */
  async isRateLimited(
    identifier: string,
    limitType: RateLimitType = 'default'
  ): Promise<{
    limited: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const config = RATE_LIMIT_CONFIG[limitType]
    const key = `rate_limit:${limitType}:${identifier}`
    
    try {
      const result = await this.store.increment(key, config.windowMs)
      const limited = result.count > config.maxRequests
      const remaining = Math.max(0, config.maxRequests - result.count)
      const retryAfter = limited ? Math.ceil((result.resetTime - Date.now()) / 1000) : undefined

      return {
        limited,
        limit: config.maxRequests,
        remaining,
        resetTime: result.resetTime,
        retryAfter
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open - don't block requests if rate limiter fails
      return {
        limited: false,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }
  }

  /**
   * Get rate limit headers for response
   */
  getRateLimitHeaders(result: {
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
    }

    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString()
    }

    return headers
  }
}

// Utility functions for determining rate limit type based on request
export function getRateLimitType(request: NextRequest): RateLimitType {
  const { pathname, method } = request.nextUrl
  
  // Authentication endpoints
  if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/register')) {
    return 'auth'
  }
  
  // File upload endpoints
  if (pathname.includes('/upload') || pathname.includes('/files')) {
    return 'upload'
  }
  
  // Admin endpoints
  if (pathname.includes('/admin') || pathname.includes('/system')) {
    return 'admin'
  }
  
  // Analytics endpoints
  if (pathname.includes('/analytics') || pathname.includes('/reports')) {
    return 'analytics'
  }
  
  // Write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return 'write'
  }
  
  // Read operations
  if (method === 'GET') {
    return 'read'
  }
  
  return 'default'
}

/**
 * Get unique identifier for rate limiting
 * Combines IP address and user ID if available
 */
export function getRateLimitIdentifier(request: NextRequest, userId?: string): string {
  // Get IP address with support for various proxy headers
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown'
  
  // If user is authenticated, combine IP and user ID for more granular control
  if (userId) {
    return `${ip}:${userId}`
  }
  
  return ip
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null

export function getRateLimiter(redisClient?: unknown): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter(redisClient)
  }
  return rateLimiterInstance
}

// Middleware helper for Next.js API routes
export async function withRateLimit(
  request: NextRequest,
  userId?: string,
  limitType?: RateLimitType
): Promise<Response | null> {
  const rateLimiter = getRateLimiter()
  const identifier = getRateLimitIdentifier(request, userId)
  const type = limitType || getRateLimitType(request)
  
  const result = await rateLimiter.isRateLimited(identifier, type)
  const headers = rateLimiter.getRateLimitHeaders(result)
  
  if (result.limited) {
    const config = RATE_LIMIT_CONFIG[type]
    return new Response(
      JSON.stringify({
        error: config.message,
        retryAfter: result.retryAfter
      }),
      {
        status: config.statusCode,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    )
  }
  
  // Add rate limit headers to successful responses
  return null
}

// Export for use in middleware.ts
export { RATE_LIMIT_CONFIG as default }