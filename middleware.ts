import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Authentication event logging utility
function logAuthEvent(event: string, details: Record<string, any> = {}) {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    event,
    ip: details.ip || 'unknown',
    userAgent: details.userAgent || 'unknown',
    path: details.path || 'unknown',
    userId: details.userId || null,
    ...details,
  }

  // In production, this would go to a proper logging service
  console.log('[AUTH_EVENT]', JSON.stringify(logData))
}

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Extract request metadata for logging
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const pathname = request.nextUrl.pathname

    // Skip middleware for static assets and API routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/auth/callback') ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icons/') ||
      pathname.startsWith('/manifest') ||
      pathname.includes('.') || // static files
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml'
    ) {
      return response
    }

    // PRIORITY 1 FIX: Apply aggressive cache prevention to ALL pages FIRST
    // This prevents browser/CDN from serving cached protected content before auth checks
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    response.headers.set('CDN-Cache-Control', 'no-store')
    response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store')
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store')

    // Add timestamp header to ensure unique responses
    response.headers.set('X-Cache-Bust', Date.now().toString())

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Enhanced cookie options for production compatibility
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production' || request.url.startsWith('https'),
                httpOnly: false, // Must be false for client-side access
                path: '/',
                // Set proper max-age for different cookie types
                maxAge: name.includes('refresh')
                  ? 60 * 60 * 24 * 30 // 30 days for refresh tokens
                  : name.includes('-auth-token')
                    ? 60 * 60 * 24 * 7 // 7 days for auth tokens
                    : 60 * 60 * 24, // 1 day for access tokens
                // In production, ensure domain is not set to allow cookie to work across subdomains
                domain: undefined,
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    const user = session?.user || null

    // Clear invalid cookies
    if (sessionError || (session && !session.user)) {
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      response.cookies.delete('user-role')
    }

    // Public routes that don't require authentication
    const publicRoutes = ['/auth/login', '/auth/reset-password', '/']
    const isPublicRoute = publicRoutes.includes(pathname)

    // Auth routes
    const isAuthRoute = pathname.startsWith('/auth/')

    // PRIORITY 4 FIX: Enhanced authentication debugging
    if (!user && !isPublicRoute) {
      logAuthEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
        ip,
        userAgent,
        path: pathname,
        reason: 'No valid session',
        timestamp: new Date().toISOString(),
        cacheHeaders: {
          cacheControl: request.headers.get('cache-control'),
          pragma: request.headers.get('pragma'),
          ifNoneMatch: request.headers.get('if-none-match'),
        },
        hasAuthCookies: !!(
          request.cookies.get('sb-access-token') || request.cookies.get('sb-refresh-token')
        ),
        requestType: request.method,
      })

      // Clear all auth-related cookies on unauthorized access
      response.cookies.delete('user-role')
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')

      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)

      // Add debug header to track redirect source
      response.headers.set('X-Auth-Redirect-Source', 'middleware-unauthorized')

      return NextResponse.redirect(redirectUrl)
    }

    // Add comprehensive security headers for protected pages
    if (!isPublicRoute && !isAuthRoute) {
      // Security headers (cache headers already applied above)
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // CSP for protected routes (more restrictive)
      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://yjtnpscnnsnvfsyvajku.supabase.co",
        "connect-src 'self' https://yjtnpscnnsnvfsyvajku.supabase.co wss://realtime.supabase.co",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; ')

      response.headers.set('Content-Security-Policy', csp)

      // Strict Transport Security (only for HTTPS)
      if (request.url.startsWith('https://')) {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
    }

    // Add basic security headers for all routes
    response.headers.set('X-DNS-Prefetch-Control', 'off')
    response.headers.set('X-Download-Options', 'noopen')
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

    // Basic CSRF protection for state-changing requests
    if (user && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const origin = request.headers.get('origin')
      const referer = request.headers.get('referer')
      const host = request.headers.get('host')

      // Check that requests come from the same origin
      const allowedOrigins = [
        `https://${host}`,
        `http://${host}`,
        process.env.NEXT_PUBLIC_SITE_URL,
      ].filter(Boolean)

      const isValidOrigin = origin && allowedOrigins.some(allowed => origin === allowed)
      const isValidReferer = referer && allowedOrigins.some(allowed => referer.startsWith(allowed))

      if (!isValidOrigin && !isValidReferer) {
        logAuthEvent('CSRF_ATTACK_DETECTED', {
          ip,
          userAgent,
          path: pathname,
          userId: user.id,
          origin,
          referer,
          host,
          method: request.method,
        })

        return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 })
      }
    }

    // If user is signed in and tries to access auth pages, redirect to appropriate dashboard
    if (user && isAuthRoute) {
      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const userRole = profile?.role || 'worker'

      // Role-based routing
      const roleRoutes: Record<string, string> = {
        system_admin: '/dashboard/admin',
        admin: '/dashboard/admin',
        customer_manager: '/partner/dashboard',
        partner: '/partner/dashboard',
        site_manager: '/mobile',
        worker: '/mobile',
      }

      const redirectPath = roleRoutes[userRole] || '/dashboard/admin'

      logAuthEvent('ROLE_BASED_REDIRECT', {
        ip,
        userAgent,
        path: pathname,
        userId: user.id,
        userRole,
        redirectPath,
        timestamp: new Date().toISOString(),
        sessionExpiry: session?.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        authType: 'authenticated_redirect',
      })

      // Add debug header for tracking
      const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url))
      redirectResponse.headers.set('X-Auth-Redirect-Source', 'middleware-role-based')
      redirectResponse.headers.set('X-User-Role', userRole)

      return redirectResponse
    }

    // PRIORITY 4 FIX: Enhanced successful access logging
    if (user && !isPublicRoute && !isAuthRoute) {
      logAuthEvent('AUTHENTICATED_ACCESS', {
        ip,
        userAgent,
        path: pathname,
        userId: user.id,
        method: request.method,
        timestamp: new Date().toISOString(),
        sessionExpiry: session?.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        userEmail: user.email,
        isSessionFresh: session?.expires_at
          ? session.expires_at * 1000 - Date.now() > 3600000
          : false, // Fresh if >1h remaining
        cacheBypass: !!response.headers.get('X-Cache-Bust'),
      })

      // Add debug headers for successful access
      response.headers.set('X-Auth-Status', 'authenticated')
      response.headers.set('X-User-Id', user.id)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
