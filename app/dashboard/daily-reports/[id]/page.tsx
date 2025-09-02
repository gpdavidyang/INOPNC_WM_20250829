import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getDailyReportById } from '@/app/actions/daily-reports'
import DailyReportDetail from '@/components/daily-reports/daily-report-detail-new'
import DailyReportDetailMobile from '@/components/daily-reports/DailyReportDetailMobile-new'
import Sidebar from '@/components/dashboard/sidebar'
import Header from '@/components/dashboard/header'
import { BottomNavigation, BottomNavItem } from '@/components/ui/bottom-navigation'
import { NavigationController } from '@/components/navigation/navigation-controller'
import { Home, Calendar, FileText, FolderOpen, MapPin } from 'lucide-react'

export default async function DailyReportDetailPage({
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

  // TODO: Implement proper access control when organization relationships are set up
  // For now, allow access to all authenticated users
  const hasAccess = true
  // report.site?.organization_id === profile.organization_id ||
  // profile.site_id === report.site_id ||
  // ['admin', 'system_admin'].includes(profile.role)

  if (!hasAccess) {
    redirect('/dashboard/daily-reports')
  }

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
      {/* Mobile View - UI Guidelines 최적화 */}
      <div className="lg:hidden">
        {/* Header 섹션 추가 */}
        <Header />
        <DailyReportDetailMobile
          report={report as any}
          currentUser={profile as any}
        />
        <BottomNavigation items={bottomNavItems} />
      </div>

      {/* Desktop View - 기존 레이아웃 유지 */}
      <div className="hidden lg:block min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Desktop Sidebar */}
        <div className="fixed inset-y-0 flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">INOPNC</h1>
              </div>
              <nav className="mt-8 flex-1 space-y-1 px-2">
                <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  홈
                </a>
                <a href="/dashboard/attendance" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  출근현황
                </a>
                <a href="/dashboard/daily-reports" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  작업일지
                </a>
                <a href="/dashboard/site-info" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  현장정보
                </a>
                <a href="/dashboard/documents" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group flex items-center px-2 py-2 text-sm font-medium rounded-md">
                  문서함
                </a>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="ml-64">
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <DailyReportDetail
                report={report as any}
                currentUser={profile as any}
              />
            </div>
          </main>
        </div>
      </div>
    </>
    </NavigationController>
  )
}