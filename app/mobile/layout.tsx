import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'
import { mockProfile, mockSession } from '@/lib/dev-auth'
import { Toaster } from 'sonner'
import type { Session } from '@supabase/supabase-js'
import '@/modules/mobile/styles/mobile-global.css'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/notification-modal.css'

export const dynamic = 'force-dynamic'

interface MobileLayoutProps {
  children: ReactNode
}

export default async function MobileRootLayout({ children }: MobileLayoutProps) {
  let initialSession: Session | null = null
  let initialProfile: any | null = null

  const isDevBypass =
    process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true'

  if (isDevBypass) {
    console.warn('⚠️ [DEV] Using mock authentication data for mobile layout')
    initialSession = mockSession as Session
    initialProfile = mockProfile
  } else {
    const supabase = createClient()

    try {
      const auth = await getAuthForClient(supabase)

      if (!auth) {
        redirect('/auth/login')
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('[mobile layout] Failed to load Supabase session:', sessionError)
        redirect('/auth/login')
      }

      if (!session || !session.user) {
        redirect('/auth/login')
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name, email, site_id')
        .eq('id', auth.userId)
        .maybeSingle()

      if (profileError || !profile) {
        console.error('[mobile layout] Profile fetch error:', profileError)
        redirect('/auth/login')
      }

      const allowedMobileRoles = ['worker', 'site_manager', 'customer_manager', 'partner']
      if (!profile.role || !allowedMobileRoles.includes(profile.role)) {
        redirect(
          profile.role === 'admin' || profile.role === 'system_admin'
            ? '/dashboard/admin'
            : '/auth/login'
        )
      }

      initialSession = session
      initialProfile = profile
    } catch (error) {
      console.error('[mobile layout] Authentication bootstrap error:', error)
      redirect('/auth/login')
    }
  }

  return (
    <AuthProvider initialSession={initialSession} initialProfile={initialProfile}>
      {children}
      {/* Global toaster for all mobile pages (success/error feedback) */}
      <Toaster position="bottom-center" richColors />
    </AuthProvider>
  )
}
