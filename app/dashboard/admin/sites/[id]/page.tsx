'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Package
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import SiteDailyReportsTab from '@/components/admin/sites/SiteDailyReportsTab'
import SiteDocumentsTab from '@/components/admin/sites/SiteDocumentsTab'
import SitePartnersTab from '@/components/admin/sites/SitePartnersTab'

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

interface IntegratedSiteData {
  site: Site
  customers: any[]
  primary_customer: any
  daily_reports: any[]
  documents_by_category: Record<string, any[]>
  statistics: any
  recent_activities: any[]
  assigned_workers: any[]
  document_category_counts: Record<string, number>
}

export default function SiteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const siteId = params.id as string
  
  const [data, setData] = useState<IntegratedSiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'info' | 'dailyReports' | 'documents' | 'partners' | 'workers'>('info')
  const [referrer, setReferrer] = useState<string>('sites')
  const supabase = createClient()

  useEffect(() => {
    // Check if coming from integrated dashboard
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const from = urlParams.get('from')
      if (from === 'integrated') {
        setReferrer('integrated')
      }
    }
    
    if (siteId) {
      fetchSiteData()
    }
  }, [siteId])

  const fetchSiteData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/sites/${siteId}/integrated`)
      
      if (response.ok) {
        const integratedData = await response.json()
        setData(integratedData)
      } else {
        console.error('Failed to fetch site data:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching site data:', error)
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            현장 정보를 찾을 수 없습니다
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { site } = data

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            {referrer === 'integrated' ? (
              <>
                <Link 
                  href="/dashboard/admin/integrated"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  통합관리
                </Link>
                <span>/</span>
                <Link 
                  href="/dashboard/admin/integrated?view=sites"
                  className="hover:text-gray-700 dark:hover:text-gray-300"
                >
                  현장 통합뷰
                </Link>
              </>
            ) : (
              <Link 
                href="/dashboard/admin/sites"
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                현장 관리
              </Link>
            )}
            <span>/</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{site.name}</span>
          </nav>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (referrer === 'integrated') {
                    router.push('/dashboard/admin/integrated?view=sites')
                  } else {
                    router.back()
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {site.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(site.status)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {site.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/admin/sites/${site.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                편집
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-4 sm:px-6 lg:px-8">
            {[
              { key: 'info', label: '현장정보', icon: Building2 },
              { key: 'dailyReports', label: '작업일지', icon: FileText, count: data.daily_reports?.length },
              { key: 'documents', label: '공유문서함', icon: Package, count: data.document_category_counts?.shared },
              { key: 'partners', label: '파트너사', icon: Briefcase, count: data.customers?.length },
              { key: 'workers', label: '작업자 배정', icon: Users, count: data.assigned_workers?.length }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'info' && (
          <div className="max-w-4xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 기본 정보 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">기본 정보</h3>
                <div className="space-y-4">
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
                        {site.start_date ? format(new Date(site.start_date), 'yyyy.MM.dd', { locale: ko }) : '-'} ~ 
                        {site.end_date ? format(new Date(site.end_date), 'yyyy.MM.dd', { locale: ko }) : '진행중'}
                      </p>
                    </div>
                  </div>

                  {site.description && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">현장 설명</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                        {site.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 관리자 정보 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">관리자 정보</h3>
                <div className="space-y-6">
                  {/* 건설관리자 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
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

            {/* 통계 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">작업일지</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {data.statistics?.total_reports || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">배정 작업자</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {data.statistics?.total_workers || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">공유문서</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {data.statistics?.shared_documents || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Briefcase className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">파트너사</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {data.customers?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 작업일지 탭 */}
        {activeTab === 'dailyReports' && (
          <SiteDailyReportsTab siteId={siteId} siteName={site.name} />
        )}

        {/* 문서함 탭 */}
        {activeTab === 'documents' && (
          <SiteDocumentsTab siteId={siteId} siteName={site.name} />
        )}

        {/* 파트너사 탭 */}
        {activeTab === 'partners' && (
          <SitePartnersTab siteId={siteId} siteName={site.name} />
        )}

        {/* 작업자 배정 탭 */}
        {activeTab === 'workers' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">작업자 배정 관리</h3>
              <p>이 기능은 현재 개발 중입니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}