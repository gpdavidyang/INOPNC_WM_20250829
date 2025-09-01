'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import DailyReportDetailModal from './DailyReportDetailModal'

interface DailyReportDetailModalWrapperProps {
  reportId: string
  isOpen: boolean
  onClose: () => void
  onReportUpdated: () => void
}

export default function DailyReportDetailModalWrapper({ 
  reportId, 
  isOpen, 
  onClose, 
  onReportUpdated 
}: DailyReportDetailModalWrapperProps) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReport()
    }
  }, [isOpen, reportId])

  const fetchReport = async () => {
    try {
      setLoading(true)
      
      const { data: reportData, error } = await supabase
        .from('daily_reports')
        .select(`
          *,
          sites (
            id,
            name,
            address
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq('id', reportId)
        .single()

      if (error) {
        console.error('Error fetching report:', error)
        return
      }

      setReport(reportData)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <p className="text-gray-500 dark:text-gray-400">작업일지를 불러올 수 없습니다.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  return (
    <DailyReportDetailModal
      report={report}
      onClose={onClose}
      onUpdated={() => {
        onReportUpdated()
        fetchReport() // Refresh the report data after update
      }}
    />
  )
}