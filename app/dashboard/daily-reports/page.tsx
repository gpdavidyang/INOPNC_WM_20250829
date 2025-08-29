import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DailyReportListMobile } from '@/components/daily-reports/DailyReportListMobile'
import { DailyReportListEnhanced } from '@/components/daily-reports/DailyReportListEnhanced'
import { Skeleton } from '@/components/ui/skeleton'
import { LoadingState } from '@/components/dashboard/page-layout'
import { ReportsPageHeader } from '@/components/ui/page-header'
import { DailyReportsPageClient } from '@/components/daily-reports/daily-reports-page-client'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

export default async function DailyReportsPage() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
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

  // Get sites - simplified since organization relationships aren't set up
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  console.log('DailyReportsPage - sites query result:', { sites, sitesError })

  // Check if user can create reports
  const canCreateReport = profile?.role && ['worker', 'site_manager', 'admin'].includes(profile.role)
  
  return (
    <DailyReportsPageClient 
      profile={profile as any}
      sites={sites || []}
    />
  )
}