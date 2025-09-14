import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: '알림 테스트 | INOPNC 작업일지 관리',
  description: '알림 시스템 테스트',
}

export default async function TestNotificationsRoute() {
  const supabase = createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <TestNotificationsPage />
}