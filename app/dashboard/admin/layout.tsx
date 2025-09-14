import { createClient } from "@/lib/supabase/server"
import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  // Get user profile with role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only admin and system_admin can access
  if (!profile?.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>
}