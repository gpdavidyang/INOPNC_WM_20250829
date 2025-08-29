import AdminPermissionValidator from '@/components/admin/AdminPermissionValidator'

export default function TestPermissionsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">권한 테스트</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">관리자 권한 검증 및 기능 테스트</p>
    </div>

      <AdminPermissionValidator />
    </div>
  )
}