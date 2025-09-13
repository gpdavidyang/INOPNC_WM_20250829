import { Suspense } from 'react'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BusinessAnalyticsDashboard } from '@/components/dashboard/business-analytics-dashboard'

export const metadata: Metadata = {
  title: '비즈니스 분석 | INOPNC 현장관리시스템',
  description: '건설 현장 비즈니스 데이터 분석 및 인사이트',
}

async function getInitialData() {
  const supabase = createClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id, site_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  // Check if user has access to analytics
  if (!profile?.role || !['admin', 'system_admin', 'site_manager'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return { user, profile }
}

export default async function AnalyticsPage() {
  const { user, profile } = await getInitialData()

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">비즈니스 분석</h1>
        <p className="text-gray-600 mt-2">
          건설 현장의 핵심 지표와 트렌드를 분석하여 의사결정을 지원합니다
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      }>
        <BusinessAnalyticsDashboard user={{id: user.id, email: user.email || ''}} profile={profile} />
      </Suspense>
    </div>
  )
}