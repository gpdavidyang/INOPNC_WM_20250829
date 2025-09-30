import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'
import { AuthProvider } from '@/modules/mobile/providers/AuthProvider'
import type { Session } from '@supabase/supabase-js'
import '@/modules/mobile/styles/mobile-global.css'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/notification-modal.css'
import '@/modules/mobile/styles/partner.css'

export const dynamic = 'force-dynamic'

interface PartnerMobileLayoutProps {
  children: ReactNode
}

export default async function PartnerMobileRootLayout({ children }: PartnerMobileLayoutProps) {
  const supabase = createClient()

  const auth = await getAuthForClient(supabase)
  if (!auth) {
    redirect('/auth/login')
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session || !session.user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email, site_id, organization_id')
    .eq('id', auth.userId)
    .maybeSingle()

  // Restrict to partner roles only
  const partnerRoles = ['customer_manager', 'partner']
  if (!profile || !profile.role || !partnerRoles.includes(profile.role)) {
    redirect('/mobile')
  }

  return (
    <AuthProvider initialSession={session as Session} initialProfile={profile}>
      {children}
    </AuthProvider>
  )
}
