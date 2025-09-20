import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { AdminPlaceholder } from '@/components/admin/AdminPlaceholder'

export const metadata: Metadata = {
  title: '작업 옵션 관리 (준비 중)',
}

export default async function WorkOptionsPage() {
  await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <AdminPlaceholder
        title="작업 옵션 관리"
        description="부재명/작업공정 등 작업 옵션 설정 화면은 리팩토링 중입니다."
      >
        <p>작업일지 구조 정비 후 새로운 옵션 관리 UI를 제공할 계획입니다.</p>
      </AdminPlaceholder>
    </div>
  )
}
