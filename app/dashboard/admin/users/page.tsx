import { getUsers } from '@/app/actions/admin/users'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { UsersContent } from '@/components/admin/users/UsersContent'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '사용자 관리',
}

const DEFAULT_PAGE_SIZE = 10

export default async function AdminUsersPage() {
  const profile = await requireAdminProfile()
  const initialResult = await getUsers(1, DEFAULT_PAGE_SIZE)

  const initialUsers = initialResult.success ? (initialResult.data?.users ?? []) : []
  const initialTotal = initialResult.success ? (initialResult.data?.total ?? 0) : 0
  const initialPages = initialResult.success ? (initialResult.data?.pages ?? 1) : 1

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사용자 관리"
        description="시스템에 등록된 전체 사용자 계정 및 권한을 통합 관리합니다."
        breadcrumbs={[{ label: '대시보드', href: '/dashboard/admin' }, { label: '사용자 관리' }]}
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <UsersContent
          initialUsers={initialUsers}
          initialTotal={initialTotal}
          initialPages={initialPages}
          pageSize={DEFAULT_PAGE_SIZE}
          currentAdminRole={profile.role}
          initialLoadErrored={!initialResult.success}
        />
      </div>
    </div>
  )
}
