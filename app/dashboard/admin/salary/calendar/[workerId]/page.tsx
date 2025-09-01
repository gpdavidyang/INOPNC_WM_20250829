'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { getWorkerCalendarData, WorkerCalendarData } from '@/app/actions/admin/salary'
import WorkerCalendar from '@/components/admin/WorkerCalendar'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'

export default function WorkerCalendarPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  
  const workerId = params.workerId as string
  const workerName = searchParams.get('name') || 'Unknown Worker'
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())
  
  const [calendarData, setCalendarData] = useState<WorkerCalendarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCalendarData()
  }, [workerId, year, month])

  const loadCalendarData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getWorkerCalendarData(workerId, year, month)
      
      if (result.success) {
        setCalendarData(result.data || [])
      } else {
        setError(result.error || '캘린더 데이터를 불러올 수 없습니다.')
      }
    } catch (err) {
      console.error('Calendar data loading error:', err)
      setError('캘린더 데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push('/dashboard/admin/salary')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title={`${workerName} - ${year}년 ${month}월 근무 캘린더`}
        subtitle="작업자의 월별 근무 일정과 시간을 확인하세요"
        showBreadcrumbs={false}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            급여관리로 돌아가기
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-300">캘린더 데이터 로딩 중...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 dark:text-red-400 mb-2">⚠️ {error}</div>
                <button
                  onClick={loadCalendarData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <WorkerCalendar 
                workerName={workerName}
                year={year}
                month={month}
                calendarData={calendarData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}