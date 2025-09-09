import OrganizationList from '@/components/admin/organizations/OrganizationList'

export default function OrganizationsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">거래처 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            작업자와 현장관리자가 소속된 거래처 정보를 관리합니다
          </p>
    </div>
        <OrganizationList />
    </div>
  )
}