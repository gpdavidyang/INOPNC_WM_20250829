import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PerformanceDashboard } from '@/components/dashboard/performance-dashboard'

export default async function PerformancePage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user has admin permissions
  if (!profile?.role || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <PerformanceDashboard />
    </div>
  )
}