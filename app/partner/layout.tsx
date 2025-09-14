import PartnerDashboardLayout from '@/components/partner/PartnerDashboardLayout'

export const dynamic = 'force-dynamic'

export default async function PartnerLayout({
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

  // Get user profile and verify customer_manager role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*, partner_companies(*)')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  // Only customer_manager role can access partner routes
  if (profile.role !== 'customer_manager') {
    // Redirect to appropriate dashboard based on role
    if (profile.role === 'admin' || profile.role === 'system_admin') {
      redirect('/dashboard/admin')
    } else {
      redirect('/dashboard')
    }
  }

  // Verify partner_company_id exists
  if (!profile.partner_company_id) {
    console.error('Customer manager without partner_company_id:', profile.id)
    redirect('/dashboard')
  }

  return (
    <PartnerDashboardLayout profile={profile}>
      {children}
    </PartnerDashboardLayout>
  )
}