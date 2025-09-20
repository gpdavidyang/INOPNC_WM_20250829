import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '사용자 상세 (준비 중)',
}

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export default async function AdminUserDetailPage({ params }: UserDetailPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`사용자 상세 – ${params.id}`}
        description="사용자 상세 프로필 및 권한 설정은 준비 중입니다."
      >
        <p>사용자별 사이트 배정·문서 권한 관리 기능은 Phase 2에서 API와 함께 다시 제공됩니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
