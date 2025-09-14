import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

interface PageProps {
  params: {
    id: string
  }
}

export default async function AdminEditDailyReportPage({ params }: PageProps) {
  const supabase = createClient()
  
  // Check authentication and admin role
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get the daily report
  const { data: report } = await supabase
    .from('daily_reports')
    .select(`
      *,
      sites(*)
    `)
    .eq('id', params.id)
    .single()

  if (!report) {
    redirect('/dashboard/admin/sites')
  }

  // Get all sites for admin
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('status', 'active')
    .order('name')

  // Get all workers
  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['worker', 'site_manager'])
    .order('full_name')

  // Get materials
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .order('name')

  // Get worker details
  const { data: workerDetails } = await supabase
    .from('worker_details')
    .select(`
      *,
      profiles(*)
    `)
    .eq('daily_report_id', params.id)

  // Get daily documents
  const { data: dailyDocuments } = await supabase
    .from('daily_documents')
    .select('*')
    .eq('daily_report_id', params.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin/sites"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>작업일지 관리로 돌아가기</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">작업일지 수정 (관리자)</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <DailyReportForm
          mode="edit"
          reportData={{
            ...report,
            worker_entries: workerDetails,
            receipts: dailyDocuments?.filter((doc: unknown) => doc.file_type === 'receipt'),
            additional_photos: dailyDocuments?.filter((doc: unknown) => doc.file_type === 'photo')
          }}
          sites={sites || []}
          currentUser={profile as any}
          materials={materials || []}
          workers={workers || []}
        />
      </div>
    </div>
  )
}
