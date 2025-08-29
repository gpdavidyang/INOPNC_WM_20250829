import SignupApprovals from '@/components/admin/SignupApprovals'

export default function ApprovalsPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">가입 요청 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            새로운 사용자 가입 요청을 검토하고 승인 또는 거절합니다
          </p>
    </div>
        <SignupApprovals />
    </div>
  )
}