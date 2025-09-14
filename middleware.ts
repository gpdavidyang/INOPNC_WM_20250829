import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    // Create response object first
    let response = NextResponse.next({
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
      pathname === '/sitemap.xml' ||
      pathname === '/' // CRITICAL: Skip middleware for home page to prevent loops
    ) {
      return response
    }

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
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: false,
                path: '/',
                // CRITICAL FIX: Set proper max-age for refresh tokens
                maxAge: name.includes('refresh') ? 60 * 60 * 24 * 30 : (options?.maxAge || 60 * 60 * 24) // 30 days for refresh, 1 day for others
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // CRITICAL FIX: Simplified auth check to prevent infinite loops
    // Only get session once and trust its user data
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    const user = session?.user || null
    
    // If session error or invalid session, clear cookies
    if (sessionError || (session && !session.user)) {
      // Clear potentially invalid cookies
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      response.cookies.delete('user-role')
    }

    // Public routes that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/signup-request', '/auth/reset-password', '/auth/update-password']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // Demo pages that are accessible regardless of auth status
    const demoPaths = ['/mobile-demo', '/components', '/test-photo-grid', '/api-test']
    const isDemoPath = demoPaths.some(path => pathname.startsWith(path))
    
    // Partner routes (customer_manager only)
    const partnerPaths = ['/partner']
    const isPartnerPath = partnerPaths.some(path => pathname.startsWith(path))

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
    if (user && isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
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