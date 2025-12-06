/**
 * Security Headers Middleware for Production
 *
 * Implements comprehensive security headers following OWASP recommendations:
 * - Content Security Policy (CSP)
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - X-XSS-Protection
 * - Referrer Policy
 * - Permissions Policy
 */

// CSP directives for construction management application
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js in development
    "'unsafe-eval'", // Required for development tools
    'https://js.sentry-cdn.com', // Sentry error monitoring
    'https://cdn.jsdelivr.net', // CDN for libraries
    'https://unpkg.com', // CDN for libraries
    'https://*.daumcdn.net', // Kakao postcode
    'https://*.kakao.com', // Kakao postcode
    'http://*.daumcdn.net',
    'http://*.kakao.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:', // For base64 encoded fonts
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'blob:', // For generated images
    'https:', // Allow HTTPS images
    'https://*.supabase.co', // Supabase storage
    'https://*.supabase.com', // Supabase storage
  ],
  'media-src': ["'self'", 'blob:', 'https://*.supabase.co', 'https://*.supabase.com'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co', // Supabase API
    'https://*.supabase.com', // Supabase API
    'https://api.sentry.io', // Sentry error reporting
    'wss://*.supabase.co', // Supabase realtime
    'https://*.anthropic.com', // AI API
    'https://*.perplexity.ai', // Research API
    'data:', // Allow fetch to base64/data URIs (used by photo grid preview)
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"], // Prevent embedding in frames
  'frame-src': [
    "'self'",
    'https://*.daumcdn.net',
    'https://*.kakao.com',
    'https://postcode.map.kakao.com',
    'https://postcode.map.daum.net',
    'http://*.daum.net',
    'http://*.kakao.com',
  ],
  'worker-src': [
    "'self'",
    'blob:', // For service workers
  ],
  'manifest-src': ["'self'"],
  'upgrade-insecure-requests': [],
}

// Development CSP (more permissive)
const CSP_DIRECTIVES_DEV = {
  ...CSP_DIRECTIVES,
  'script-src': [
    ...CSP_DIRECTIVES['script-src'],
    "'unsafe-eval'", // Required for development
    'http://localhost:*', // Development server
    'ws://localhost:*', // Hot reload
  ],
  'connect-src': [
    ...CSP_DIRECTIVES['connect-src'],
    'http://localhost:*', // Development API
    'ws://localhost:*', // Hot reload
    'wss://localhost:*', // Development websockets
  ],
}

/**
 * Generate CSP header value from directives
 */
function generateCSP(directives: typeof CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

/**
 * Get security headers for different environments
 */
export function getSecurityHeaders(isDevelopment = false): Record<string, string> {
  const isProduction = !isDevelopment

  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': generateCSP(isDevelopment ? CSP_DIRECTIVES_DEV : CSP_DIRECTIVES),

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',

    // XSS Protection (legacy browsers)
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Prevent DNS prefetching
    'X-DNS-Prefetch-Control': 'off',

    // Disable client-side caching of sensitive pages
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store',
  }

  // Production-only headers
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  // Permissions Policy (Feature Policy)
  headers['Permissions-Policy'] = [
    'camera=self', // Allow camera for file uploads
    'microphone=self', // Allow microphone for voice features
    'geolocation=self', // Allow location for site tracking
    'notifications=self', // Allow notifications
    'payment=self', // Allow payment processing
    'accelerometer=()', // Disable accelerometer
    'autoplay=()', // Disable autoplay
    'encrypted-media=()', // Disable encrypted media
    'fullscreen=()', // Disable fullscreen
    'gyroscope=()', // Disable gyroscope
    'magnetometer=()', // Disable magnetometer
    'midi=()', // Disable MIDI
    'sync-xhr=()', // Disable synchronous XHR
    'usb=()', // Disable USB
    'xr-spatial-tracking=()', // Disable AR/VR
  ].join(', ')

  return headers
}

/**
 * Apply security headers to NextResponse
 */
export function applySecurityHeaders(response: NextResponse, isDevelopment = false): NextResponse {
  const headers = getSecurityHeaders(isDevelopment)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

/**
 * Create security headers middleware
 */
export function createSecurityHeadersMiddleware(isDevelopment = false) {
  return (request: NextRequest) => {
    const response = NextResponse.next()
    return applySecurityHeaders(response, isDevelopment)
  }
}

/**
 * Security headers for API routes
 */
export function getAPISecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
  }
}

/**
 * CORS configuration for production
 */
export const CORS_CONFIG = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://your-production-domain.com', 'https://www.your-production-domain.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'X-Request-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  maxAge: 86400, // 24 hours
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(response: NextResponse, origin?: string): NextResponse {
  const {
    origin: allowedOrigins,
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
  } = CORS_CONFIG

  // Check if origin is allowed
  if (origin && Array.isArray(allowedOrigins)) {
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  } else if (typeof allowedOrigins === 'string') {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins)
  }

  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', maxAge.toString())

  return response
}

/**
 * Handle CORS preflight requests
 */
export function handleCORSPreflight(request: NextRequest): Response | null {
  if (request.method === 'OPTIONS') {
    const response = new Response(null, { status: 200 })
    const origin = request.headers.get('origin')

    return applyCORSHeaders(NextResponse.json(null), origin)
  }

  return null
}

/**
 * Security event logging
 */
export interface SecurityEvent {
  type: 'csp_violation' | 'rate_limit' | 'unauthorized_access' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  userAgent: string
  timestamp: string
  details: Record<string, unknown>
}

export function logSecurityEvent(event: SecurityEvent): void {
  // In production, this would send to a proper logging service
  console.warn('SECURITY EVENT:', event)

  // Send to Sentry or other monitoring service
  if (typeof window !== 'undefined' && (window as unknown).Sentry) {
    ;(window as unknown).Sentry.captureMessage(`Security Event: ${event.type}`, {
      level: event.severity,
      extra: event,
    })
  }
}

/**
 * CSP violation reporting endpoint handler
 */
export function handleCSPViolation(request: NextRequest): Response {
  try {
    const violation = request.body

    logSecurityEvent({
      type: 'csp_violation',
      severity: 'medium',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      details: { violation },
    })

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('CSP violation report error:', error)
    return new Response('Error', { status: 500 })
  }
}
