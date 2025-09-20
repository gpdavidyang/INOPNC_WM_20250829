import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '현장 문서 (준비 중)',
}

interface SiteDocumentsPageProps {
  params: {
    id: string
  }
}

export default async function AdminSiteDocumentsPage({ params }: SiteDocumentsPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`현장 문서 관리 – ${params.id}`}
        description="현장별 문서함은 재구성 중입니다."
      >
        <p>현장 문서 열람/승인 흐름은 Phase 2 일정에서 다루게 됩니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
