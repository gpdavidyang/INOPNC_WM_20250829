import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { getUsers } from '@/app/actions/admin/users'
import { UsersContent } from '@/components/admin/users/UsersContent'

export const metadata: Metadata = {
  title: '사용자 관리',
}

const DEFAULT_PAGE_SIZE = 10

export default async function AdminUsersPage() {
  const profile = await requireAdminProfile()
  const initialResult = await getUsers(1, DEFAULT_PAGE_SIZE)

  const initialUsers = initialResult.success ? initialResult.data?.users ?? [] : []
  const initialTotal = initialResult.success ? initialResult.data?.total ?? 0 : 0
  const initialPages = initialResult.success ? initialResult.data?.pages ?? 1 : 1

  return (
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
  )
}
