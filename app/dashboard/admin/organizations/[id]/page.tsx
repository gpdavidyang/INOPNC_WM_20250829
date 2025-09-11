import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrganizationDetailPage from '@/components/admin/organizations/OrganizationDetailPage'

interface PageProps {
  params: { id: string }
}

export default async function OrganizationDetailRoute({ params }: PageProps) {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  // Fetch organization data
  const { data: organization, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !organization) {
    redirect('/dashboard/admin/organizations')
  }

  return <OrganizationDetailPage organization={organization} />
}