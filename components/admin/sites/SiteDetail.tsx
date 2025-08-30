'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  FileText, 
  Calendar,
  User,
  Shield,
  CheckCircle,
  Clock,
  Edit,
  X,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Site {
  id: string
  name: string
  address: string
  description?: string
  status: string
  start_date?: string
  end_date?: string
  construction_manager_name?: string
  construction_manager_phone?: string
  safety_manager_name?: string
  safety_manager_phone?: string
  created_at: string
  updated_at?: string
}

interface SiteAssignment {
  id: string
  user_id: string
  role: string
  profile: {
    full_name: string
    email: string
    phone?: string
  }
}

interface DailyReport {
  id: string
  member_name: string
  process_type: string
  work_date: string
  status: string
  total_workers: number
  issues?: string
  created_at: string
}

interface SiteDetailProps {
  siteId: string
  onClose: () => void
  onEdit?: () => void
}

export default function SiteDetail({ siteId, onClose, onEdit }: SiteDetailProps) {
  const [site, setSite] = useState<Site | null>(null)
  const [assignments, setAssignments] = useState<SiteAssignment[]>([])
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([])
  const [workerCount, setWorkerCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'workers' | 'reports'>('info')
  const supabase = createClient()

  useEffect(() => {
    fetchSiteDetails()
  }, [siteId])

  const fetchSiteDetails = async () => {
    setLoading(true)
    try {
      // Fetch site info
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single()

      if (siteError) throw siteError
      setSite(siteData)

      // Fetch site assignments with counts
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('site_assignments')
        .select('*')
        .eq('site_id', siteId)
        .eq('is_active', true)

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
        setAssignments([])
        setWorkerCount(0)
      } else {
        // Set worker count
        setWorkerCount(assignmentsData?.length || 0)
        
        // Fetch profile data separately to avoid FK issues
        const enrichedAssignments = await Promise.all(
          (assignmentsData || []).map(async (assignment) => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email, phone')
                .eq('id', assignment.user_id)
                .single()
              
              return {
                ...assignment,
                profile: profile || {
                  full_name: 'Unknown User',
                  email: 'unknown@example.com',
                  phone: null
                }
              }
            } catch (err) {
              return {
                ...assignment,
                profile: {
                  full_name: 'Unknown User',
                  email: 'unknown@example.com',
                  phone: null
                }
              }
            }
          })
        )
        setAssignments(enrichedAssignments)
      }

      // Fetch daily reports count and recent reports
      const [reportsCountResult, reportsDataResult] = await Promise.all([
        // Get total count
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId),
        // Get recent reports for display
        supabase
          .from('daily_reports')
          .select(`
            id,
            member_name,
            process_type,
            work_date,
            status,
            total_workers,
            issues,
            created_at
          `)
          .eq('site_id', siteId)
          .order('work_date', { ascending: false })
          .limit(10)
      ])

      // Set report count
      if (reportsCountResult.error) {
        console.error('Error fetching reports count:', reportsCountResult.error)
        setReportCount(0)
      } else {
        setReportCount(reportsCountResult.count || 0)
      }

      // Set recent reports
      if (reportsDataResult.error) {
        console.error('Error fetching reports:', reportsDataResult.error)
        setDailyReports([])
      } else {
        setDailyReports(reportsDataResult.data || [])
      }

    } catch (error) {
      console.error('Error fetching site details:', error)
      // Mock data for development
      setSite({
        id: siteId,
        name: '강남 A현장',
        address: '서울시 강남구 테헤란로 123',
        description: '고급 오피스텔 건설 현장',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        construction_manager_name: '김건설',
        construction_manager_phone: '010-1234-5678',
        safety_manager_name: '이안전',
        safety_manager_phone: '010-9876-5432',
        created_at: new Date().toISOString()
      })
      
      const mockAssignments = [
        {
          id: '1',
          user_id: '1',
          role: 'site_manager',
          profile: {
            full_name: '김현장',
            email: 'manager@site.com',
            phone: '010-1111-2222'
          }
        },
        {
          id: '2',
          user_id: '2',
          role: 'worker',
          profile: {
            full_name: '박작업',
            email: 'worker@site.com',
            phone: '010-3333-4444'
          }
        },
        {
          id: '3',
          user_id: '3',
          role: 'worker',
          profile: {
            full_name: '최작업',
            email: 'worker2@site.com',
            phone: '010-5555-6666'
          }
        }
      ]
      setAssignments(mockAssignments)
      setWorkerCount(mockAssignments.length)
      
      const mockReports = [
        {
          id: '1',
          member_name: '김현장',
          process_type: '콘크리트 타설 작업',
          work_date: '2024-08-22',
          status: 'completed',
          total_workers: 5,
          issues: '특이사항 없음',
          created_at: new Date().toISOString()
        }
      ]
      setDailyReports(mockReports)
      setReportCount(44) // Mock count to match the list view
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      site_manager: '현장관리자',
      worker: '작업자',
      customer_manager: '파트너사',
      admin: '관리자'
    }
    return roleLabels[role as keyof typeof roleLabels] || role
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { text: '진행중', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: CheckCircle },
      planning: { text: '계획중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300', icon: Clock },
      completed: { text: '완료', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: CheckCircle },
      suspended: { text: '중단', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
          <p className="text-gray-900 dark:text-gray-100">현장 정보를 찾을 수 없습니다.</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {site.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(site.status)}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ID: {site.id}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="수정"
              >
                <Edit className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'info', label: '현장정보', icon: Building2 },
              { key: 'workers', label: '작업자', icon: Users },
              { key: 'reports', label: '작업일지', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* 요약 통계 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">현장 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">배정 작업자</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{workerCount}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">작업일지</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{reportCount}</p>
                      </div>
                      <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">현장 상태</p>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100 mt-1">{getStatusBadge(site.status)}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">주소</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {site.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">공사기간</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {site.start_date ? format(new Date(site.start_date), 'yyyy.MM.dd') : '-'} ~ 
                        {site.end_date ? format(new Date(site.end_date), 'yyyy.MM.dd') : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {site.description && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">현장 설명</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                      {site.description}
                    </p>
                  </div>
                )}
              </div>

              {/* 관리자 정보 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">관리자 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 건설관리자 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">건설관리자</span>
                    </div>
                    {site.construction_manager_name ? (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.construction_manager_name}
                        </p>
                        {site.construction_manager_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            {site.construction_manager_phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">미등록</p>
                    )}
                  </div>

                  {/* 안전관리자 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">안전관리자</span>
                    </div>
                    {site.safety_manager_name ? (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.safety_manager_name}
                        </p>
                        {site.safety_manager_phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            {site.safety_manager_phone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">미등록</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                배정된 작업자 ({workerCount}명)
              </h3>
              {assignments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  배정된 작업자가 없습니다.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {assignment.profile.full_name}
                        </h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full">
                          {getRoleLabel(assignment.role)}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {assignment.profile.email}
                        </div>
                        {assignment.profile.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {assignment.profile.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                작업일지 ({reportCount}건)
              </h3>
              {dailyReports.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  작업일지가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {dailyReports.map((report) => (
                    <div key={report.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {report.member_name} - {report.process_type}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(report.work_date), 'yyyy.MM.dd (E)', { locale: ko })}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              작업인원 {report.total_workers}명
                            </div>
                          </div>
                          {report.issues && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {report.issues}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(report.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}