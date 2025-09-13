'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkerCalendarData, WorkerCalendarData } from '@/app/actions/admin/salary'
import WorkerCalendar from '@/components/admin/WorkerCalendar'
import { PageHeader } from '@/components/ui/page-header'
import { ArrowLeft } from 'lucide-react'

interface WorkerCalendarClientProps {
  workerId: string
  workerName: string
  year: number
  month: number
}

export default function WorkerCalendarClient({ 
  workerId, 
  workerName, 
  year, 
  month 
}: WorkerCalendarClientProps) {
  const router = useRouter()
  const [calendarData, setCalendarData] = useState<WorkerCalendarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCalendarData = useCallback(async () => {
    if (!workerId) {
      setError('작업자 ID가 없습니다.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('Loading calendar data for:', { workerId, year, month })
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
  }, [workerId, year, month])

  useEffect(() => {
    loadCalendarData()
  }, [loadCalendarData])

  const handleGoBack = () => {
    router.push('/dashboard/admin/salary')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader 
        title={`${workerName} - ${year}년 ${month}월 근무 캘린더`}
        subtitle="작업자의 월별 근무 일정과 시간을 확인하세요"
      />
      
      <div className="px-8 py-8" style={{ minWidth: '1536px' }}>
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