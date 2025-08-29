/**
 * Secure API Wrapper with Comprehensive Security Features
 * 
 * Features:
 * - Request validation and sanitization
 * - Rate limiting integration
 * - Security headers injection
 * - Input validation
 * - Audit logging
 * - Error handling with security context
 * - Request signing validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, getRateLimitIdentifier, getRateLimitType } from './rate-limiter'
import { getAPISecurityHeaders, logSecurityEvent } from './security-headers'
import { z } from 'zod'
import crypto from 'crypto'

export interface SecurityConfig {
  requireAuth?: boolean
  requiredRole?: string[]
  rateLimit?: boolean
  validateInput?: z.ZodSchema
  requireSignature?: boolean
  auditLog?: boolean
  maxRequestSize?: number
}

export interface ApiContext {
  user?: any
  profile?: any
  ip: string
  userAgent: string
  requestId: string
  timestamp: string
}

export interface ApiError {
  code: string
  message: string
  statusCode: number
  details?: any
}

// Common API errors
export const API_ERRORS = {
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'Authentication required',
    statusCode: 401
  },
  FORBIDDEN: {
    code: 'FORBIDDEN', 
    message: 'Insufficient permissions',
    statusCode: 403
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request data',
    statusCode: 400
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    message: 'Rate limit exceeded',
    statusCode: 429
  },
  INVALID_SIGNATURE: {
    code: 'INVALID_SIGNATURE',
    message: 'Invalid request signature',
    statusCode: 401
  },
  REQUEST_TOO_LARGE: {
    code: 'REQUEST_TOO_LARGE',
    message: 'Request payload too large',
    statusCode: 413
  },
  INTERNAL_ERROR: {
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
    statusCode: 500
  }
} as const

/**
 * Secure API handler wrapper
 */
export function withSecurity(
  handler: (request: NextRequest, context: ApiContext) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const ip = getRateLimitIdentifier(request)
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    try {
      // Create base context
      const context: ApiContext = {
        ip,
        userAgent,
        requestId,
        timestamp
      }

      // Check request size limit
      if (config.maxRequestSize) {
        const contentLength = parseInt(request.headers.get('content-length') || '0')
        if (contentLength > config.maxRequestSize) {
          return createErrorResponse(API_ERRORS.REQUEST_TOO_LARGE, context)
        }
      }

      // Apply rate limiting
      if (config.rateLimit !== false) {
        const rateLimitResponse = await withRateLimit(request)
        if (rateLimitResponse) {
          logSecurityEvent({
            type: 'rate_limit',
            severity: 'medium',
            ip,
            userAgent,
            timestamp,
            details: {
              endpoint: request.nextUrl.pathname,
              requestId
            }
          })
          return rateLimitResponse
        }
      }

      // Authentication check
      if (config.requireAuth !== false) {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!user || error) {
          logSecurityEvent({
            type: 'unauthorized_access',
            severity: 'medium',
            ip,
            userAgent,
            timestamp,
            details: {
              endpoint: request.nextUrl.pathname,
              requestId,
              reason: 'missing_or_invalid_auth'
            }
          })
          return createErrorResponse(API_ERRORS.UNAUTHORIZED, context)
        }

        context.user = user

        // Get user profile for role checking
        if (config.requiredRole) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, organization_id, site_id')
            .eq('id', user.id)
            .single()

          if (!profile || !config.requiredRole.includes(profile.role)) {
            logSecurityEvent({
              type: 'unauthorized_access',
              severity: 'high',
              ip,
              userAgent,
              timestamp,
              details: {
                endpoint: request.nextUrl.pathname,
                requestId,
                userId: user.id,
                userRole: profile?.role,
                requiredRoles: config.requiredRole,
                reason: 'insufficient_role_permissions'
              }
            })
            return createErrorResponse(API_ERRORS.FORBIDDEN, context)
          }

          context.profile = profile
        }
      }

      // Request signature validation
      if (config.requireSignature) {
        const isValidSignature = await validateRequestSignature(request)
        if (!isValidSignature) {
          logSecurityEvent({
            type: 'suspicious_activity',
            severity: 'high',
            ip,
            userAgent,
            timestamp,
            details: {
              endpoint: request.nextUrl.pathname,
              requestId,
              reason: 'invalid_request_signature'
            }
          })
          return createErrorResponse(API_ERRORS.INVALID_SIGNATURE, context)
        }
      }

      // Input validation
      if (config.validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.json()
          config.validateInput.parse(body)
        } catch (error) {
          logSecurityEvent({
            type: 'suspicious_activity',
            severity: 'low',
            ip,
            userAgent,
            timestamp,
            details: {
              endpoint: request.nextUrl.pathname,
              requestId,
              reason: 'input_validation_failed',
              validationError: error instanceof Error ? error.message : 'unknown'
            }
          })
          return createErrorResponse(API_ERRORS.VALIDATION_ERROR, context, {
            validationErrors: error instanceof z.ZodError ? error.errors : undefined
          })
        }
      }

      // Audit logging
      if (config.auditLog) {
        logSecurityEvent({
          type: 'suspicious_activity', // This would be a separate audit event type
          severity: 'low',
          ip,
          userAgent,
          timestamp,
          details: {
            endpoint: request.nextUrl.pathname,
            method: request.method,
            requestId,
            userId: context.user?.id,
            userRole: context.profile?.role,
            eventType: 'api_access'
          }
        })
      }

      // Execute the handler
      const response = await handler(request, context)
      
      // Add security headers and request ID
      const securityHeaders = getAPISecurityHeaders()
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      response.headers.set('X-Request-ID', requestId)

      return response

    } catch (error) {
      console.error('API wrapper error:', error)
      
      logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        ip,
        userAgent,
        timestamp,
        details: {
          endpoint: request.nextUrl.pathname,
          requestId,
          error: error instanceof Error ? error.message : 'unknown_error',
          eventType: 'api_error'
        }
      })

      return createErrorResponse(API_ERRORS.INTERNAL_ERROR, {
        ip,
        userAgent,
        requestId,
        timestamp
      })
    }
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(
  error: ApiError,
  context: ApiContext,
  details?: any
): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        requestId: context.requestId,
        timestamp: context.timestamp,
        ...(details && { details })
      }
    },
    { status: error.statusCode }
  )

  // Add security headers
  const securityHeaders = getAPISecurityHeaders()
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  response.headers.set('X-Request-ID', context.requestId)

  return response
}

/**
 * Validate request signature for sensitive operations
 */
async function validateRequestSignature(request: NextRequest): Promise<boolean> {
  const signature = request.headers.get('x-signature')
  const timestamp = request.headers.get('x-timestamp')
  const nonce = request.headers.get('x-nonce')
  
  if (!signature || !timestamp || !nonce) {
    return false
  }

  // Check timestamp is within acceptable window (5 minutes)
  const requestTime = parseInt(timestamp)
  const now = Date.now()
  const maxAge = 5 * 60 * 1000 // 5 minutes
  
  if (Math.abs(now - requestTime) > maxAge) {
    return false
  }

  try {
    // Get request body for signature verification
    const body = await request.text()
    const payload = `${request.method}:${request.nextUrl.pathname}:${body}:${timestamp}:${nonce}`
    
    // Calculate expected signature
    const secret = process.env.API_SIGNATURE_SECRET
    if (!secret) {
      console.warn('API_SIGNATURE_SECRET not configured')
      return false
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch (error) {
    console.error('Signature validation error:', error)
    return false
  }
}

/**
 * Input sanitization helpers
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .trim()
    .substring(0, 1000) // Limit length
}

export const sanitizeNumber = (input: any): number | null => {
  const num = parseFloat(input)
  return !isNaN(num) && isFinite(num) ? num : null
}

export const sanitizeBoolean = (input: any): boolean => {
  return Boolean(input && input !== 'false' && input !== '0')
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  pagination: z.object({
    page: z.number().min(1).max(1000).optional(),
    limit: z.number().min(1).max(100).optional(),
    offset: z.number().min(0).optional()
  }),
  
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  }),
  
  uuid: z.string().uuid(),
  
  email: z.string().email().max(255),
  
  password: z.string().min(8).max(128),
  
  fileUpload: z.object({
    filename: z.string().max(255),
    contentType: z.string().max(100),
    size: z.number().max(10 * 1024 * 1024) // 10MB limit
  })
}

/**
 * Rate limit aware wrapper (combines rate limiting with other security)
 */
export const withRateLimit = withSecurity