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
  Package,
  Upload,
  File,
  Eye,
  Trash2,
  Image
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import SiteDailyReportsTab from '@/components/admin/sites/SiteDailyReportsTab'
import SiteDocumentsTab from '@/components/admin/sites/SiteDocumentsTab'
import SitePartnersTab from '@/components/admin/sites/SitePartnersTab'
import SiteWorkersTab from '@/components/admin/sites/SiteWorkersTab'

interface Site {
  id: string
  name: string
  address: string
  description?: string
  status: string
  start_date?: string
  end_date?: string
  manager_name?: string
  construction_manager_name?: string
  construction_manager_phone?: string
  safety_manager_name?: string
  safety_manager_phone?: string
  accommodation_name?: string
  accommodation_address?: string
  accommodation_phone?: string
  blueprint_document_id?: string
  ptw_document_id?: string
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
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
      
      // Fetch site details
      const { data: siteData, error: siteError } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single()
      
      if (siteError) {
        console.error('Error fetching site:', siteError)
        return
      }
      
      // Fetch statistics in parallel
      const [reportsCount, workersCount, partnersCount, documentsCount] = await Promise.all([
        // Get daily reports count
        supabase
          .from('daily_reports')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId),
        // Get assigned workers count
        supabase
          .from('site_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
          .eq('is_active', true),
        // Get partners count
        supabase
          .from('site_partners')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId),
        // Get documents count
        supabase
          .from('unified_documents')
          .select('id', { count: 'exact', head: true })
          .eq('site_id', siteId)
      ])
      
      // Check for any errors in the queries
      if (reportsCount.error) console.error('Reports count error:', reportsCount.error)
      if (workersCount.error) console.error('Workers count error:', workersCount.error)
      if (partnersCount.error) console.error('Partners count error:', partnersCount.error)
      if (documentsCount.error) console.error('Documents count error:', documentsCount.error)
      
      // Create integrated data structure with real statistics
      const integratedData: IntegratedSiteData = {
        site: siteData,
        customers: [],
        primary_customer: null,
        daily_reports: [],
        documents_by_category: {},
        statistics: {
          total_reports: reportsCount.count || 0,
          total_documents: documentsCount.count || 0,
          assigned_workers: workersCount.count || 0,
          total_partners: partnersCount.count || 0
        },
        recent_activities: [],
        assigned_workers: [],
        document_category_counts: {}
      }
      
      setData(integratedData)
    } catch (error) {
      console.error('Error fetching site data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSite = async (formData: {
    name: string
    address: string
    description?: string
    status: string
    start_date: string
    end_date?: string
    manager_name?: string
    construction_manager_name?: string
    construction_manager_phone?: string
    safety_manager_name?: string
    safety_manager_phone?: string
    accommodation_name?: string
    accommodation_address?: string
    accommodation_phone?: string
  }) => {
    try {
      setEditLoading(true)
      
      const updateData = {
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        manager_name: formData.manager_name || null,
        construction_manager_name: formData.construction_manager_name || null,
        construction_manager_phone: formData.construction_manager_phone || null,
        safety_manager_name: formData.safety_manager_name || null,
        safety_manager_phone: formData.safety_manager_phone || null,
        accommodation_name: formData.accommodation_name || null,
        accommodation_address: formData.accommodation_address || null,
        accommodation_phone: formData.accommodation_phone || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('sites')
        .update(updateData)
        .eq('id', siteId)

      if (error) {
        throw error
      }

      // 업데이트 성공 시 데이터 다시 불러오기
      await fetchSiteData()
      setShowEditModal(false)
      
    } catch (error) {
      console.error('Error updating site:', error)
      alert('현장 정보 업데이트에 실패했습니다.')
    } finally {
      setEditLoading(false)
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
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                편집
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-4 sm:px-6 lg:px-8">
            {[
              { key: 'info', label: '현장 정보', icon: Building2 },
              { key: 'dailyReports', label: '작업일지', icon: FileText, count: data.statistics?.total_reports },
              { key: 'workers', label: '작업자', icon: Users, count: data.statistics?.assigned_workers },
              { key: 'partners', label: '파트너사', icon: Briefcase, count: data.statistics?.total_partners },
              { key: 'documents', label: '문서함', icon: Package, count: data.statistics?.total_documents }
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 현장 책임자 */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">현장 책임자</span>
                    </div>
                    {site.manager_name ? (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {site.manager_name}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">미등록</p>
                    )}
                  </div>

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

              {/* 숙소 정보 - 항상 표시하되, 데이터가 없으면 '미등록' 표시 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">숙소 정보</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">숙소명</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {site.accommodation_name || '미등록'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">숙소 주소</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {site.accommodation_address || '미등록'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">숙소 연락처</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {site.accommodation_phone || '미등록'}
                      </p>
                    </div>
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
                      {data.statistics?.assigned_workers || 0}
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
                      {data.statistics?.total_documents || 0}
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
                      {data.statistics?.total_partners || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 핵심 파일 섹션 */}
            <CoreFilesSection site={site} onUpdate={fetchSiteData} />
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
          <SiteWorkersTab siteId={siteId} siteName={site.name} />
        )}
      </div>

      {/* Edit Site Modal */}
      {showEditModal && data && (
        <EditSiteModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateSite}
          loading={editLoading}
          siteData={data.site}
        />
      )}
    </div>
  )
}

// Core Files Section Component
function CoreFilesSection({ 
  site, 
  onUpdate 
}: { 
  site: Site
  onUpdate: () => void 
}) {
  const [blueprintFile, setBlueprintFile] = useState<File | null>(null)
  const [ptwFile, setPtwFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<'blueprint' | 'ptw' | null>(null)
  const [blueprintDoc, setBlueprintDoc] = useState<any>(null)
  const [ptwDoc, setPtwDoc] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    // Always fetch documents for the site
    fetchDocuments()
  }, [site.id])

  const fetchDocuments = async () => {
    try {
      // Fetch blueprint document (technical_drawing)
      const { data: blueprintData } = await supabase
        .from('unified_documents')
        .select('*')
        .eq('site_id', site.id)
        .eq('sub_type', 'technical_drawing')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (blueprintData) {
        setBlueprintDoc(blueprintData)
      }

      // Fetch PTW document (safety_certificate)
      const { data: ptwData } = await supabase
        .from('unified_documents')
        .select('*')
        .eq('site_id', site.id)
        .eq('sub_type', 'safety_certificate')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      if (ptwData) {
        setPtwDoc(ptwData)
      }
    } catch (error) {
      // Ignore errors if documents don't exist
      console.log('Documents fetch error:', error)
    }
  }

  const handleFileUpload = async (type: 'blueprint' | 'ptw', file: File) => {
    if (!file) return

    setUploading(type)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('사용자 정보를 가져올 수 없습니다.')
      }

      // Sanitize filename to avoid Korean characters and special characters
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown'
      const timestamp = Date.now()
      const safeFileName = `${type}_${timestamp}.${fileExt}`
      const filePath = `${site.id}/${type}/${safeFileName}`
      
      // Upload file to Supabase Storage with sanitized filename
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('unified_documents')
        .insert({
          title: type === 'blueprint' ? '현장 공도면' : 'PTW 작업허가서',
          file_name: file.name,  // Keep original filename for display
          file_url: filePath,  // Use sanitized path for storage (stored as URL path)
          file_size: file.size,
          mime_type: file.type,
          category_type: 'shared',
          site_id: site.id,
          document_type: type === 'blueprint' ? 'drawing' : 'certificate',  // Use valid document types
          sub_type: type === 'blueprint' ? 'technical_drawing' : 'safety_certificate',  // Use valid sub_types
          is_public: true,
          uploaded_by: user.id  // Add user ID
        })
        .select()
        .single()

      if (docError) throw docError

      // Note: Not updating sites table as it references 'documents' table, not 'unified_documents'
      // The document is stored in unified_documents and can be retrieved by site_id and sub_type

      // Update local state
      if (type === 'blueprint') {
        setBlueprintDoc(docData)
        setBlueprintFile(null)
      } else {
        setPtwDoc(docData)
        setPtwFile(null)
      }

      // Refresh site data
      onUpdate()
      alert(`${type === 'blueprint' ? '현장 공도면' : 'PTW 문서'}가 업로드되었습니다.`)
    } catch (error) {
      console.error('Upload error:', error)
      alert('파일 업로드에 실패했습니다.')
    } finally {
      setUploading(null)
    }
  }

  const handleFileDelete = async (type: 'blueprint' | 'ptw') => {
    if (!confirm(`정말 ${type === 'blueprint' ? '현장 공도면' : 'PTW 문서'}를 삭제하시겠습니까?`)) return

    try {
      const doc = type === 'blueprint' ? blueprintDoc : ptwDoc

      if (!doc) return

      console.log('Deleting document:', doc)

      // Delete from storage first
      if (doc.file_url) {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([doc.file_url])

        if (storageError) {
          console.error('Storage delete error:', storageError)
          // Continue with database deletion even if storage fails
        }
      }

      // Delete document record from unified_documents
      const { error: deleteError } = await supabase
        .from('unified_documents')
        .delete()
        .eq('id', doc.id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state
      if (type === 'blueprint') {
        setBlueprintDoc(null)
      } else {
        setPtwDoc(null)
      }

      onUpdate()
      alert(`${type === 'blueprint' ? '현장 공도면' : 'PTW 문서'}가 삭제되었습니다.`)
    } catch (error) {
      console.error('Delete error:', error)
      alert(`파일 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  const handlePreview = (doc: any) => {
    if (!doc) return
    console.log('Previewing document:', doc)
    window.open(`/api/unified-documents/${doc.id}/file`, '_blank')
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 mt-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">핵심 파일</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 현장 공도면 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">현장 공도면</span>
            </div>
          </div>

          {blueprintDoc ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {blueprintDoc.file_name || blueprintDoc.filename || '현장 공도면'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(blueprintDoc.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(blueprintDoc)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="미리보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileDelete('blueprint')}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dwg"
                onChange={(e) => setBlueprintFile(e.target.files?.[0] || null)}
                className="hidden"
                id="blueprint-file"
              />
              <label
                htmlFor="blueprint-file"
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  파일 선택
                </span>
              </label>
              
              {blueprintFile && (
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <span className="text-sm text-blue-900 dark:text-blue-100">{blueprintFile.name}</span>
                  <button
                    onClick={() => handleFileUpload('blueprint', blueprintFile)}
                    disabled={uploading === 'blueprint'}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {uploading === 'blueprint' ? '업로드 중...' : '업로드'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PTW 문서 */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">PTW 작업허가서</span>
            </div>
          </div>

          {ptwDoc ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ptwDoc.file_name || ptwDoc.filename || 'PTW 작업허가서'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(ptwDoc.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreview(ptwDoc)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    title="미리보기"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleFileDelete('ptw')}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setPtwFile(e.target.files?.[0] || null)}
                className="hidden"
                id="ptw-file"
              />
              <label
                htmlFor="ptw-file"
                className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-green-400 dark:hover:border-green-500 transition-colors"
              >
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  파일 선택
                </span>
              </label>
              
              {ptwFile && (
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm text-green-900 dark:text-green-100">{ptwFile.name}</span>
                  <button
                    onClick={() => handleFileUpload('ptw', ptwFile)}
                    disabled={uploading === 'ptw'}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading === 'ptw' ? '업로드 중...' : '업로드'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          ℹ️ 이 파일들은 작업자와 현장관리자가 홈 화면에서 바로 확인할 수 있습니다.
        </p>
      </div>
    </div>
  )
}

// Edit Site Modal Component
function EditSiteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  siteData
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (formData: any) => void
  loading: boolean
  siteData: Site
}) {
  const [formData, setFormData] = useState({
    name: siteData.name || '',
    address: siteData.address || '',
    description: siteData.description || '',
    status: siteData.status || 'active',
    start_date: siteData.start_date ? siteData.start_date.split('T')[0] : '',
    end_date: siteData.end_date ? siteData.end_date.split('T')[0] : '',
    manager_name: siteData.manager_name || '',
    construction_manager_name: siteData.construction_manager_name || '',
    construction_manager_phone: siteData.construction_manager_phone || '',
    safety_manager_name: siteData.safety_manager_name || '',
    safety_manager_phone: siteData.safety_manager_phone || '',
    accommodation_name: siteData.accommodation_name || '',
    accommodation_address: siteData.accommodation_address || '',
    accommodation_phone: siteData.accommodation_phone || ''
  })

  // Reset form data when siteData changes
  useEffect(() => {
    setFormData({
      name: siteData.name || '',
      address: siteData.address || '',
      description: siteData.description || '',
      status: siteData.status || 'active',
      start_date: siteData.start_date ? siteData.start_date.split('T')[0] : '',
      end_date: siteData.end_date ? siteData.end_date.split('T')[0] : '',
      manager_name: siteData.manager_name || '',
      construction_manager_name: siteData.construction_manager_name || '',
      construction_manager_phone: siteData.construction_manager_phone || '',
      safety_manager_name: siteData.safety_manager_name || '',
      safety_manager_phone: siteData.safety_manager_phone || '',
      accommodation_name: siteData.accommodation_name || '',
      accommodation_address: siteData.accommodation_address || '',
      accommodation_phone: siteData.accommodation_phone || ''
    })
  }, [siteData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.address || !formData.start_date) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">현장 정보 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="sr-only">닫기</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 섹션 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                기본 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 현장명 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    현장명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* 상태 */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="active">진행중</option>
                    <option value="planning">계획중</option>
                    <option value="completed">완료</option>
                    <option value="suspended">중단</option>
                  </select>
                </div>

                {/* 주소 */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    주소 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* 시작일 */}
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    required
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* 종료일 */}
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    min={formData.start_date}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                {/* 설명 */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    현장 설명
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="현장에 대한 설명을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 관리자 정보 섹션 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                관리자 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 현장 책임자 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400 mr-2" />
                    현장 책임자
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        id="manager_name"
                        name="manager_name"
                        value={formData.manager_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="현장 책임자 이름"
                      />
                    </div>
                  </div>
                </div>

                {/* 건설관리자 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
                    건설관리자
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="construction_manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        id="construction_manager_name"
                        name="construction_manager_name"
                        value={formData.construction_manager_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="건설관리자 이름"
                      />
                    </div>
                    <div>
                      <label htmlFor="construction_manager_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        연락처
                      </label>
                      <input
                        type="tel"
                        id="construction_manager_phone"
                        name="construction_manager_phone"
                        value={formData.construction_manager_phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                </div>

                {/* 안전관리자 */}
                <div className="space-y-4">
                  <h4 className="flex items-center text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                    안전관리자
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="safety_manager_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        이름
                      </label>
                      <input
                        type="text"
                        id="safety_manager_name"
                        name="safety_manager_name"
                        value={formData.safety_manager_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="안전관리자 이름"
                      />
                    </div>
                    <div>
                      <label htmlFor="safety_manager_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        연락처
                      </label>
                      <input
                        type="tel"
                        id="safety_manager_phone"
                        name="safety_manager_phone"
                        value={formData.safety_manager_phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="010-0000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 숙소 정보 섹션 */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                숙소 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 숙소명 */}
                <div>
                  <label htmlFor="accommodation_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    숙소명
                  </label>
                  <input
                    type="text"
                    id="accommodation_name"
                    name="accommodation_name"
                    value={formData.accommodation_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="숙소 이름"
                  />
                </div>

                {/* 숙소 연락처 */}
                <div>
                  <label htmlFor="accommodation_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    숙소 연락처
                  </label>
                  <input
                    type="tel"
                    id="accommodation_phone"
                    name="accommodation_phone"
                    value={formData.accommodation_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="010-0000-0000"
                  />
                </div>

                {/* 숙소 주소 */}
                <div className="md:col-span-2">
                  <label htmlFor="accommodation_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    숙소 주소
                  </label>
                  <input
                    type="text"
                    id="accommodation_address"
                    name="accommodation_address"
                    value={formData.accommodation_address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder="숙소 주소를 입력하세요"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}