import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import AdminPermissionValidator from '@/components/admin/legacy/AdminPermissionValidator'

export const metadata: Metadata = {
  title: '권한 테스트',
}

export default async function TestPermissionsPage() {
  const profile = await requireAdminProfile()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">권한 테스트</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          관리자 권한 검증 및 기능 테스트 도구입니다.
        </p>
      </div>

      <AdminPermissionValidator profile={profile as any} />
    </div>
  )
}
