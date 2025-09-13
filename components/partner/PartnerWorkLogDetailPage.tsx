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
  AlertTriangle,
  Camera,
  Upload,
  Send,
  Package,
  Receipt,
  Image,
  MessageSquare,
  Plus,
  Download,
  Edit,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface PartnerWorkLogDetailPageProps {
  user: User
  profile: Profile
  sites: unknown[]
  workLogId: string
}

interface WorkLog {
  id: string
  site_id: string
  work_date: string
  member_name: string
  process_type: string
  total_workers: number
  npc1000_incoming?: number
  npc1000_used?: number
  npc1000_remaining?: number
  issues?: string
  status: string
  created_by?: string
  created_at?: string
  updated_at?: string
  component_name?: string
  work_process?: string
  work_section?: string
  markup_document_id?: string
  // Relations
  site?: { id: string; name: string; address?: string }
  created_by_profile?: { id: string; full_name: string; email: string }
  weather?: string // This might be added later or derived
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

      // Query the actual database for the work log
      const { data: workLogData, error: workLogError } = await supabase
        .from('daily_reports')
        .select(`
          *,
          site:sites(id, name, address),
          created_by_profile:profiles!created_by(id, full_name, email)
        `)
        .eq('id', workLogId)
        .single()

      if (workLogError) {
        console.error('Error fetching work log:', workLogError)
        setError('작업일지를 불러오는데 실패했습니다.')
        return
      }

      if (!workLogData) {
        setError('작업일지를 찾을 수 없습니다.')
        return
      }

      // Set weather as a fallback - this could be enhanced with actual weather data
      workLogData.weather = '맑음' // This could be fetched from weather API or stored separately

      setWorkLog(workLogData)
    } catch (err) {
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
                  {format(new Date(workLog.work_date), 'yyyy년 MM월 dd일', { locale: ko })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                workLog.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                workLog.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                workLog.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {workLog.status === 'submitted' ? '제출됨' :
                 workLog.status === 'approved' ? '승인됨' :
                 workLog.status === 'rejected' ? '반려됨' :
                 workLog.status === 'draft' ? '작성중' : workLog.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 1. 기본정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                1. 기본정보
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작업일자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(workLog.work_date), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      현장명
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Building2 className="h-4 w-4" />
                      <span>{workLog.site?.name || '미지정'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      부재명
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Eye className="h-4 w-4" />
                      <span>{workLog.member_name}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      공정 유형
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <FileText className="h-4 w-4" />
                      <span>{workLog.process_type}</span>
                    </div>
                  </div>

                  {workLog.component_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        구성요소명
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Building2 className="h-4 w-4" />
                        <span>{workLog.component_name}</span>
                      </div>
                    </div>
                  )}

                  {workLog.work_section && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                        작업 구간
                      </label>
                      <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <MapPin className="h-4 w-4" />
                        <span>{workLog.work_section}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      날씨
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CloudRain className="h-4 w-4" />
                      <span>{workLog.weather || '미기록'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      총 작업자 수
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Users className="h-4 w-4" />
                      <span>{workLog.total_workers || 0}명</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                      작성자
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Eye className="h-4 w-4" />
                      <span>{workLog.created_by_profile?.full_name || '미지정'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 작업 내용 및 사진관리 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Camera className="h-5 w-5" />
                2. 작업 내용 및 사진관리
              </h2>
            </div>
            <div className="px-6 py-4">
              {/* 작업 내용 */}
              <div className="space-y-4 mb-6">
                {workLog.work_process && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                      작업 공정
                    </label>
                    <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                      <p className="whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {workLog.work_process}
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    주요 작업 내용
                  </label>
                  <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                    <p className="whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {workLog.member_name} - {workLog.process_type}
                      {workLog.component_name && ` (${workLog.component_name})`}
                      {workLog.work_section && ` - ${workLog.work_section}`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 사진 관리 */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 작업전 사진 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      작업전 사진
                    </h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">작업전 사진이 없습니다</p>
                      <button className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                        <Upload className="h-3 w-3 mr-1" />
                        사진 업로드
                      </button>
                    </div>
                  </div>
                  
                  {/* 작업후 사진 */}
                  <div>
                    <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      작업후 사진
                    </h3>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Camera className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">작업후 사진이 없습니다</p>
                      <button className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200">
                        <Upload className="h-3 w-3 mr-1" />
                        사진 업로드
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. 작업자 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Users className="h-5 w-5" />
                3. 작업자 정보
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">작업자 정보가 없습니다</p>
                <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-1" />
                  작업자 추가
                </button>
              </div>
            </div>
          </div>

          {/* 4. 영수증 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                4. 영수증 정보
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">영수증 정보가 없습니다</p>
                <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-1" />
                  영수증 업로드
                </button>
              </div>
            </div>
          </div>

          {/* 5. 진행도면업로드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Image className="h-5 w-5" />
                5. 진행도면업로드
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">진행도면이 업로드되지 않았습니다</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG 파일을 지원합니다</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-1" />
                    도면 업로드
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 6. 본사에게 요청 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Send className="h-5 w-5" />
                6. 본사에게 요청
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">본사 요청사항이 없습니다</p>
                <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                  <Send className="h-4 w-4 mr-1" />
                  요청사항 작성
                </button>
              </div>
            </div>
          </div>

          {/* 7. NPC-1000 자재관리 정보 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-5 w-5" />
                7. NPC-1000 자재관리 정보
              </h2>
            </div>
            <div className="px-6 py-4">
              {(workLog.npc1000_incoming || workLog.npc1000_used || workLog.npc1000_remaining) ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {workLog.npc1000_incoming || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      반입량 (kg)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                      {workLog.npc1000_used || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      사용량 (kg)
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                      {workLog.npc1000_remaining || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      잔여량 (kg)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">NPC-1000 사용 정보가 없습니다</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    <Edit className="h-4 w-4 mr-1" />
                    사용량 입력
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 8. 특이사항 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                8. 특이사항
              </h2>
            </div>
            <div className="px-6 py-4">
              {workLog.issues ? (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="prose prose-sm max-w-none text-orange-800 dark:text-orange-200">
                    <p className="whitespace-pre-wrap leading-relaxed m-0">
                      {workLog.issues}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">특이사항이 없습니다</p>
                  <button className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700">
                    <Edit className="h-4 w-4 mr-1" />
                    특이사항 입력
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}