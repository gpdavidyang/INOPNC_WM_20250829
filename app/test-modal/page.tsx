'use client'

export default function TestModalPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          모달 테스트 페이지 (비활성)
        </h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400">
            빠른 작업 설정 모달은 관리자 정책에 따라 제거되었습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
