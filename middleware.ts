import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { AuthCircuitBreaker } from './lib/auth/circuit-breaker'
import { getRoleBasedRoute, isPublicRoute, isAuthRoute, AUTH_ROUTES } from './lib/auth/routing'
import { EnvConfig } from './lib/config/env'

export async function middleware(request: NextRequest) {
  try {
    // Create response object first
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Skip middleware for static assets, API routes, and auth callback
    // 성능 최적화: 더 많은 정적 자원에 대해 미들웨어 건너뛰기
    const pathname = request.nextUrl.pathname
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
      // REMOVED: Home page and mobile skipping to fix infinite loops
    ) {
      return response
    }

    // Use centralized environment configuration
    const supabase = createServerClient(EnvConfig.supabaseUrl, EnvConfig.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: false,
              path: '/',
              // CRITICAL FIX: Set proper max-age for refresh tokens
              maxAge: name.includes('refresh') ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days for refresh, 1 day for others
            }
            response.cookies.set(name, value, cookieOptions)
          })
        },
      },
    })

    // CRITICAL FIX: Simplified auth check to prevent infinite loops
    // Only get session once and trust its user data
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const user = session?.user || null

    // If session error or invalid session, clear cookies
    if (sessionError || (session && !session.user)) {
      // Clear potentially invalid cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      response.cookies.delete('user-role')
    }

    // Use centralized routing logic
    const isPublicPath = isPublicRoute(pathname)
    const isAuthPath = isAuthRoute(pathname)

    // Demo pages that are accessible regardless of auth status
    const demoPaths = ['/mobile-demo', '/components', '/test-photo-grid', '/api-test']
    const isDemoPath = demoPaths.some(path => pathname.startsWith(path))

    // Debug logging - disabled for performance
    // Uncomment only when debugging auth issues
    // if (process.env.NODE_ENV === 'development' && (sessionError || (!user && !isPublicPath && !isDemoPath))) {
    //   console.log('Middleware auth issue:', {
    //     pathname,
    //     hasUser: !!user,
    //     isPublicPath,
    //     isDemoPath,
    //     error: sessionError?.message,
    //     sessionExists: !!session,
    //     userExists: !!user
    //   })
    // }

    // Skip auth check for demo pages
    if (isDemoPath) {
      return response
    }

    // If user is not signed in and tries to access protected route
    if (!user && !isPublicPath) {
      // Clear role cookie if user is not authenticated
      response.cookies.delete('user-role')
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and tries to access auth pages
    if (user && isAuthPath) {
      // Get user role from session metadata
      const userRole = (user as any).role || (user.user_metadata as any)?.role || null
      const redirectPath = getRoleBasedRoute(userRole)

      // Check circuit breaker before redirecting
      if (!AuthCircuitBreaker.checkRedirect(redirectPath)) {
        console.error('[Middleware] Circuit breaker triggered - preventing redirect loop')
        // Return error page instead of redirecting
        return new NextResponse(
          `
          <!DOCTYPE html>
          <html>
            <head>
              <title>Redirect Loop Detected</title>
              <style>
                body { font-family: system-ui; padding: 2rem; max-width: 600px; margin: 0 auto; }
                .error { background: #fee; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
                button { background: #000; color: #fff; padding: 0.5rem 1rem; border: none; border-radius: 0.25rem; cursor: pointer; }
              </style>
            </head>
            <body>
              <h1>🔄 Redirect Loop Detected</h1>
              <div class="error">
                <p>The system detected too many redirects. This is a safety mechanism to prevent infinite loops.</p>
                <p>Current role: ${userRole || 'unknown'}</p>
                <p>Attempted redirect: ${redirectPath}</p>
              </div>
              <button onclick="sessionStorage.clear(); localStorage.clear(); window.location.href='/auth/login'">
                Clear Session and Login Again
              </button>
            </body>
          </html>
          `,
          {
            status: 508, // Loop Detected
            headers: { 'content-type': 'text/html' },
          }
        )
      }

      return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Skip role verification in middleware to avoid RLS issues
    // Role checking will be handled in components after authentication

    return response
  } catch (error) {
    // Middleware errors - only log critical errors
    // if (process.env.NODE_ENV === 'development') {
    //   console.error('Middleware error:', error)
    // }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
