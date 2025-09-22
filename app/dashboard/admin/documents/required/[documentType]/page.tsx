import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '필수 문서 상세 (준비 중)',
}

interface DocumentTypePageProps {
  params: {
    documentType: string
  }
}

export default async function RequiredDocumentTypePage({ params }: DocumentTypePageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`필수 문서 상세 – ${decodeURIComponent(params.documentType)}`}
        description="문서 유형별 상세 설정은 준비 중입니다."
      >
        <p>Phase 2에서 문서 유형별 필드와 승인 흐름을 재정의한 뒤 UI를 복원할 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
