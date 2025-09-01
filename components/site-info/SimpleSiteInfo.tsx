'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronDown, ChevronUp, MapPin, Phone, Building2, HardHat, FileText, Image, Copy, Navigation, Check, X, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useFontSize, getTypographyClass } from '@/contexts/FontSizeContext'
import { toast } from 'sonner'
import { TMap } from '@/lib/external-apps'
import { getSiteDocumentsPTWAndBlueprint, SiteDocument } from '@/app/actions/site-documents'

interface SimpleSiteInfoProps {
  userId: string
  userRole: string
}

export default function SimpleSiteInfo({ userId, userRole }: SimpleSiteInfoProps) {
  const { isLargeFont } = useFontSize()
  const [isExpanded, setIsExpanded] = useState(false)
  const [siteData, setSiteData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showBlueprintModal, setShowBlueprintModal] = useState(false)
  const [showPTWModal, setShowPTWModal] = useState(false)
  const [siteDocuments, setSiteDocuments] = useState<{
    ptw_document: SiteDocument | null
    blueprint_document: SiteDocument | null
  } | null>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null)
  
  useEffect(() => {
    fetchSiteData()
  }, [userId])
  
  // Fetch documents when site changes
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!currentSiteId) {
        setSiteDocuments(null)
        return
      }

      setDocumentsLoading(true)
      try {
        const result = await getSiteDocumentsPTWAndBlueprint(currentSiteId)
        if (result.success && result.data) {
          setSiteDocuments(result.data)
        } else {
          console.error('Failed to fetch site documents:', result.error)
          setSiteDocuments(null)
        }
      } catch (error) {
        console.error('Error fetching site documents:', error)
        setSiteDocuments(null)
      } finally {
        setDocumentsLoading(false)
      }
    }

    fetchDocuments()
  }, [currentSiteId])
  
  async function fetchSiteData() {
    const supabase = createClient()
    
    try {
      console.log('[SIMPLE-SITE-INFO] Fetching site data for user:', userId, 'role:', userRole)
      
      // 먼저 사용자 정보 확인
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      console.log('[SIMPLE-SITE-INFO] Current auth user:', user?.email, user?.id)
      
      // 직접 site_assignments 테이블에서 데이터 가져오기
      const { data: assignments, error: assignError } = await supabase
        .from('site_assignments')
        .select(`
          *,
          sites:site_id (
            id,
            name,
            address,
            description,
            manager_name,
            construction_manager_phone,
            safety_manager_name,
            safety_manager_phone,
            accommodation_name,
            accommodation_address,
            work_process,
            work_section
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .single()
      
      if (assignError) {
        console.error('[SIMPLE-SITE-INFO] Error fetching assignment:', assignError)
        // 에러 발생 시 빈 상태로 표시
        setSiteData(null)
        setIsExpanded(false)
        return
      }
      
      if (assignments && assignments.sites) {
        const site = assignments.sites
        setSiteData({
          site_name: site.name,
          site_address: site.address,
          manager_name: site.manager_name || '김현장',
          manager_phone: site.construction_manager_phone || '010-1234-5678',
          safety_manager_name: site.safety_manager_name || '이안전',
          safety_manager_phone: site.safety_manager_phone || '010-2345-6789',
          accommodation_name: site.accommodation_name || '현장 숙소',
          accommodation_address: site.accommodation_address || site.address,
          work_instructions: site.work_process || '일반 건설 작업',
          work_section: site.work_section || 'A구역'
        })
        setCurrentSiteId(site.id)
        setIsExpanded(true) // 데이터가 있으면 자동 확장
      }
      
    } catch (err) {
      console.error('[SIMPLE-SITE-INFO] Unexpected error:', err)
      setError('데이터를 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }
  
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }
  
  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field}가 복사되었습니다`)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('주소 복사에 실패했습니다')
    }
  }

  // Open T-Map navigation
  const openTMap = async (address: string, name: string) => {
    const result = await TMap.navigate({ 
      name, 
      address
    })
    
    if (!result.success && result.error) {
      console.error('Failed to open T-Map:', result.error)
      toast.error('T맵을 열 수 없습니다')
    }
  }
  
  // 로딩 중이거나 데이터가 없으면 표시하지 않음
  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className={`${getTypographyClass('base', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                  오늘의 현장 정보
                </h3>
                <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                  로딩 중...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!siteData) {
    return null // 데이터가 없으면 아무것도 표시하지 않음
  }
  
  return (
    <>
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={toggleExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className={`${getTypographyClass('base', isLargeFont)} font-semibold text-gray-900 dark:text-gray-100`}>
                오늘의 현장 정보
              </h3>
              <p className={`${getTypographyClass('sm', isLargeFont)} text-blue-600 dark:text-blue-400 font-medium`}>
                {siteData.site_name}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-4">
            {/* 현장 주소 */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                    현장 주소
                  </p>
                  <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-900 dark:text-gray-100 font-medium`}>
                    {siteData.site_address}
                  </p>
                </div>
                {/* Action buttons with enhanced visibility */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(siteData.site_address, '현장주소')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all duration-200 group"
                    title="주소 복사"
                  >
                    {copiedField === '현장주소' ? (
                      <>
                        <Check className="h-5 w-5 text-green-500 animate-in zoom-in-50 duration-200" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-500 font-medium">복사</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openTMap(siteData.site_address, siteData.site_name)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all duration-200 group"
                    title="T맵에서 보기"
                  >
                    <Navigation className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-xs text-blue-500 dark:text-blue-400 group-hover:text-blue-600 font-medium">T맵</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 숙소 정보 */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                    숙소
                  </p>
                  <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-900 dark:text-gray-100 font-medium`}>
                    {siteData.accommodation_name}
                  </p>
                  <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-600 dark:text-gray-400`}>
                    {siteData.accommodation_address}
                  </p>
                </div>
                {/* Action buttons with enhanced visibility */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(siteData.accommodation_address, '숙소주소')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all duration-200 group"
                    title="주소 복사"
                  >
                    {copiedField === '숙소주소' ? (
                      <>
                        <Check className="h-5 w-5 text-green-500 animate-in zoom-in-50 duration-200" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs text-gray-600 dark:text-gray-300 group-hover:text-blue-500 font-medium">복사</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openTMap(siteData.accommodation_address, '숙소')
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all duration-200 group"
                    title="T맵에서 보기"
                  >
                    <Navigation className="h-5 w-5 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 transition-colors" />
                    <span className="text-xs text-blue-500 dark:text-blue-400 group-hover:text-blue-600 font-medium">T맵</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* 담당자 연락처 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      현장소장
                    </p>
                    <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-900 dark:text-gray-100 font-medium`}>
                      {siteData.manager_name}
                    </p>
                    <p className={`${getTypographyClass('xs', isLargeFont)} text-blue-600 dark:text-blue-400`}>
                      {siteData.manager_phone}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <HardHat className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                      안전관리자
                    </p>
                    <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-900 dark:text-gray-100 font-medium`}>
                      {siteData.safety_manager_name}
                    </p>
                    <p className={`${getTypographyClass('xs', isLargeFont)} text-blue-600 dark:text-blue-400`}>
                      {siteData.safety_manager_phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3" />
            
            {/* 작업 내용 */}
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className={`${getTypographyClass('xs', isLargeFont)} text-gray-500 dark:text-gray-400`}>
                    작업내용
                  </p>
                  <p className={`${getTypographyClass('sm', isLargeFont)} text-gray-900 dark:text-gray-100 font-medium`}>
                    {siteData.work_section} - {siteData.work_instructions}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 현장 공도면 & PTW 버튼 */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (siteDocuments?.blueprint_document) {
                    setShowBlueprintModal(true)
                  } else {
                    toast.info('현장 공도면이 등록되지 않았습니다')
                  }
                }}
                disabled={documentsLoading}
                className={`flex items-center justify-center gap-2 p-3 ${
                  siteDocuments?.blueprint_document 
                    ? 'bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70' 
                    : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                } rounded-lg transition-colors`}
              >
                <Image className={`h-4 w-4 ${
                  siteDocuments?.blueprint_document
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`} />
                <span className={`${getTypographyClass('sm', isLargeFont)} ${
                  siteDocuments?.blueprint_document
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-600'
                } font-medium`}>
                  현장 공도면
                </span>
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (siteDocuments?.ptw_document) {
                    setShowPTWModal(true)
                  } else {
                    toast.info('PTW 문서가 등록되지 않았습니다')
                  }
                }}
                disabled={documentsLoading}
                className={`flex items-center justify-center gap-2 p-3 ${
                  siteDocuments?.ptw_document
                    ? 'bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/70'
                    : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                } rounded-lg transition-colors`}
              >
                <FileText className={`h-4 w-4 ${
                  siteDocuments?.ptw_document
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400 dark:text-gray-600'
                }`} />
                <span className={`${getTypographyClass('sm', isLargeFont)} ${
                  siteDocuments?.ptw_document
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-600'
                } font-medium`}>
                  PTW 문서
                </span>
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    
    {/* Blueprint Document Modal */}
    {showBlueprintModal && siteDocuments?.blueprint_document && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] m-4 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Image className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {siteDocuments.blueprint_document.title}
              </h2>
            </div>
            <button
              onClick={() => setShowBlueprintModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <iframe
              src={`/api/shared-documents/${siteDocuments.blueprint_document.id}/file`}
              className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
              title="현장 공도면"
            />
          </div>
        </div>
      </div>
    )}
    
    {/* PTW Document Modal */}
    {showPTWModal && siteDocuments?.ptw_document && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] m-4 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {siteDocuments.ptw_document.title}
              </h2>
            </div>
            <button
              onClick={() => setShowPTWModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <iframe
              src={`/api/shared-documents/${siteDocuments.ptw_document.id}/file`}
              className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
              title="PTW 문서"
            />
          </div>
        </div>
      </div>
    )}
    </>
  )
}