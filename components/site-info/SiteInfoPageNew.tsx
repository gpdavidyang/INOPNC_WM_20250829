'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { cn } from '@/lib/utils'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { 
  MapPin, 
  Users,
  Building,
  Clock,
  FileText,
  Download,
  ExternalLink,
  Package,
  Search,
  Copy,
  Phone,
  Navigation,
  Calendar
} from 'lucide-react'
import { CurrentUserSite, UserSiteHistory, Profile } from '@/types'
import { selectUserSite } from '@/app/actions/site-info'
import { MaterialManagementSimplified } from '@/components/materials/material-management-simplified'
import { getMaterials, getMaterialCategories, getMaterialInventory } from '@/app/actions/materials'
import { LoadingState, EmptyState } from '@/components/dashboard/page-layout'

interface SiteInfoPageNewProps {
  initialCurrentSite: CurrentUserSite | null
  initialSiteHistory: UserSiteHistory[]
  currentUser: Profile
}

export default function SiteInfoPageNew({
  initialCurrentSite,
  initialSiteHistory,
  currentUser
}: SiteInfoPageNewProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  // State
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all') // For filter dropdown
  const [siteHistory] = useState<UserSiteHistory[]>(initialSiteHistory)
  const [filteredSiteHistory, setFilteredSiteHistory] = useState<UserSiteHistory[]>(initialSiteHistory)
  const [selectedDateRange, setSelectedDateRange] = useState<string>('최근12개월')
  const [selectedSiteForDetail, setSelectedSiteForDetail] = useState<UserSiteHistory | null>(null)
  const [loading, setLoading] = useState(false)
  
  // Materials data for NPC-1000 tab
  const [materials, setMaterials] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)

  // Date range options
  const dateRangeOptions = [
    { value: '금월', label: '금월', getMonthsBack: () => 1 },
    { value: '최근3개월', label: '최근3개월', getMonthsBack: () => 3 },
    { value: '최근6개월', label: '최근6개월', getMonthsBack: () => 6 },
    { value: '최근12개월', label: '최근12개월', getMonthsBack: () => 12 },
    { value: '최근24개월', label: '최근24개월', getMonthsBack: () => 24 }
  ]


  // Filter site history based on selected date range and site
  useEffect(() => {
    const selectedOption = dateRangeOptions.find(opt => opt.value === selectedDateRange)
    const monthsToLoad = selectedOption?.getMonthsBack() || 12
    
    const currentDate = new Date()
    const cutoffDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthsToLoad, 1)
    
    let filtered = siteHistory.filter(site => {
      const assignedDate = new Date(site.assigned_date)
      return assignedDate >= cutoffDate
    })
    
    // Apply site filter
    if (selectedSiteId !== 'all') {
      filtered = filtered.filter(site => site.site_id === selectedSiteId)
    }
    
    setFilteredSiteHistory(filtered)
  }, [siteHistory, selectedDateRange, selectedSiteId])

  // Load materials data when NPC-1000 tab is activated
  useEffect(() => {
    if (activeTab === 'materials') {
      loadMaterialsData()
    }
  }, [activeTab])

  const loadMaterialsData = async () => {
    // Use first site from history if available
    const firstSite = siteHistory[0]
    console.log('🔍 [NPC-1000] Loading materials data...', { firstSite: firstSite?.site_name, siteId: firstSite?.site_id })
    
    if (!firstSite) {
      console.warn('⚠️ [NPC-1000] No site available for loading materials data')
      return
    }
    
    setMaterialsLoading(true)
    try {
      console.log('🔍 [NPC-1000] Calling materials APIs...')
      const [materialsResult, categoriesResult] = await Promise.all([
        getMaterials(),
        getMaterialCategories()
      ])

      console.log('🔍 [NPC-1000] Materials result:', { 
        success: materialsResult.success, 
        count: materialsResult.data?.length || 0,
        error: materialsResult.error 
      })
      console.log('🔍 [NPC-1000] Categories result:', { 
        success: categoriesResult.success, 
        count: categoriesResult.data?.length || 0,
        error: categoriesResult.error 
      })

      if (materialsResult.success) setMaterials(materialsResult.data || [])
      if (categoriesResult.success) setCategories(categoriesResult.data || [])

      // Get inventory for first site
      console.log('🔍 [NPC-1000] Calling inventory API for site:', firstSite.site_id)
      const inventoryResult = await getMaterialInventory(firstSite.site_id)
      console.log('🔍 [NPC-1000] Inventory result:', { 
        success: inventoryResult.success, 
        count: inventoryResult.data?.length || 0,
        error: inventoryResult.error 
      })
      
      if (inventoryResult.success) setInventory(inventoryResult.data || [])
      
    } catch (error) {
      console.error('❌ [NPC-1000] Error loading materials data:', error)
    } finally {
      setMaterialsLoading(false)
    }
  }


  // UI 크기 계산 - UI Guidelines 기준
  const getTabHeight = () => {
    if (touchMode === 'glove') return 'min-h-[60px]' // Construction field standard
    if (touchMode === 'precision') return 'min-h-[44px]' // Dense layout
    return 'min-h-[48px]' // Standard mobile
  }

  const getButtonHeight = () => {
    if (touchMode === 'glove') return 'h-[60px]' // Construction field
    if (touchMode === 'precision') return 'h-[44px]' // Dense layout
    return 'h-[48px]' // Standard
  }

  const getCardPadding = () => {
    if (touchMode === 'glove') return 'p-4'
    return 'p-3'
  }

  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field' // 60px height
    if (touchMode === 'precision') return 'compact' // 44px height  
    return isLargeFont ? 'standard' : 'compact' // 48px standard
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '미정'
    return new Date(dateStr).toLocaleDateString('ko-KR')
  }

  const formatPhone = (phone: string | null | undefined) => {
    if (!phone) return '연락처 없음'
    return phone
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const makePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <LoadingState description="현장 정보를 불러오는 중..." />
      </div>
    )
  }


  return (
    <div className="space-y-3">
      
      {/* Button Style Navigation - Consistent with 출력정보 design */}
      <div className="flex gap-3 mb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
            "min-h-[48px] flex items-center justify-center gap-2",
            activeTab === 'overview' 
              ? "bg-toss-blue-600 text-white shadow-lg" 
              : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500",
            touchMode === 'glove' && "min-h-[60px] text-base",
            touchMode === 'precision' && "min-h-[44px] text-sm",
            touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
          )}
        >
          <MapPin className={getIconSize()} />
          <span>현장 개요</span>
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
            "min-h-[48px] flex items-center justify-center gap-2",
            activeTab === 'materials' 
              ? "bg-toss-blue-600 text-white shadow-lg" 
              : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500",
            touchMode === 'glove' && "min-h-[60px] text-base",
            touchMode === 'precision' && "min-h-[44px] text-sm",
            touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
          )}
        >
          <Package className={getIconSize()} />
          <span>NPC-1000 관리</span>
        </button>
      </div>

        {/* Filter Section - Site Selection and Date Range */}
        <div className="space-y-3 mb-6">
          {/* Site Filter for History List */}
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className={cn(
              "w-full",
              touchMode === 'glove' ? 'min-h-[60px]' : 
                touchMode === 'precision' ? 'min-h-[44px]' : 
                'min-h-[48px]',
              isLargeFont ? 'text-base' : 'text-sm'
            )}>
              <SelectValue>
                {selectedSiteId === 'all' ? '전체 현장' : siteHistory.find(s => s.site_id === selectedSiteId)?.site_name || '현장을 선택하세요'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              className={cn(
                touchMode === 'glove' ? 'p-2' : 'p-1',
                "max-w-[90vw] sm:max-w-none",
                "bg-white dark:bg-gray-800", 
                "border border-gray-200 dark:border-gray-700",
                "shadow-lg backdrop-blur-sm",
                "z-50"
              )}
              sideOffset={4}
            >
              <SelectItem 
                value="all"
                className={cn(
                  touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                    touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                    'min-h-[44px] px-3 py-2',
                  isLargeFont ? 'text-base' : 'text-sm'
                )}
              >
                전체 현장
              </SelectItem>
              {siteHistory.map((site, index) => (
                <SelectItem 
                  key={`${site.site_id}-${site.assigned_date}-${index}`} 
                  value={site.site_id}
                  className={cn(
                    touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                      touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                      'min-h-[44px] px-3 py-2',
                    isLargeFont ? 'text-base' : 'text-sm'
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="flex-1 truncate">{site.site_name}</span>
                    {site.is_active && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs dark:bg-green-900/20 dark:text-green-400">
                        현재
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Selection - Only show on overview tab */}
          {activeTab === 'overview' && (
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className={cn(
                "w-full",
                touchMode === 'glove' ? 'min-h-[60px]' : 
                  touchMode === 'precision' ? 'min-h-[44px]' : 
                  'min-h-[48px]',
                isLargeFont ? 'text-base' : 'text-sm'
              )}>
                <SelectValue>
                  {selectedDateRange}
                </SelectValue>
              </SelectTrigger>
              <SelectContent 
                className={cn(
                  touchMode === 'glove' ? 'p-2' : 'p-1',
                  "max-w-[90vw] sm:max-w-none",
                  "bg-white dark:bg-gray-800", 
                  "border border-gray-200 dark:border-gray-700",
                  "shadow-lg backdrop-blur-sm",
                  "z-50"
                )}
                sideOffset={4}
              >
                {dateRangeOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className={cn(
                      touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                        touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                        'min-h-[44px] px-3 py-2',
                      isLargeFont ? 'text-base' : 'text-sm'
                    )}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-3 mt-6">
            {/* 현장 참여 이력 */}
                <Card elevation="sm" className="theme-transition overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 목록</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{filteredSiteHistory.length}개 현장</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {filteredSiteHistory.map((site, index) => (
                      <div
                        key={`${site.site_id}-${index}`} 
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                          selectedSiteForDetail?.site_id === site.site_id && 
                          "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                        )}
                        onClick={() => setSelectedSiteForDetail(
                          selectedSiteForDetail?.site_id === site.site_id ? null : site
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {site.site_name}
                              </h4>
                              {site.is_active && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                  현재
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                site.user_role === 'site_manager' 
                                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                  : site.user_role === 'supervisor'
                                  ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                              }`}>
                                {site.user_role === 'site_manager' ? '현장관리자' : 
                                 site.user_role === 'supervisor' ? '감독관' : '작업자'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{site.site_address}</p>
                            
                            {/* Work details if available */}
                            {(site.work_process || site.work_section) && (
                              <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                                {site.work_process && <span>{site.work_process}</span>}
                                {site.work_process && site.work_section && <span className="mx-1">•</span>}
                                {site.work_section && <span>{site.work_section}</span>}
                              </div>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(site.assigned_date).toLocaleDateString('ko-KR', {
                                year: '2-digit',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                              {site.unassigned_date && !site.is_active && (
                                <>
                                  <span className="mx-1">~</span>
                                  {new Date(site.unassigned_date).toLocaleDateString('ko-KR', {
                                    year: '2-digit',
                                    month: '2-digit',
                                    day: '2-digit'
                                  })}
                                </>
                              )}
                            </div>
                            <div className={`text-xs mt-1 ${
                              site.site_status === 'active' 
                                ? 'text-green-600 dark:text-green-400'
                                : site.site_status === 'completed'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {site.site_status === 'active' ? '진행중' :
                               site.site_status === 'completed' ? '완료' : '중지'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Selected Site Details */}
                {selectedSiteForDetail && (
                  <Card elevation="sm" className="theme-transition overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 상세정보</h3>
                          <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">{selectedSiteForDetail.site_name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSiteForDetail(null)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white dark:bg-gray-800">
                      {/* 현장 기본 정보 */}
                      <div className="space-y-3">
                        
                        {/* 현장 주소 */}
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 주소</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
                            {selectedSiteForDetail.site_address}
                          </p>
                          <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" onClick={() => copyToClipboard(selectedSiteForDetail.site_address)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" onClick={() => window.open(`https://tmapapi.sktelecom.com/main.html#weblink/search?query=${encodeURIComponent(selectedSiteForDetail.site_address)}`)}>
                            <Navigation className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 참여 기간 */}
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">참여 기간</span>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatDate(selectedSiteForDetail.assigned_date)}
                            {selectedSiteForDetail.unassigned_date && !selectedSiteForDetail.is_active && (
                              <> ~ {formatDate(selectedSiteForDetail.unassigned_date)}</>
                            )}
                            {selectedSiteForDetail.is_active && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                                현재 참여중
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 역할 */}
                        <div className="flex items-center gap-3">
                          <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">담당 역할</span>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            selectedSiteForDetail.user_role === 'site_manager' 
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : selectedSiteForDetail.user_role === 'supervisor'
                              ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          )}>
                            {selectedSiteForDetail.user_role === 'site_manager' ? '현장관리자' : 
                             selectedSiteForDetail.user_role === 'supervisor' ? '감독관' : '작업자'}
                          </span>
                        </div>

                        {/* 작업 정보 */}
                        {(selectedSiteForDetail.work_process || selectedSiteForDetail.work_section) && (
                          <div className="flex items-start gap-3">
                            <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">작업 내용</span>
                              <p className="text-sm text-gray-900 dark:text-gray-100">
                                {selectedSiteForDetail.work_process}
                                {selectedSiteForDetail.work_process && selectedSiteForDetail.work_section && ' • '}
                                {selectedSiteForDetail.work_section}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 현장 상태 */}
                        <div className="flex items-center gap-3">
                          <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 상태</span>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            selectedSiteForDetail.site_status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : selectedSiteForDetail.site_status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                          )}>
                            {selectedSiteForDetail.site_status === 'active' ? '진행중' :
                             selectedSiteForDetail.site_status === 'completed' ? '완료' : '중지'}
                          </span>
                        </div>

                      </div>
                    </div>
                  </Card>
                )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="space-y-3 mt-0">
            {siteHistory.length > 0 ? (
              materialsLoading ? (
                <LoadingState description="자재 정보를 불러오는 중..." />
              ) : (
                <MaterialManagementSimplified 
                  materials={materials}
                  categories={categories}
                  initialInventory={inventory}
                  currentUser={currentUser}
                  currentSite={{
                    site_id: siteHistory[0].site_id,
                    site_name: siteHistory[0].site_name,
                    site_address: siteHistory[0].site_address,
                    site_status: siteHistory[0].site_status,
                    start_date: siteHistory[0].start_date,
                    end_date: siteHistory[0].end_date,
                    assigned_date: siteHistory[0].assigned_date,
                    user_role: siteHistory[0].user_role,
                    work_process: siteHistory[0].work_process,
                    work_section: siteHistory[0].work_section,
                    component_name: null,
                    manager_name: null,
                    construction_manager_phone: null,
                    safety_manager_name: null,
                    safety_manager_phone: null,
                    accommodation_name: null,
                    accommodation_address: null,
                    ptw_document_id: null,
                    ptw_document_title: 'PTW (작업허가서)',
                    ptw_document_url: '/docs/PTW.pdf',
                    ptw_document_filename: 'PTW.pdf',
                    ptw_document_mime_type: 'application/pdf',
                    blueprint_document_id: null,
                    blueprint_document_title: '현장 공도면',
                    blueprint_document_url: '/docs/샘플도면3.jpeg',
                    blueprint_document_filename: '샘플도면3.jpeg',
                    blueprint_document_mime_type: 'image/jpeg'
                  }}
                />
              )
            ) : (
              <EmptyState
                icon={<Package className="h-10 w-10" />}
                title="현장 정보가 없습니다"
                description="자재 현황을 확인할 수 있는 현장이 없습니다."
              />
            )}
          </div>
        )}
    </div>
  )
}