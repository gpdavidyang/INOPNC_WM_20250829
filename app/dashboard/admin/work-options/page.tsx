import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import WorkOptionsEditor from '@/components/admin/work-options/WorkOptionsEditor'

export const metadata: Metadata = {
  title: '작업 옵션 관리',
}

export default async function WorkOptionsPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="작업 옵션 관리"
        description="부재명/작업공정 옵션 관리"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '작업 옵션' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 간단한 인라인 관리 컴포넌트 */}
        <WorkOptionsEditor />
      </div>
    </div>
  )
}
