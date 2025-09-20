import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '정산 문서 (준비 중)',
}

export default async function AdminInvoiceDocumentsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="정산/세금 계산서 관리"
        description="정산 문서 업로드 및 검토 기능은 현재 리팩토링 중입니다."
      >
        <p>재무팀 요구사항에 맞춘 신규 플로우는 Phase 2 일정에 맞춰 제공될 예정입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
