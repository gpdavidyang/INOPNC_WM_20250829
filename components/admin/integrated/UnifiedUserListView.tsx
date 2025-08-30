import UserManagement from '@/components/admin/UserManagement'

export default function UnifiedUserListView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용자 통합뷰</h1>
        <p className="text-gray-600 mt-1">모든 사용자 계정을 통합 관리합니다.</p>
      </div>
      
      <UserManagement />
    </div>
  )
}