import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UI_TRACK_COOKIE_MAX_AGE, UI_TRACK_COOKIE_NAME } from '@/lib/auth/constants'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import { createEdgeSupabaseClient } from '@/lib/supabase/edge'
import { getSupabaseEnv } from '@/lib/supabase/env'

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
    // CRITICAL SECURITY CHECK: Ensure auth bypass is NEVER active in production
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'
    ) {
      console.error('🚨 CRITICAL SECURITY ERROR: Dev auth bypass is enabled in production!')
      // Force authentication in production even if bypass is misconfigured
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS = 'false'
    }

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createEdgeSupabaseClient(request, response)

    let supabaseHost: string | null = null
    try {
      const { supabaseUrl } = getSupabaseEnv()
      supabaseHost = new URL(supabaseUrl).host
    } catch (error) {
      console.warn('[middleware] Failed to resolve Supabase host for CSP:', error)
    }

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

    // Development authentication bypass - ONLY for local development
    // CRITICAL: This should NEVER be enabled in production environments!
    const devBypassEnabled =
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true' &&
      request.url.includes('localhost')

    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some(cookie => cookie.name.startsWith('sb-') || cookie.name.endsWith('-auth-token'))

    if (devBypassEnabled && !hasSupabaseAuthCookie) {
      console.warn('⚠️ [DEV] Authentication bypassed for LOCAL development only:', pathname)
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

    // Use Ultra Simple Auth instead of complex Supabase session management
    const auth = await getAuthForClient(supabase)
    const user = auth?.userId || null

    if (auth?.uiTrack) {
      response.cookies.set({
        name: UI_TRACK_COOKIE_NAME,
        value: auth.uiTrack,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: UI_TRACK_COOKIE_MAX_AGE,
      })
    } else {
      response.cookies.delete(UI_TRACK_COOKIE_NAME)
    }

    // Production manager hard redirect to production mobile track (landing at production info)
    if (
      auth?.role === 'production_manager' &&
      pathname.startsWith('/mobile') &&
      !pathname.startsWith('/mobile/production')
    ) {
      const redirectResponse = NextResponse.redirect(
        new URL('/mobile/production/production', request.url)
      )
      redirectResponse.cookies.set({
        name: UI_TRACK_COOKIE_NAME,
        value: '/mobile/production/production',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: UI_TRACK_COOKIE_MAX_AGE,
      })
      return redirectResponse
    }

    // Public routes that don't require authentication
    const publicRoutes = [
      '/auth/login',
      '/auth/reset-password',
      '/auth/update-password',
      '/auth/signup-request',
      '/',
    ]
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

      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)

      const redirectResponse = NextResponse.redirect(redirectUrl)

      // Clear all auth-related cookies on unauthorized access
      redirectResponse.cookies.delete('user-role')
      redirectResponse.cookies.delete(UI_TRACK_COOKIE_NAME)
      redirectResponse.cookies.delete('sb-access-token')
      redirectResponse.cookies.delete('sb-refresh-token')

      // Add debug header to track redirect source
      redirectResponse.headers.set('X-Auth-Redirect-Source', 'middleware-unauthorized')

      return redirectResponse
    }

    // Add comprehensive security headers for protected pages
    if (!isPublicRoute && !isAuthRoute) {
      // Security headers (cache headers already applied above)
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

      // CSP for protected routes (more restrictive)
      const supabaseHttpOrigin = supabaseHost ? `https://${supabaseHost}` : ''
      const supabaseWsOrigin = supabaseHost ? `wss://${supabaseHost}` : ''

      const imgSources = ["'self'", 'data:', 'blob:']
      if (supabaseHttpOrigin) {
        imgSources.push(supabaseHttpOrigin)
      }

      const connectSources = ["'self'"]
      if (supabaseHttpOrigin) {
        connectSources.push(supabaseHttpOrigin)
      }
      if (supabaseWsOrigin) {
        connectSources.push(supabaseWsOrigin)
      }
      connectSources.push('wss://realtime.supabase.co')

      const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.daumcdn.net https://*.kakao.com http://*.daumcdn.net http://*.kakao.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        `img-src ${imgSources.join(' ')}`,
        `connect-src ${connectSources.join(' ')}`,
        "frame-src 'self' https://*.daumcdn.net https://*.kakao.com https://postcode.map.kakao.com https://postcode.map.daum.net http://*.daum.net http://*.kakao.com",
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
          userId: auth?.userId,
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
      // Use Ultra Simple Auth UI Track for routing
      const redirectPath = auth.uiTrack

      logAuthEvent('UI_TRACK_REDIRECT', {
        ip,
        userAgent,
        path: pathname,
        userId: auth.userId,
        uiTrack: auth.uiTrack,
        redirectPath,
        timestamp: new Date().toISOString(),
        isRestricted: auth.isRestricted,
        authType: 'authenticated_redirect',
      })

      // Add debug header for tracking
      const redirectResponse = NextResponse.redirect(new URL(redirectPath, request.url))
      redirectResponse.headers.set('X-Auth-Redirect-Source', 'middleware-ui-track')
      redirectResponse.headers.set('X-UI-Track', auth.uiTrack)
      redirectResponse.cookies.set({
        name: UI_TRACK_COOKIE_NAME,
        value: auth.uiTrack,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: UI_TRACK_COOKIE_MAX_AGE,
      })

      return redirectResponse
    }

    // PRIORITY 4 FIX: Enhanced successful access logging
    if (user && !isPublicRoute && !isAuthRoute) {
      logAuthEvent('AUTHENTICATED_ACCESS', {
        ip,
        userAgent,
        path: pathname,
        userId: auth?.userId,
        method: request.method,
        timestamp: new Date().toISOString(),
        userEmail: auth?.email,
        cacheBypass: !!response.headers.get('X-Cache-Bust'),
      })

      // Add debug headers for successful access
      response.headers.set('X-Auth-Status', 'authenticated')
      response.headers.set('X-User-Id', auth?.userId || '')
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
