import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AnalyticsDashboard from '@/components/admin/analytics/AnalyticsDashboard'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '분석 대시보드',
}

export default async function AnalyticsPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="분석 대시보드"
        description="핵심 지표와 추이를 확인합니다"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '분석' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
