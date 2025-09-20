import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check authentication
  const auth = await getAuthForClient(supabase)
  
  if (!auth) {
    redirect('/auth/login')
  }

  // Get user profile with role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', auth.userId)
    .single()

  // Only admin and system_admin can access
  if (!profile?.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>
}
