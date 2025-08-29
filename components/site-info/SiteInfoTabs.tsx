'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/custom-select'
import { 
  MapPin, 
  Package, 
  Building2,
  Users,
  Clock,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { CurrentUserSite, UserSiteHistory } from '@/types'
import { MaterialManagementSimplified } from '@/components/materials/material-management-simplified'
import TodaySiteInfo from '@/components/site-info/TodaySiteInfo'
import { Button } from '@/components/ui/button'
import { getMaterials, getMaterialCategories, getMaterialInventory } from '@/app/actions/materials'
import SiteSearchModal from '@/components/site-info/SiteSearchModal'
import SiteDetailModal from '@/components/site-info/SiteDetailModal'
import { selectUserSite } from '@/app/actions/site-info'
import { createClient } from '@/lib/supabase/client'

interface SiteInfoTabsProps {
  initialCurrentSite: CurrentUserSite | null
  initialSiteHistory: UserSiteHistory[]
  currentUser: any
}

export default function SiteInfoTabs({ 
  initialCurrentSite, 
  initialSiteHistory,
  currentUser 
}: SiteInfoTabsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSite, setSelectedSite] = useState<CurrentUserSite | null>(initialCurrentSite)
  const [siteHistory, setSiteHistory] = useState<UserSiteHistory[]>(initialSiteHistory)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showSiteDetailModal, setShowSiteDetailModal] = useState(false)
  const [selectedSiteForDetail, setSelectedSiteForDetail] = useState<UserSiteHistory | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(true)
  
  // Materials data for materials tab
  const [materials, setMaterials] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [materialsLoaded, setMaterialsLoaded] = useState(false)

  // Get current user ID and auto-select first site on mount
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Auto-select first site if no current site and history exists
        if (!initialCurrentSite && initialSiteHistory.length > 0) {
          const firstSite = initialSiteHistory[0]
          const result = await selectUserSite(firstSite.site_id)
          
          if (result.success) {
            const currentSite: CurrentUserSite = {
              site_id: firstSite.site_id,
              site_name: firstSite.site_name,
              site_address: firstSite.site_address,
              site_status: firstSite.site_status,
              start_date: firstSite.assigned_date,
              end_date: firstSite.unassigned_date,
              accommodation_address: null,
              accommodation_name: null,
              work_process: firstSite.work_process,
              work_section: firstSite.work_section,
              component_name: null,
              manager_name: null,
              safety_manager_name: null,
              construction_manager_phone: null,
              safety_manager_phone: null
            }
            setSelectedSite(currentSite)
          }
        }
      }
    }
    getUser()
  }, [])

  // Load materials data when materials tab is activated or site changes
  useEffect(() => {
    if (activeTab === 'materials' && selectedSite) {
      loadMaterialsData()
    }
  }, [activeTab, selectedSite])

  const loadMaterialsData = async () => {
    if (!selectedSite) return
    
    setMaterialsLoading(true)
    try {
      const [materialsResult, categoriesResult] = await Promise.all([
        getMaterials(),
        getMaterialCategories()
      ])

      if (materialsResult.success) setMaterials(materialsResult.data || [])
      if (categoriesResult.success) setCategories(categoriesResult.data || [])

      // Get inventory for selected site
      const inventoryResult = await getMaterialInventory(selectedSite.site_id)
      if (inventoryResult.success) setInventory(inventoryResult.data || [])
      
    } catch (error) {
      console.error('Error loading materials data:', error)
    } finally {
      setMaterialsLoading(false)
    }
  }

  // Handle site selection
  const handleSiteChange = async (siteId: string) => {
    // Find the selected site from history
    const targetSite = siteHistory.find(site => site.site_id === siteId)
    if (!targetSite) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await selectUserSite(siteId)
      
      if (!result.success) {
        setError(result.error || '현장 변경에 실패했습니다.')
        return
      }
      
      // Update selected site based on history data
      const updatedCurrentSite: CurrentUserSite = {
        site_id: targetSite.site_id,
        site_name: targetSite.site_name,
        site_address: targetSite.site_address,
        site_status: targetSite.site_status,
        start_date: targetSite.assigned_date,
        end_date: targetSite.unassigned_date,
        accommodation_address: null,
        accommodation_name: null,
        work_process: targetSite.work_process,
        work_section: targetSite.work_section,
        component_name: null,
        manager_name: null,
        safety_manager_name: null,
        construction_manager_phone: null,
        safety_manager_phone: null
      }
      
      setSelectedSite(updatedCurrentSite)
      
    } catch (err) {
      console.error('Error switching site:', err)
      setError('현장 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // Handle site detail modal
  const handleSiteDetailClick = (site: UserSiteHistory) => {
    setSelectedSiteForDetail(site)
    setShowSiteDetailModal(true)
  }

  const handleSelectCurrentSiteFromDetail = () => {
    if (selectedSiteForDetail) {
      handleSiteChange(selectedSiteForDetail.site_id)
    }
  }

  // Convert CurrentUserSite to SiteInfo format for TodaySiteInfo component
  const convertToSiteInfo = (site: CurrentUserSite | null) => {
    if (!site) return null

    return {
      id: site.site_id,
      name: site.site_name,
      address: {
        id: site.site_id,
        site_id: site.site_id,
        full_address: site.site_address || '주소 정보 없음',
        latitude: undefined,
        longitude: undefined,
        postal_code: undefined
      },
      accommodation: site.accommodation_address ? {
        id: site.site_id,
        site_id: site.site_id,
        accommodation_name: site.accommodation_name || '숙소',
        full_address: site.accommodation_address,
        latitude: undefined,
        longitude: undefined
      } : undefined,
      process: {
        member_name: site.component_name || '미정',
        work_process: site.work_process || '미정',
        work_section: site.work_section || '미정',
        drawing_id: undefined
      },
      managers: [
        ...(site.construction_manager_phone ? [{
          role: 'construction_manager' as const,
          name: site.manager_name || '현장 소장',
          phone: site.construction_manager_phone
        }] : []),
        ...(site.safety_manager_phone ? [{
          role: 'safety_manager' as const,
          name: site.safety_manager_name || '안전 관리자',
          phone: site.safety_manager_phone
        }] : [])
      ],
      construction_period: {
        start_date: site.start_date,
        end_date: site.end_date || ''
      },
      is_active: site.site_status === 'active'
    }
  }

  const siteInfo = convertToSiteInfo(selectedSite)

  // Touch-responsive padding based on UI Guidelines
  const getPadding = () => {
    if (touchMode === 'glove') return 'p-4 sm:p-6' // Construction field use
    if (touchMode === 'precision') return 'p-3 sm:p-4' // Dense layouts
    return 'p-3 sm:p-4' // High-density information layout
  }

  const getButtonSize = () => {
    if (touchMode === 'glove') return 'field' // 60px height
    if (touchMode === 'precision') return 'compact' // 44px height
    return isLargeFont ? 'standard' : 'compact' // 48px standard
  }

  // Tab touch target optimization
  const getTabHeight = () => {
    if (touchMode === 'glove') return 'min-h-[60px]' // Construction field standard
    if (touchMode === 'precision') return 'min-h-[44px]' // Dense layout
    return 'min-h-[48px]' // Standard mobile
  }

  // Icon size optimization for construction field visibility
  const getIconSize = () => {
    if (touchMode === 'glove') return 'h-6 w-6'
    if (isLargeFont) return 'h-5 w-5'
    return 'h-4 w-4'
  }

  return (
    <div className="w-full">
      {/* Header - Compact Layout */}
      <div className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-0 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className={`${getFullTypographyClass('heading', isLargeFont ? '2xl' : 'xl', isLargeFont)} font-bold text-gray-900 dark:text-gray-100`}>
              현장정보
            </h1>
            <p className={`mt-0.5 ${getFullTypographyClass('body', 'xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>
              현장별 통합 관리 시스템
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Site Selection Dropdown - Compact */}
            <Select value={selectedSite?.site_id || ''} onValueChange={handleSiteChange}>
              <SelectTrigger className={`
                w-full sm:w-[180px] 
                ${touchMode === 'glove' ? 'min-h-[60px]' : 
                  touchMode === 'precision' ? 'min-h-[44px]' : 
                  'min-h-[48px]'
                }
                ${getFullTypographyClass('body', 'sm', isLargeFont)}
              `}>
                <SelectValue placeholder="현장을 선택하세요" />
              </SelectTrigger>
              <SelectContent 
                className={`
                  ${touchMode === 'glove' ? 'p-2' : 'p-1'}
                  max-w-[90vw] sm:max-w-none
                  bg-white dark:bg-gray-800 
                  border border-gray-200 dark:border-gray-700
                  shadow-lg backdrop-blur-sm
                  z-50
                `}
                sideOffset={4}
              >
                {siteHistory.map((site) => (
                  <SelectItem 
                    key={site.site_id} 
                    value={site.site_id}
                    className={`
                      ${touchMode === 'glove' ? 'min-h-[56px] px-4 py-3' : 
                        touchMode === 'precision' ? 'min-h-[40px] px-3 py-2' : 
                        'min-h-[44px] px-3 py-2'
                      }
                      ${getFullTypographyClass('body', 'sm', isLargeFont)}
                    `}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="flex-1 truncate">{site.site_name}</span>
                      {site.is_active && (
                        <span className={`
                          px-1.5 py-0.5 bg-green-100 text-green-700 rounded
                          ${getFullTypographyClass('caption', 'xs', isLargeFont)}
                        `}>
                          현재
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size={getButtonSize()}
              onClick={() => setShowSearchModal(true)}
              className="gap-2 px-3"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">현장 변경</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Compact Layout */}
      <div className="space-y-4 px-0 py-4">
        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <div className="p-4">
              <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-red-800 dark:text-red-200`}>
                {error}
              </p>
            </div>
          </Card>
        )}

        {/* Tabs - Compact Layout */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className={`grid w-full grid-cols-2 ${getTabHeight()} gap-1`}>
            <TabsTrigger 
              value="overview" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 ${getTabHeight()}`}
            >
              <MapPin className={getIconSize()} />
              <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} sm:text-sm text-center`}>
                현장 개요
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2 py-2 ${getTabHeight()}`}
            >
              <Package className={getIconSize()} />
              <span className={`${getFullTypographyClass('body', 'xs', isLargeFont)} sm:text-sm text-center`}>
                NPC-1000 관리
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-4">
            {/* Current Site Info */}
            <TodaySiteInfo 
              siteInfo={siteInfo}
              loading={loading}
              error={error ? new Error(error) : null}
            />

            {/* Site History */}
            <Card elevation="sm" className="theme-transition overflow-hidden">
              <button
                onClick={() => setSiteHistoryExpanded(!siteHistoryExpanded)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors theme-transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 이력</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{siteHistory.length}개 현장</span>
                  </div>
                  {siteHistoryExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
              </button>
              
              {siteHistoryExpanded && (
                siteHistory.length === 0 ? (
                  <div className={`text-center ${getPadding()} py-6`}>
                    <Clock className={`
                      ${touchMode === 'glove' ? 'h-12 w-12' : 'h-10 w-10'} 
                      text-gray-400 mx-auto mb-3
                    `} />
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400 mb-4`}>
                      참여한 현장이 없습니다
                    </p>
                    <Button 
                      onClick={() => setShowSearchModal(true)} 
                      size={getButtonSize()}
                      className="gap-2"
                    >
                      <Search className={getIconSize()} />
                      현장 찾기
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
                    {siteHistory.map((site, index) => (
                      <button
                        key={`${site.site_id}-${index}`} 
                        onClick={() => handleSiteDetailClick(site)}
                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors theme-transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
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
                      </button>
                    ))}
                  </div>
                )
              )}
            </Card>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            {selectedSite ? (
              materialsLoading ? (
                <Card>
                  <div className={`${getPadding()} text-center py-6`}>
                    <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
                    <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      자재 정보를 불러오는 중...
                    </p>
                  </div>
                </Card>
              ) : (
                <MaterialManagementSimplified 
                  materials={materials}
                  categories={categories}
                  initialInventory={inventory}
                  currentUser={currentUser}
                  currentSite={selectedSite}
                />
              )
            ) : (
              <Card>
                <div className={`${getPadding()} text-center py-6`}>
                  <Package className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className={`${getFullTypographyClass('body', 'sm', isLargeFont)} text-gray-500 dark:text-gray-400 mb-3`}>
                    현장을 선택하여 자재 현황을 확인하세요
                  </p>
                  <Button 
                    onClick={() => setShowSearchModal(true)} 
                    size={getButtonSize()}
                    className="gap-2"
                  >
                    <Search className={getIconSize()} />
                    현장 선택
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>

        </Tabs>

        {/* Site Search Modal */}
        <SiteSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelectSite={(siteId) => {
            setShowSearchModal(false)
            handleSiteChange(siteId)
          }}
          currentSiteId={selectedSite?.site_id}
        />

        {/* Site Detail Modal */}
        <SiteDetailModal
          isOpen={showSiteDetailModal}
          onClose={() => {
            setShowSiteDetailModal(false)
            setSelectedSiteForDetail(null)
          }}
          siteData={selectedSiteForDetail}
          onSelectCurrentSite={handleSelectCurrentSiteFromDetail}
        />
      </div>
    </div>
  )
}