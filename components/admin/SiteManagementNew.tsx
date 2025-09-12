'use client'

import { useState, useEffect } from 'react'
import '@/styles/site-management.css'
import { createClient } from '@/lib/supabase/client'
import { Site } from '@/types'
import { useRouter } from 'next/navigation'
import { 
  Building, 
  MapPin, 
  Calendar, 
  Users, 
  Shield, 
  Search, 
  ChevronRight, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Home,
  FileText,
  Paperclip,
  X,
  Eye,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ExtendedSite extends Site {
  company?: string
  accident_free_days?: number
  accommodation?: string | null
  manager_phone?: string | null
  worker_count?: number
  total_manhours?: number
  total_reports?: number
}

export default function SiteManagementNew() {
  const [sites, setSites] = useState<ExtendedSite[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<ExtendedSite | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent')
  const [showDetail, setShowDetail] = useState(false)
  const [expandedField, setExpandedField] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  
  const router = useRouter()
  const supabase = createClient()

  // 현장 목록 가져오기
  const fetchSites = async () => {
    try {
      setLoading(true)
      
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select(`
          *,
          site_assignments!site_assignments_site_id_fkey (
            user_id,
            is_active
          )
        `)
        .order('created_at', { ascending: false })
      
      if (sitesError) throw sitesError
      
      // 추가 정보 처리
      const processedSites = sitesData?.map(site => ({
        ...site,
        worker_count: site.site_assignments?.filter((a: any) => a.is_active).length || 0,
        company: 'INOPNC',
        accident_free_days: Math.floor((new Date().getTime() - new Date(site.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        accommodation: site.accommodation_address,
        manager_phone: site.construction_manager_phone || site.safety_manager_phone
      })) || []
      
      setSites(processedSites)
      
      // 첫 번째 현장 자동 선택
      if (processedSites.length > 0 && !selectedSite) {
        setSelectedSite(processedSites[0])
        setShowDetail(false)
      }
      
      // 통계 정보 가져오기 (비동기)
      fetchSiteStats(processedSites)
      
    } catch (err) {
      console.error('Error fetching sites:', err)
    } finally {
      setLoading(false)
    }
  }

  // 현장별 통계 정보 가져오기
  const fetchSiteStats = async (sitesData: ExtendedSite[]) => {
    const sitesWithStats = await Promise.all(
      sitesData.map(async (site) => {
        try {
          // 일일 보고서 수
          const { data: dailyReports } = await supabase
            .from('daily_reports')
            .select('id')
            .eq('site_id', site.id)
          
          // 총 공수 계산
          let totalManhours = 0
          if (dailyReports && dailyReports.length > 0) {
            const reportIds = dailyReports.map(r => r.id)
            const { data: assignments } = await supabase
              .from('work_records')
              .select('labor_hours')
              .in('daily_report_id', reportIds)
            
            if (assignments) {
              totalManhours = assignments.reduce((sum, a) => sum + (Number(a.labor_hours) || 0), 0)
            }
          }
          
          return {
            ...site,
            total_manhours: totalManhours,
            total_reports: dailyReports?.length || 0
          }
        } catch (error) {
          return site
        }
      })
    )
    
    setSites(sitesWithStats)
  }

  useEffect(() => {
    fetchSites()
  }, [])

  // 현장 선택
  const handleSiteSelect = (site: ExtendedSite) => {
    setSelectedSite(site)
    setShowDetail(false)
    setExpandedField(null)
  }

  // 현장 상세 페이지로 이동
  const handleSiteDetail = (site: ExtendedSite) => {
    router.push(`/dashboard/admin/sites/${site.id}`)
  }

  // 필드 확장 토글
  const toggleFieldExpansion = (field: string) => {
    setExpandedField(expandedField === field ? null : field)
  }

  // 검색 및 정렬된 현장 목록
  const filteredSites = sites
    .filter(site => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        site.name.toLowerCase().includes(search) ||
        site.address?.toLowerCase().includes(search) ||
        site.manager_name?.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ko')
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  return (
    <div className="space-y-4">
      {/* 현장 정보 카드 */}
      <div className="site-info-card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="site-name">
              <Building className="h-5 w-5 text-blue-600" />
              {selectedSite ? selectedSite.name : '현장 미선택'}
            </div>
            {selectedSite && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('ko-KR')}
                </span>
                <button
                  onClick={() => setShowDetail(!showDetail)}
                  className="btn-detail"
                >
                  {showDetail ? '간략히' : '상세'}
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedSite && (
          <div className="p-4">
            {/* 기본 정보 */}
            <div className="info-section space-y-2">
              <div className="info-row">
                <span className="info-label">소속</span>
                <span className="info-val">{selectedSite.company || 'INOPNC'}</span>
              </div>
              
              <div className="info-row">
                <span className="info-label">안전</span>
                <span className="info-val flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  무사고 {selectedSite.accident_free_days || 0}일
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">주소</span>
                <span 
                  className={cn(
                    "info-val expandable",
                    expandedField === 'address' && "expanded"
                  )}
                  onClick={() => toggleFieldExpansion('address')}
                >
                  {expandedField === 'address' 
                    ? selectedSite.address || '주소 없음'
                    : (selectedSite.address?.substring(0, 25) || '주소 없음') + 
                      (selectedSite.address && selectedSite.address.length > 25 ? '...' : '')
                  }
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">숙소</span>
                <span 
                  className={cn(
                    "info-val expandable",
                    expandedField === 'accommodation' && "expanded"
                  )}
                  onClick={() => toggleFieldExpansion('accommodation')}
                >
                  {expandedField === 'accommodation'
                    ? selectedSite.accommodation || '숙소 정보 없음'
                    : (selectedSite.accommodation?.substring(0, 25) || '숙소 정보 없음') + 
                      (selectedSite.accommodation && selectedSite.accommodation.length > 25 ? '...' : '')
                  }
                </span>
              </div>
            </div>

            {/* 상세 정보 */}
            {showDetail && (
              <div className="border-t pt-3 mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">현장 담당자</div>
                    <div className="text-sm font-medium">{selectedSite.manager_name || '미정'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">연락처</div>
                    <div className="text-sm font-medium">{selectedSite.manager_phone || '미정'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">작업자 수</div>
                    <div className="text-sm font-medium">{selectedSite.worker_count || 0}명</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">총 공수</div>
                    <div className="text-sm font-medium">{selectedSite.total_manhours?.toFixed(1) || 0}시간</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">작업일지</div>
                    <div className="text-sm font-medium">{selectedSite.total_reports || 0}건</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">상태</div>
                    <div className="text-sm font-medium">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        selectedSite.status === 'active' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {selectedSite.status === 'active' ? '진행중' : '종료'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">시작일</div>
                    <div className="text-sm font-medium">
                      {selectedSite.start_date ? new Date(selectedSite.start_date).toLocaleDateString('ko-KR') : '미정'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">종료일</div>
                    <div className="text-sm font-medium">
                      {selectedSite.end_date ? new Date(selectedSite.end_date).toLocaleDateString('ko-KR') : '미정'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 h-12 bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => handleSiteDetail(selectedSite)}
              >
                <Eye className="h-4 w-4 mr-2" />
                상세관리
              </Button>
              <Button 
                className="flex-1 h-12 bg-blue-900 text-white hover:bg-blue-800"
                onClick={() => router.push(`/dashboard/admin/sites/${selectedSite.id}/documents`)}
              >
                <FileText className="h-4 w-4 mr-2" />
                현장문서함
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 현장 검색 및 목록 카드 */}
      <Card>
        <div className="p-4">
          <div className="space-y-3">
            {/* 검색바 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="현장명, 주소, 담당자 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                새 현장
              </Button>
            </div>

            {/* 정렬 버튼 */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                className="text-xs"
              >
                최신순
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'name' ? 'default' : 'outline'}
                onClick={() => setSortBy('name')}
                className="text-xs"
              >
                이름순
              </Button>
              <div className="ml-auto text-sm text-gray-500">
                총 {filteredSites.length}개 현장
              </div>
            </div>
          </div>

          {/* 현장 리스트 */}
          <div className="mt-4 bg-gray-50 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">로딩중...</div>
            ) : filteredSites.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchTerm ? '검색 결과가 없습니다' : '등록된 현장이 없습니다'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredSites.map((site) => (
                  <div
                    key={site.id}
                    className={cn(
                      "p-4 hover:bg-gray-100 cursor-pointer transition-colors bg-white",
                      selectedSite?.id === site.id && "bg-blue-50 hover:bg-blue-100"
                    )}
                    onClick={() => handleSiteSelect(site)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-blue-900">
                            {site.name}
                          </span>
                          {site.id === selectedSite?.id && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              선택됨
                            </span>
                          )}
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            site.status === 'active' 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-700"
                          )}>
                            {site.status === 'active' ? '진행중' : '종료'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {site.address || '주소 없음'}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {site.worker_count || 0}명
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {site.start_date ? new Date(site.start_date).toLocaleDateString('ko-KR') : '미정'}
                          </span>
                          {site.manager_name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {site.manager_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 현장 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">새 현장 추가</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              const data = {
                name: formData.get('name') as string,
                address: formData.get('address') as string,
                description: formData.get('description') as string,
                manager_name: formData.get('manager_name') as string,
                safety_manager_name: formData.get('safety_manager_name') as string,
                start_date: formData.get('start_date') as string,
                end_date: formData.get('end_date') as string,
              }
              handleCreateSite(data)
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">현장명 *</label>
                <Input name="name" required placeholder="현장명을 입력하세요" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">주소 *</label>
                <Input name="address" required placeholder="현장 주소를 입력하세요" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea 
                  name="description" 
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="현장 설명을 입력하세요"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">현장 담당자</label>
                  <Input name="manager_name" placeholder="담당자명" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">안전 관리자</label>
                  <Input name="safety_manager_name" placeholder="안전관리자명" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">시작일 *</label>
                  <Input name="start_date" type="date" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">종료일</label>
                  <Input name="end_date" type="date" />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  취소
                </Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                  생성
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// 현장 생성 함수
async function handleCreateSite(formData: any) {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다.')

    const { data, error } = await supabase
      .from('sites')
      .insert([{
        name: formData.name,
        address: formData.address,
        description: formData.description || null,
        manager_name: formData.manager_name || null,
        safety_manager_name: formData.safety_manager_name || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        status: 'active',
        created_by: user.id
      }])
      .select()
      .single()

    if (error) throw error

    window.location.reload()
  } catch (error) {
    console.error('Error creating site:', error)
    alert('현장 생성에 실패했습니다.')
  }
}