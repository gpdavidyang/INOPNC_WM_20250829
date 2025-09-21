import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string
  role: string | null
  [key: string]: unknown
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle<ProfileRow>()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  if (!['admin', 'system_admin'].includes(profile.role ?? '')) {
    redirect('/dashboard')
  }

  return <AdminDashboardLayout profile={profile}>{children}</AdminDashboardLayout>
}
