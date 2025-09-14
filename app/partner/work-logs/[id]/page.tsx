import { getAuthenticatedUser } from "@/lib/auth/server"
import { createClient } from "@/lib/supabase/server"
import PartnerWorkLogDetailPage from '@/components/partner/PartnerWorkLogDetailPage'

interface PartnerWorkLogDetailPageProps {
  params: {
    id: string
  }
}

export default async function PartnerWorkLogDetail({ params }: PartnerWorkLogDetailPageProps) {
  const supabase = createClient()
  
  // Get authenticated user
  const user = await getAuthenticatedUser()
  
  if (!user) {
    console.error('No user in partner work log detail page - redirecting to login')
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

  // Get partner's assigned sites
  const { data: siteAssignments } = await supabase
    .from('current_site_assignments')
    .select('*')
    .eq('user_id', user.id)
  
  const sites = siteAssignments?.map(assignment => ({
    id: assignment.site_id,
    name: assignment.site_name,
    address: assignment.site_address,
    manager_name: assignment.manager_name,
    manager_phone: assignment.construction_manager_phone
  })) || []

  return (
    <PartnerWorkLogDetailPage 
      user={user} 
      profile={profile}
      sites={sites}
      workLogId={params.id}
    />
  )
}