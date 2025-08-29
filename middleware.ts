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
      pathname === '/sitemap.xml'
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
                path: '/'
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Optimize auth check - try session first, then verify user if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    let user = session?.user || null
    
    // Verify user for critical paths - required for critical test compliance
    if (session && !sessionError) {
      try {
        const { data: { user: verifiedUser } } = await supabase.auth.getUser()
        user = verifiedUser
      } catch (userError) {
        // If getUser fails, try refresh
        try {
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()
          if (refreshedSession) {
            user = refreshedSession.user
          }
        } catch (refreshError) {
          // If refresh fails, clear session
          user = null
        }
      }
    }

    // Public routes that don't require authentication
    const publicPaths = ['/auth/login', '/auth/signup', '/auth/signup-request', '/auth/reset-password', '/auth/update-password']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    // Demo pages that are accessible regardless of auth status
    const demoPaths = ['/mobile-demo', '/components']
    const isDemoPath = demoPaths.some(path => pathname.startsWith(path))

    // Debug logging - only log important events, not every request
    if (sessionError || (!user && !isPublicPath && !isDemoPath)) {
      console.log('Middleware auth issue:', {
        pathname,
        hasUser: !!user,
        isPublicPath,
        isDemoPath,
        error: sessionError?.message,
        cookies: request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })),
        sessionExists: !!session,
        userExists: !!user
      })
    }
    
    // Skip auth check for demo pages
    if (isDemoPath) {
      return response
    }

    // If user is not signed in and tries to access protected route
    if (!user && !isPublicPath) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is signed in and tries to access auth pages
    if (user && isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
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