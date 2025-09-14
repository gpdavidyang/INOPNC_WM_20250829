
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = "force-dynamic"

export default async function AdminNewDailyReportPage() {
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
            <h1 className="text-2xl font-bold text-gray-900">새 작업일지 작성 (관리자)</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">새 작업일지 작성</h2>
          <p className="text-gray-600">작업일지 작성 폼이 여기에 표시됩니다.</p>
          <div className="mt-4 p-4 border border-gray-200 rounded">
            <p className="text-sm text-gray-500">사이트: {sites?.length || 0}개</p>
            <p className="text-sm text-gray-500">작업자: {workers?.length || 0}명</p>
            <p className="text-sm text-gray-500">자재: {materials?.length || 0}개</p>
          </div>
        </div>
      </div>
    </div>
  )
}
