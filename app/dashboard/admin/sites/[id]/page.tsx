import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '현장 상세 (준비 중)',
}

interface SitePageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDetailPage({ params }: SitePageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`현장 상세 – ${params.id}`}
        description="현장 상세 정보 및 배치 현황 화면은 준비 중입니다."
      >
        <p>현장별 근무자, 문서, 장비 현황은 Phase 2의 API 작업 후 다시 제공할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
