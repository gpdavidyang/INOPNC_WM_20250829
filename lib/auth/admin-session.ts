'use server'

import { createClient } from '@/lib/supabase/server'

export async function requireAdminSession(_request?: Request) {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData?.user
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isAdmin = ['admin', 'system_admin'].includes((profile?.role || '').toLowerCase())

  return {
    userId: user.id,
    email: user.email || null,
    isAdmin,
  }
}
