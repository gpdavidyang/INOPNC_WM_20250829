import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '마크업 문서 상세 (준비 중)',
}

interface MarkupDocumentPageProps {
  params: {
    id: string
  }
}

export default async function AdminMarkupDocumentDetailPage({ params }: MarkupDocumentPageProps) {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title={`마크업 문서 상세 – ${params.id}`}
        description="문서 주석 보기/편집 기능은 준비 중입니다."
      >
        <p>파일 뷰어와 버전 기록 UI는 Phase 2에서 Supabase 스토리지와 연동 후 재작업 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
