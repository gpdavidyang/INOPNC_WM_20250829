import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Skip middleware for static assets and API routes
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
                path: '/',
                maxAge: name.includes('refresh') ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
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

    // If user is not signed in and tries to access protected route
    if (!user && !isPublicRoute) {
      response.cookies.delete('user-role')
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
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
        'system_admin': '/dashboard/admin',
        'admin': '/dashboard/admin',
        'customer_manager': '/partner/dashboard',
        'partner': '/partner/dashboard',
        'site_manager': '/mobile',
        'worker': '/mobile'
      }

      const redirectPath = roleRoutes[userRole] || '/dashboard/admin'
      return NextResponse.redirect(new URL(redirectPath, request.url))
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