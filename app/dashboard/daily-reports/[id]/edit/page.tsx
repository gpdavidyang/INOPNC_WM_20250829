import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getDailyReportById } from '@/app/actions/daily-reports'
import DailyReportForm from '@/components/daily-reports/daily-report-form'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

export default async function EditDailyReportPage({
  params
}: {
  params: { id: string }
}) {
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

  // Get daily report with all related data
  const result = await getDailyReportById(params.id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const report = result.data

  // Check if user can edit this report
  const canEdit = 
    report.created_by === user.id &&
    report.status === 'draft'

  if (!canEdit) {
    redirect(`/dashboard/daily-reports/${params.id}`)
  }

  // Get sites data for the form
  let sites, sitesError
  
  try {
    // First try with regular client
    const regularResult = await supabase
      .from('sites')
      .select('*')
      .eq('status', 'active')
      .order('name')
    
    if (regularResult.data && regularResult.data.length > 0) {
      sites = regularResult.data
      sitesError = regularResult.error
    } else {
      // Fallback to service role
      const serviceSupabase = require('@supabase/supabase-js').createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      
      const serviceResult = await serviceSupabase
        .from('sites')
        .select('*')
        .eq('status', 'active')
        .order('name')
      
      sites = serviceResult.data
      sitesError = serviceResult.error
    }
  } catch (error) {
    console.error('Error fetching sites:', error)
    sites = []
    sitesError = error
  }

  // Get materials and workers (simplified for now)
  const materials: unknown[] = []
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .eq('status', 'active')
    .order('full_name')

  // Bottom navigation items
  const bottomNavItems: BottomNavItem[] = [
    { 
      label: "빠른화면", 
      href: "/dashboard", 
      icon: <Home /> 
    },
    { 
      label: "출력정보", 
      href: "/dashboard/attendance", 
      icon: <Calendar /> 
    },
    { 
      label: "작업일지", 
      href: "/dashboard/daily-reports", 
      icon: <FileText />, 
      badge: 3
    },
    { 
      label: "현장정보", 
      href: "/dashboard/site-info", 
      icon: <MapPin /> 
    },
    { 
      label: "문서함", 
      href: "/dashboard/documents", 
      icon: <FolderOpen /> 
    }
  ]

  return (
    <NavigationController>
    <>
      {/* Mobile View */}
      <div className="lg:hidden">
        <Header />
        <div className="pb-16">
          <DailyReportForm
            mode="edit"
            reportData={report as any}
            currentUser={profile as any}
            sites={sites || []}
            materials={materials || []}
            workers={workers as any || []}
          />
        </div>
        <BottomNavigation items={bottomNavItems} />
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <Header />
        <main className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <DailyReportForm
              mode="edit"
              reportData={report as any}
              currentUser={profile as any}
              sites={sites || []}
              materials={materials || []}
              workers={workers as any || []}
            />
          </div>
        </main>
      </div>
    </>
    </NavigationController>
  )
}