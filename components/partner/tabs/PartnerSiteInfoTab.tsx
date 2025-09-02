'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Navigation } from 'lucide-react'
import { 
  Building2, Building, MapPin, Phone, Calendar, Users, 
  FileText, FolderOpen, DollarSign, Camera,
  CheckSquare, FileSignature, Map, X, Clock,
  Copy, ExternalLink, ClipboardList, Eye, Download, Share2, MoreVertical,
  ChevronDown, ChevronUp, Calculator, BarChart3, Shield, CheckCircle,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  CustomSelect,
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/components/ui/custom-select'

interface PartnerSiteInfoTabProps {
  profile: Profile
  sites: any[]
}

interface SiteParticipation {
  id: string
  site_partner_id: string
  name: string
  address: string
  role: string
  work: string
  period: string
  status: string
  startDate: string
  endDate: string | null
  contractValue: number | null
  contractStatus: string
  siteStatus: string
  companyType: string
  tradeType: string[] | null
  notes: string | null
}

interface PartnerDocument {
  id: string
  type: string
  name: string
  title: string
  description: string | null
  uploadDate: string
  uploader: string
  fileSize: number | null
  mimeType: string | null
  fileUrl: string
  categoryType: string
  subType: string | null
  icon: string
}

export default function PartnerSiteInfoTab({ profile, sites }: PartnerSiteInfoTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [previewDocument, setPreviewDocument] = useState<PartnerDocument | null>(null)
  const [showAllSites, setShowAllSites] = useState(false)
  const [siteParticipations, setSiteParticipations] = useState<SiteParticipation[]>([])
  const [siteDocuments, setSiteDocuments] = useState<PartnerDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [statistics, setStatistics] = useState({
    total_sites: 0,
    active_sites: 0,
    completed_sites: 0
  })
  
  const supabase = createClient()

  // Fetch site participations from the API
  const fetchSiteParticipations = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedPeriod !== 'all') params.set('period', selectedPeriod)
      
      const response = await fetch(`/api/partner/sites?${params}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch site participations')
      }
      
      if (result.success) {
        setSiteParticipations(result.data.participations || [])
        setStatistics(result.statistics || { total_sites: 0, active_sites: 0, completed_sites: 0 })
      }
    } catch (error) {
      console.error('Error fetching site participations:', error)
      toast.error('현장 참여 목록을 불러오는데 실패했습니다.')
      setSiteParticipations([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch documents for selected site
  const fetchSiteDocuments = async (siteId: string) => {
    if (siteId === 'all') {
      setSiteDocuments([])
      return
    }
    
    setDocumentsLoading(true)
    try {
      const response = await fetch(`/api/partner/sites/${siteId}/documents`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch documents')
      }
      
      if (result.success) {
        setSiteDocuments(result.data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching site documents:', error)
      toast.error('문서 목록을 불러오는데 실패했습니다.')
      setSiteDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSiteParticipations()
  }, [selectedPeriod])

  useEffect(() => {
    fetchSiteDocuments(selectedSite)
  }, [selectedSite])

  // Filter sites based on selected period (frontend filtering as backup)
  const filteredSites = siteParticipations.filter(site => {
    const now = new Date()
    const siteEndDate = site.endDate ? new Date(site.endDate) : now
    
    switch (selectedPeriod) {
      case 'current_month': {
        const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        return siteEndDate >= currentMonth
      }
      case 'recent_3': {
        const recent3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        return siteEndDate >= recent3Months
      }
      case 'recent_6': {
        const recent6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        return siteEndDate >= recent6Months
      }
      case 'recent_12': {
        const recent12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1)
        return siteEndDate >= recent12Months
      }
      case 'recent_24': {
        const recent24Months = new Date(now.getFullYear(), now.getMonth() - 24, 1)
        return siteEndDate >= recent24Months
      }
      case 'all':
      default:
        return true
    }
  })

  const getDocumentIcon = (iconName: string) => {
    const iconComponents: { [key: string]: any } = {
      DollarSign,
      FileSignature,
      Calculator,
      Map,
      FileText,
      BarChart3,
      Shield,
      CheckSquare,
      Camera,
      CheckCircle
    }
    
    const IconComponent = iconComponents[iconName] || FileText
    return <IconComponent className="h-5 w-5 text-blue-500" />
  }

  const getDocumentTypeName = (type: string) => {
    return type // The API already returns Korean names
  }

  const handlePreview = (doc: PartnerDocument) => {
    setPreviewDocument(doc)
  }

  const handleDownload = async (doc: PartnerDocument) => {
    try {
      if (doc.fileUrl) {
        const link = document.createElement('a')
        link.href = doc.fileUrl
        link.download = doc.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(`${doc.name} 다운로드를 시작합니다.`)
      } else {
        toast.error('다운로드 URL을 찾을 수 없습니다.')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleShare = async (doc: PartnerDocument) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: doc.name,
          text: `${doc.type} - ${doc.name}`,
          url: window.location.href
        })
      } else {
        // Fallback - copy link to clipboard
        await navigator.clipboard.writeText(`${window.location.origin}/documents/${doc.id}`)
        toast.success('문서 링크가 클립보드에 복사되었습니다.')
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        toast.error('공유 중 오류가 발생했습니다.')
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* Site Selector Dropdown */}
      <div className="relative">
        <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
          <CustomSelectTrigger className="w-full pl-10 pr-4 py-2 h-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <CustomSelectValue placeholder="전체 현장" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 현장</CustomSelectItem>
            {filteredSites.map((site) => (
              <CustomSelectItem key={site.id} value={site.id}>
                {site.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Period Selector Dropdown */}
      <div className="relative">
        <CustomSelect value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <CustomSelectTrigger className="w-full pl-10 pr-4 py-2 h-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <CustomSelectValue placeholder="전체 기간" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 기간</CustomSelectItem>
            <CustomSelectItem value="current_month">금월</CustomSelectItem>
            <CustomSelectItem value="recent_3">최근 3개월</CustomSelectItem>
            <CustomSelectItem value="recent_6">최근 6개월</CustomSelectItem>
            <CustomSelectItem value="recent_12">최근 12개월</CustomSelectItem>
            <CustomSelectItem value="recent_24">최근 24개월</CustomSelectItem>
          </CustomSelectContent>
        </CustomSelect>
        <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Site Participation History */}
      <Card elevation="sm" className="theme-transition overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 목록</h3>
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              ) : (
                <>
                  <span className="text-sm text-gray-500 dark:text-gray-400">총 {filteredSites.length}개 현장</span>
                  {!showAllSites && filteredSites.length > 3 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">3개 표시 중</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className={cn(
          "divide-y divide-gray-200 dark:divide-gray-700 transition-all duration-300",
          !showAllSites && "max-h-[300px] overflow-hidden relative"
        )}>
          {loading ? (
            <div className="px-4 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                현장 참여 목록을 불러오는 중...
              </p>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              선택한 기간에 해당하는 현장이 없습니다.
            </div>
          ) : (
            <>
              {/* Display first 3 sites or all if showAllSites is true */}
              {(showAllSites ? filteredSites : filteredSites.slice(0, 3)).map((site, index) => (
                <div 
                  key={site.id}
                  className={cn(
                    "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
                    selectedSite === site.id && "bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500"
                  )}
                  onClick={() => setSelectedSite(site.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {site.name}
                        </h4>
                        {site.status === '진행중' && !site.endDate && (
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                            "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          )}>
                            현재
                          </span>
                        )}
                        {site.role === '현장관리자' && (
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                            "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          )}>
                            현장관리자
                          </span>
                        )}
                        {site.role === '감독관' && (
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] rounded-full inline-flex items-center",
                            "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                          )}>
                            감독관
                          </span>
                        )}
                        {site.role === '작업자' && (
                          <span className="text-xs text-gray-500">
                            작업자
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{site.address}</p>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                        <span>{site.work}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {site.period.replace(/2024-/g, '24. ').replace(/-/g, '. ')}
                      </div>
                      <div className={cn(
                        "text-xs mt-1",
                        site.status === '진행중' ? "text-green-600 dark:text-green-400" :
                        site.status === '완료' ? "text-blue-600 dark:text-blue-400" :
                        "text-gray-500 dark:text-gray-400"
                      )}>
                        {site.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {!loading && filteredSites.length > 3 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllSites(!showAllSites)}
              className="w-full flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {showAllSites ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span>접기</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span>{filteredSites.length - 3}개 더보기</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Selected Site Details */}
      {selectedSite && selectedSite !== 'all' && (
        <>
          <div className="flex items-center justify-center py-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <div className="h-px w-12 bg-gray-300 dark:bg-gray-600" />
              <ChevronDown className="h-3 w-3 animate-bounce" />
              <span>아래 섹션 더보기</span>
              <ChevronDown className="h-3 w-3 animate-bounce" />
              <div className="h-px w-12 bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>

          {(() => {
            const selectedSiteData = filteredSites.find(s => s.id === selectedSite)
            if (!selectedSiteData) return null

            return (
              <>
                <Card elevation="sm" className="theme-transition overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 dark:from-blue-900/20 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 상세정보</h3>
                        <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                          {selectedSiteData.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSite('all')}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-gray-800">
                    <div className="space-y-2.5">
                      {/* Location */}
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 주소</span>
                        <p className="text-sm text-gray-900 dark:text-gray-100 break-words flex-1 min-w-0">
                          {selectedSiteData.address}
                        </p>
                        <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedSiteData.address);
                            toast.success('주소가 복사되었습니다.');
                          }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" 
                          onClick={() => {
                            window.open(`https://map.naver.com/v5/search/${encodeURIComponent(selectedSiteData.address)}`);
                          }}>
                          <Navigation className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Period */}
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">참여 기간</span>
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {selectedSiteData.period}
                          {selectedSiteData.status === '진행중' && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full">
                              현재 참여중
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Role */}
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">담당 역할</span>
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          selectedSiteData.role === '현장관리자'
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : selectedSiteData.role === '감독관'
                            ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        )}>
                          {selectedSiteData.role}
                        </span>
                      </div>

                      {/* Work Info */}
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">작업 내용</span>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedSiteData.work}
                          </p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-3">
                        <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 상태</span>
                        <span className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          selectedSiteData.status === '진행중'
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                            : selectedSiteData.status === '완료'
                            ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        )}>
                          {selectedSiteData.status}
                        </span>
                      </div>

                      {/* Contract Value */}
                      {selectedSiteData.contractValue && (
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">계약 금액</span>
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {new Intl.NumberFormat('ko-KR').format(selectedSiteData.contractValue)}원
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Documents Section */}
                <Card elevation="sm" className="theme-transition overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-gray-50 dark:from-green-900/20 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-green-600" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">관련 문서</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {documentsLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-green-500" />
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            총 {siteDocuments.length}개
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {documentsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          문서를 불러오는 중...
                        </p>
                      </div>
                    ) : siteDocuments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">이 현장에 등록된 문서가 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {siteDocuments.map(doc => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getDocumentIcon(doc.icon)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.type}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {doc.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {doc.uploadDate}
                                  </p>
                                  <span className="text-xs text-gray-300">•</span>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {doc.uploader}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Icons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handlePreview(doc)}
                                title="미리보기"
                              >
                                <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleDownload(doc)}
                                title="다운로드"
                              >
                                <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleShare(doc)}
                                title="공유"
                              >
                                <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </>
            )
          })()}
        </>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewDocument(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {getDocumentIcon(previewDocument.icon)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {previewDocument.type}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {previewDocument.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleDownload(previewDocument)}
                  title="다운로드"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => handleShare(previewDocument)}
                  title="공유"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setPreviewDocument(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  {getDocumentIcon(previewDocument.icon)}
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {previewDocument.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      문서 미리보기가 여기에 표시됩니다
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-4">
                      실제 구현시 PDF Viewer 또는 이미지 뷰어가 표시됩니다
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}