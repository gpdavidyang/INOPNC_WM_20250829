'use client'

import { QuickActionsSettings } from '@/components/admin/quick-actions-settings'

export default function TestModalPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          모달 테스트 페이지
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            빠른 작업 설정 모달 테스트
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            아래 버튼을 클릭하여 모달이 중앙에 제대로 표시되는지 확인하세요.
          </p>
          
          <div className="flex items-center gap-4">
            <QuickActionsSettings />
            <span className="text-sm text-gray-500">← 이 설정 버튼을 클릭하세요</span>
          </div>
        </div>
        
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">테스트 항목</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>모달이 화면 중앙에 표시되는지 확인</li>
            <li>모달 내용이 스크롤 가능한지 확인</li>
            <li>헤더가 고정되어 있는지 확인</li>
            <li>다크 모드에서도 잘 보이는지 확인</li>
          </ul>
        </div>
      </div>
    </div>
  )
}