'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Eye, 
  FileText,
  Building2,
  CloudRain,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PartnerWorkLogDetailPageProps {
  user: User
  profile: Profile
  sites: any[]
  workLogId: string
}

interface WorkLog {
  id: string
  date: string
  siteId: string
  siteName?: string
  mainWork: string
  status: 'submitted'
  author: string
  weather?: string
  totalWorkers: number
  npc1000Used?: number
  issues?: string
}

export default function PartnerWorkLogDetailPage({ 
  user, 
  profile, 
  sites, 
  workLogId 
}: PartnerWorkLogDetailPageProps) {
  const router = useRouter()
  const [workLog, setWorkLog] = useState<WorkLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadWorkLog()
  }, [workLogId])

  const loadWorkLog = async () => {
    try {
      setLoading(true)
      setError(null)

      // For demo purposes, generate mock data based on the ID
      // In a real implementation, this would query the database
      const mockWorkLog: WorkLog = {
        id: workLogId,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        siteId: sites[0]?.id || 'site1',
        siteName: sites[0]?.name || '강남 A현장',
        mainWork: '기초 콘크리트 타설 작업 및 철근 배근 작업 진행',
        status: 'submitted',
        author: '김작업',
        weather: '맑음',
        totalWorkers: 12,
        npc1000Used: 250,
        issues: '콘크리트 타설 중 일부 균열 발생하여 보수 작업 완료. 품질 검사 결과 양호함.'
      }

      setWorkLog(mockWorkLog)
    } catch (err: any) {
      console.error('Error loading work log:', err)
      setError('작업일지를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    router.push('/partner/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">작업일지를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !workLog) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || '작업일지를 찾을 수 없습니다.'}
            </p>
            <button
              onClick={handleGoBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  작업일지 상세
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(workLog.date), 'yyyy년 MM월 dd일', { locale: ko })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                제출됨
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                기본 정보
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작업일자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(workLog.date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      현장명
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Building2 className="h-4 w-4" />
                      <span>{workLog.siteName}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Eye className="h-4 w-4" />
                      <span>{workLog.author}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      날씨
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CloudRain className="h-4 w-4" />
                      <span>{workLog.weather}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작업자 수
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{workLog.totalWorkers}명</span>
                    </div>
                  </div>

                  {workLog.npc1000Used && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        NPC1000 사용량
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Clock className="h-4 w-4" />
                        <span>{workLog.npc1000Used}L</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                작업 내용
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {workLog.mainWork}
                </p>
              </div>
            </div>
          </div>

          {/* Issues */}
          {workLog.issues && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  특이사항 및 문제점
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {workLog.issues}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}