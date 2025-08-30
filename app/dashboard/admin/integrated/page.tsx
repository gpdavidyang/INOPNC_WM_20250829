import { Suspense } from 'react'
import IntegratedDashboard from '@/components/admin/integrated/IntegratedDashboard'

export default function IntegratedViewPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">통합 관리 대시보드</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          현장, 일일보고서, 문서를 한 번에 관리하는 통합 뷰
        </p>
      </div>
      
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <IntegratedDashboard />
      </Suspense>
    </div>
  )
}