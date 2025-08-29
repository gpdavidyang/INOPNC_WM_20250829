import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PartnerDashboard from '@/components/partner/PartnerDashboard'
import { getAuthenticatedUser } from '@/lib/auth/session'

export default async function PartnerDashboardPage() {
  const supabase = createClient()
  
  // Get authenticated user
  const user = await getAuthenticatedUser()
  
  if (!user) {
    console.error('No user in partner dashboard page - redirecting to login')
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    redirect('/auth/login')
  }

  // Verify user is a partner (customer_manager)
  if (profile?.role !== 'customer_manager') {
    console.log('User is not a partner, redirecting to appropriate dashboard')
    if (profile?.role === 'admin' || profile?.role === 'system_admin') {
      redirect('/dashboard/admin')
    } else {
      redirect('/dashboard')
    }
  }

  // Get partner's assigned sites from current assignments view
  const { data: siteAssignments } = await supabase
    .from('current_site_assignments')
    .select('*')
    .eq('user_id', user.id)
  
  // Transform the assignments to site format
  const sites = siteAssignments?.map(assignment => ({
    id: assignment.site_id,
    name: assignment.site_name,
    address: assignment.site_address,
    manager_name: assignment.manager_name,
    manager_phone: assignment.construction_manager_phone
  })) || []

  // Get partner's organization info
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  return (
    <PartnerDashboard 
      user={user} 
      profile={profile}
      sites={sites}
      organization={organization}
    />
  )
}