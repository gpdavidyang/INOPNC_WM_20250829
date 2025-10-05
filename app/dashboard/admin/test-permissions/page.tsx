import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AdminPermissionValidator from '@/components/admin/legacy/AdminPermissionValidator'
import { PageHeader } from '@/components/ui/page-header'

export const metadata: Metadata = {
  title: '권한 테스트',
}

export default async function TestPermissionsPage() {
  const profile = await requireAdminProfile()

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="권한 테스트"
        description="관리자 권한 검증 및 기능 테스트 도구"
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '권한 테스트' }]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <AdminPermissionValidator profile={profile as any} />
      </div>
    </div>
  )
}
