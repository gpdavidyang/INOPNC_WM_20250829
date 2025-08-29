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
  ChevronDown, ChevronUp
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

interface BillingDocument {
  id: string
  type: string
  name: string
  uploadDate: string
  icon: React.ReactNode
}

export default function PartnerSiteInfoTab({ profile, sites }: PartnerSiteInfoTabProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [previewDocument, setPreviewDocument] = useState<BillingDocument | null>(null)
  const [showAllSites, setShowAllSites] = useState(false)
  const [realDocuments, setRealDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()

  // Convert real sites data to participation format 
  const allSiteParticipations = sites.map((site, index) => {
    // Generate realistic participation data based on site
    const today = new Date()
    const isGangnam = site.name.includes('강남')
    const isSongpa = site.name.includes('송파')
    const isSeocho = site.name.includes('서초')
    
    return {
      id: site.id,
      name: site.name,
      address: site.address || `${site.name} 주소`,
      role: isGangnam ? '현장관리자' : isSongpa ? '작업자' : isSeocho ? '현장관리자' : '작업자',
      work: isGangnam ? '슬라브 타설 • 지하 1층' : 
            isSongpa ? '철골 조립 • 지상 3층' : 
            isSeocho ? '배관 설치 • 지하 2층' : 
            `건설 작업 • ${Math.floor(Math.random() * 5) + 1}층`,
      period: isGangnam ? '2024-08-17' : 
              isSongpa ? '2024-08-10 ~ 2024-08-17' : 
              isSeocho ? '2024-08-07 ~ 2024-08-17' :
              `2024-0${7 + (index % 2)}-${10 + index} ~ 2024-08-${10 + index}`,
      status: isGangnam ? '진행중' : 
              isSongpa ? '진행중' : 
              isSeocho ? '완료' : 
              index % 3 === 0 ? '진행중' : index % 3 === 1 ? '완료' : '중지',
      startDate: isGangnam ? '2024-08-17' : 
                 isSongpa ? '2024-08-10' : 
                 isSeocho ? '2024-08-07' :
                 `2024-0${7 + (index % 2)}-${10 + index}`,
      endDate: isGangnam ? null : 
               isSongpa ? '2024-08-17' : 
               isSeocho ? '2024-08-17' :
               index % 3 === 0 ? null : `2024-08-${10 + index}`
    }
  })

  // Filter sites based on selected period
  const getFilteredSites = () => {
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const recent3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recent6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const recent12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    const recent24Months = new Date(now.getFullYear(), now.getMonth() - 24, 1)

    return allSiteParticipations.filter(site => {
      const siteEndDate = site.endDate ? new Date(site.endDate) : now
      const siteStartDate = new Date(site.startDate)

      switch (selectedPeriod) {
        case 'current_month':
          return siteEndDate >= currentMonth
        case 'recent_3':
          return siteEndDate >= recent3Months
        case 'recent_6':
          return siteEndDate >= recent6Months
        case 'recent_12':
          return siteEndDate >= recent12Months
        case 'recent_24':
          return siteEndDate >= recent24Months
        case 'all':
        default:
          return true
      }
    })
  }

  const filteredSites = getFilteredSites()

  // Fetch real documents from database
  const fetchDocuments = async () => {
    if (!selectedSite || selectedSite === 'all') return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          sites(name)
        `)
        .eq('site_id', selectedSite)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching documents:', error)
        return
      }

      setRealDocuments(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [selectedSite])

  // Convert real documents to billing document format
  const getRealBillingDocuments = () => {
    return realDocuments.map(doc => ({
      id: doc.id,
      type: getDocumentTypeFromTitle(doc.title),
      name: doc.file_name,
      uploadDate: new Date(doc.created_at).toLocaleDateString('ko-KR').replace(/\./g, '. ').replace(/\s/g, ''),
      icon: getDocumentIcon(doc.title)
    }))
  }

  const getDocumentTypeFromTitle = (title: string) => {
    if (title.includes('견적서')) return 'estimate'
    if (title.includes('시공계획서')) return 'construction_plan'
    if (title.includes('세금계산서')) return 'tax_invoice'
    if (title.includes('계약서')) return 'contract'
    if (title.includes('사진대지')) return 'photo_document'
    return 'document'
  }

  const getDocumentIcon = (title: string) => {
    if (title.includes('견적서')) return <DollarSign className="h-5 w-5 text-green-500" />
    if (title.includes('시공계획서')) return <FileText className="h-5 w-5 text-blue-500" />
    if (title.includes('세금계산서')) return <FileSignature className="h-5 w-5 text-purple-500" />
    if (title.includes('계약서')) return <FileSignature className="h-5 w-5 text-red-500" />
    if (title.includes('사진대지')) return <Camera className="h-5 w-5 text-orange-500" />
    return <FileText className="h-5 w-5 text-gray-500" />
  }
  
  // Mock site details
  const siteDetails = {
    id: selectedSite,
    name: sites.find(s => s.id === selectedSite)?.name || '강남 A현장',
    address: sites.find(s => s.id === selectedSite)?.address || '서울특별시 강남구 테헤란로 123',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    progress: 65,
    manager: {
      name: '김현장',
      phone: '010-1234-5678'
    },
    safetyManager: {
      name: '이안전',
      phone: '010-2345-6789'
    },
    workerCount: 24,
    contractAmount: '5.2억',
    currentSpent: '3.4억'
  }

  // Mock billing documents with site associations
  const allBillingDocuments: (BillingDocument & { siteId: string, uploadDate: string })[] = [
    {
      id: '1',
      siteId: sites[0]?.id || '1',
      type: 'estimate',
      name: '견적서_2024년8월.pdf',
      uploadDate: '2024-08-15',
      icon: <DollarSign className="h-5 w-5 text-green-500" />
    },
    {
      id: '2', 
      siteId: sites[0]?.id || '1',
      type: 'construction_plan',
      name: '시공계획서_강남A현장.pdf',
      uploadDate: '2024-08-10',
      icon: <FileText className="h-5 w-5 text-blue-500" />
    },
    {
      id: '3',
      siteId: sites[0]?.id || '1',
      type: 'tax_invoice',
      name: '전자세금계산서_202408.pdf',
      uploadDate: '2024-08-18',
      icon: <FileSignature className="h-5 w-5 text-purple-500" />
    },
    {
      id: '4',
      siteId: 'site-2',
      type: 'photo_document',
      name: '사진대지문서_송파C현장.pdf',
      uploadDate: '2024-08-12',
      icon: <Camera className="h-5 w-5 text-orange-500" />
    },
    {
      id: '5',
      siteId: 'site-3',
      type: 'contract',
      name: '계약서_서초B현장.pdf',
      uploadDate: '2024-08-05',
      icon: <FileSignature className="h-5 w-5 text-red-500" />
    },
    {
      id: '6',
      siteId: 'site-4',
      type: 'completion',
      name: '작업완료확인서_성남D현장.pdf',
      uploadDate: '2024-07-25',
      icon: <CheckSquare className="h-5 w-5 text-green-500" />
    },
    {
      id: '7',
      siteId: 'site-5',
      type: 'blueprint',
      name: '진행도면_용인E현장.pdf',
      uploadDate: '2024-06-15',
      icon: <Map className="h-5 w-5 text-indigo-500" />
    }
  ]

  // Filter documents based on selected site and period
  const getFilteredDocuments = () => {
    let filtered = allBillingDocuments

    // Filter by site
    if (selectedSite !== 'all') {
      filtered = filtered.filter(doc => doc.siteId === selectedSite)
    }

    // Filter by period
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const recent3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const recent6Months = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const recent12Months = new Date(now.getFullYear(), now.getMonth() - 12, 1)
    const recent24Months = new Date(now.getFullYear(), now.getMonth() - 24, 1)

    switch (selectedPeriod) {
      case 'current_month':
        filtered = filtered.filter(doc => new Date(doc.uploadDate) >= currentMonth)
        break
      case 'recent_3':
        filtered = filtered.filter(doc => new Date(doc.uploadDate) >= recent3Months)
        break
      case 'recent_6':
        filtered = filtered.filter(doc => new Date(doc.uploadDate) >= recent6Months)
        break
      case 'recent_12':
        filtered = filtered.filter(doc => new Date(doc.uploadDate) >= recent12Months)
        break
      case 'recent_24':
        filtered = filtered.filter(doc => new Date(doc.uploadDate) >= recent24Months)
        break
      case 'all':
      default:
        break
    }

    return filtered
  }

  // Use real documents when available, fallback to mock data
  const billingDocuments = selectedSite && selectedSite !== 'all' ? getRealBillingDocuments() : []

  const getDocumentTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      estimate: '견적서',
      construction_plan: '시공계획서',
      tax_invoice: '전자세금계산서',
      photo_document: '사진대지문서',
      contract: '계약서',
      completion: '작업완료확인서',
      blueprint: '진행도면'
    }
    return types[type] || type
  }

  const handlePreview = (doc: BillingDocument) => {
    setPreviewDocument(doc)
  }

  const handleDownload = async (doc: BillingDocument) => {
    try {
      // Mock download - in real implementation, this would download from actual URL
      const link = document.createElement('a')
      link.href = `/api/documents/download/${doc.id}` // Mock URL
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`${doc.name} 다운로드를 시작합니다.`)
    } catch (error) {
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  const handleShare = async (doc: BillingDocument) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: doc.name,
          text: `${getDocumentTypeName(doc.type)} - ${doc.name}`,
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
      {/* Site Selector Dropdown - Enhanced Size */}
      <div className="relative">
        <CustomSelect value={selectedSite} onValueChange={setSelectedSite}>
          <CustomSelectTrigger className="w-full pl-10 pr-4 py-2 h-10 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <CustomSelectValue placeholder="전체 현장" />
          </CustomSelectTrigger>
          <CustomSelectContent>
            <CustomSelectItem value="all">전체 현장</CustomSelectItem>
            {sites.map((site) => (
              <CustomSelectItem key={site.id} value={site.id}>
                {site.name}
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
      </div>

      {/* Period Selector Dropdown - Enhanced Size */}
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

      {/* Site Participation History - Enhanced UI with collapsed view */}
      <Card elevation="sm" className="theme-transition overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 참여 목록</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">총 {filteredSites.length}개 현장</span>
              {!showAllSites && filteredSites.length > 3 && (
                <span className="text-xs text-blue-600 dark:text-blue-400">3개 표시 중</span>
              )}
            </div>
          </div>
        </div>
        
        <div className={cn(
          "divide-y divide-gray-200 dark:divide-gray-700 transition-all duration-300",
          !showAllSites && "max-h-[300px] overflow-hidden relative"
        )}>
          {filteredSites.length === 0 ? (
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

        {/* Gradient overlay for collapsed state */}
        {!showAllSites && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none" />
        )}

        {/* Expand/Collapse Button - Only show if there are more than 3 sites */}
        {filteredSites.length > 3 && (
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

      {/* Selected Site Details - Enhanced UI with visual indicators */}
      {selectedSite && selectedSite !== 'all' && (
        <>
          {/* Visual indicator for scrollable content */}
          <div className="flex items-center justify-center py-1">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <div className="h-px w-12 bg-gray-300 dark:bg-gray-600" />
              <ChevronDown className="h-3 w-3 animate-bounce" />
              <span>아래 섹션 더보기</span>
              <ChevronDown className="h-3 w-3 animate-bounce" />
              <div className="h-px w-12 bg-gray-300 dark:bg-gray-600" />
            </div>
          </div>

          <Card elevation="sm" className="theme-transition overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-gray-50 dark:from-blue-900/20 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">현장 상세정보</h3>
                  <span className="text-xs text-blue-600 dark:text-blue-300 font-medium">
                    {allSiteParticipations.find(s => s.id === selectedSite)?.name || '현장 정보'}
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
                  {allSiteParticipations.find(s => s.id === selectedSite)?.address || '주소 정보 없음'}
                </p>
                <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0" 
                  onClick={() => {
                    const address = allSiteParticipations.find(s => s.id === selectedSite)?.address || '';
                    navigator.clipboard.writeText(address);
                  }}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="compact" className="h-6 w-6 p-0 min-h-0 flex-shrink-0 text-blue-600" 
                  onClick={() => {
                    const address = allSiteParticipations.find(s => s.id === selectedSite)?.address || '';
                    window.open(`https://tmapapi.sktelecom.com/main.html#weblink/search?query=${encodeURIComponent(address)}`);
                  }}>
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>

              {/* Period */}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">참여 기간</span>
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {allSiteParticipations.find(s => s.id === selectedSite)?.period.replace(/2024-/g, '2025.').replace(/-/g, '.') || '기간 정보 없음'}
                  {allSiteParticipations.find(s => s.id === selectedSite)?.status === '진행중' && (
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
                  allSiteParticipations.find(s => s.id === selectedSite)?.role === '현장관리자'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : allSiteParticipations.find(s => s.id === selectedSite)?.role === '감독관'
                    ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                )}>
                  {allSiteParticipations.find(s => s.id === selectedSite)?.role || '역할 정보 없음'}
                </span>
              </div>

              {/* Work Info */}
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">작업 내용</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {allSiteParticipations.find(s => s.id === selectedSite)?.work || '작업 정보 없음'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">현장 상태</span>
                <span className={cn(
                  "px-2 py-0.5 text-xs rounded-full",
                  allSiteParticipations.find(s => s.id === selectedSite)?.status === '진행중'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : allSiteParticipations.find(s => s.id === selectedSite)?.status === '완료'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                )}>
                  {allSiteParticipations.find(s => s.id === selectedSite)?.status || '상태 정보 없음'}
                </span>
              </div>
              </div>
            </div>
          </Card>

          {/* Billing Documents Section - Optimized for Mobile with enhanced header */}
          <Card elevation="sm" className="theme-transition overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-gray-50 dark:from-green-900/20 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-green-600" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">기성청구함</h3>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                    NEW
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  총 {billingDocuments.length}개
                </span>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {billingDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                      hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    {/* Document Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getDocumentTypeName(doc.type)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {doc.uploadDate}
                        </p>
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
                        <span className="sr-only">미리보기</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownload(doc)}
                        title="다운로드"
                      >
                        <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="sr-only">다운로드</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleShare(doc)}
                        title="공유"
                      >
                        <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="sr-only">공유</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Document Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPreviewDocument(null)}>
              <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {previewDocument.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getDocumentTypeName(previewDocument.type)}
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
                
                {/* Document Preview Content */}
                <div className="p-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 min-h-[600px] flex items-center justify-center">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
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
          )}
        </>
      )}
    </div>
  )
}