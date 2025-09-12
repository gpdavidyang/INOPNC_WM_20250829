'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { 
  MapPin, 
  Users,
  Building,
  Shield,
  Home,
  FileText,
  Download,
  Search,
  ChevronRight,
  Calendar,
  Clock,
  Paperclip,
  X,
  Eye,
  File
} from 'lucide-react'
import { CurrentUserSite, UserSiteHistory, Profile, Site } from '@/types'
import { getAllSites } from '@/app/actions/sites'
import { getSiteDocuments } from '@/app/actions/site-documents'

interface SiteInfoCardNewProps {
  currentSite?: CurrentUserSite | null
  currentUser: Profile
}

interface SiteDocument {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  url?: string
}

// Extend Site type with additional fields
interface ExtendedSite extends Site {
  company?: string
  accident_free_days?: number
  accommodation?: string | null
  manager_phone?: string | null
  worker_count?: number
}

export default function SiteInfoCardNew({
  currentSite,
  currentUser
}: SiteInfoCardNewProps) {
  const [sites, setSites] = useState<ExtendedSite[]>([])
  const [filteredSites, setFilteredSites] = useState<ExtendedSite[]>([])
  const [selectedSite, setSelectedSite] = useState<ExtendedSite | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'recent'>('recent')
  const [loading, setLoading] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [attachments, setAttachments] = useState<SiteDocument[]>([])
  const [selectedAttachment, setSelectedAttachment] = useState<SiteDocument | null>(null)
  const [expandedField, setExpandedField] = useState<string | null>(null)

  // Load all sites
  useEffect(() => {
    loadSites()
  }, [])

  // Filter sites based on search
  useEffect(() => {
    let filtered = [...sites]
    
    if (searchTerm) {
      filtered = filtered.filter(site => 
        site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    } else {
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })
    }

    setFilteredSites(filtered)
  }, [sites, searchTerm, sortBy])

  const loadSites = async () => {
    setLoading(true)
    try {
      const result = await getAllSites()
      if (result.success && result.data) {
        setSites(result.data)
        
        // Set initial selected site if current site exists
        if (currentSite) {
          const site = result.data.find(s => s.id === currentSite.site_id)
          if (site) {
            setSelectedSite(site)
            setShowDetail(true)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSiteDocuments = async (siteId: string) => {
    try {
      const result = await getSiteDocuments(siteId)
      if (result.success && result.data) {
        setAttachments(result.data.map((doc: any) => ({
          id: doc.id,
          name: doc.name || doc.file_name || '문서',
          type: doc.document_type || 'document',
          size: doc.file_size || 0,
          uploadedAt: doc.created_at,
          url: doc.file_url
        })))
      }
    } catch (error) {
      console.error('Failed to load site documents:', error)
    }
  }

  const handleSiteSelect = async (site: ExtendedSite) => {
    setSelectedSite(site)
    setShowDetail(true)
    await loadSiteDocuments(site.id)
  }

  const toggleFieldExpansion = (field: string) => {
    setExpandedField(expandedField === field ? null : field)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄'
    if (type.includes('image')) return '🖼️'
    if (type.includes('doc')) return '📝'
    return '📎'
  }

  return (
    <div className="space-y-4">
      {/* 현장 정보 카드 */}
      <Card className="site-info-card">
        <div className="card-header p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">
                {selectedSite ? selectedSite.name : '현장 미선택'}
              </span>
            </div>
            {selectedSite && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('ko-KR')}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDetail(!showDetail)}
                  className="btn-detail"
                >
                  {showDetail ? '간략히' : '상세'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {selectedSite && (
          <div className="p-4">
            {/* 기본 정보 */}
            <div className="info-section space-y-2">
              <div className="info-row grid grid-cols-[80px_1fr_auto] gap-2 items-center py-2">
                <span className="info-label text-gray-600 font-medium">소속</span>
                <span className="info-val font-medium">{selectedSite.company || 'INOPNC'}</span>
              </div>
              
              <div className="info-row grid grid-cols-[80px_1fr_auto] gap-2 items-center py-2">
                <span className="info-label text-gray-600 font-medium">안전</span>
                <span className="info-val font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  무사고 {selectedSite.accident_free_days || 0}일
                </span>
              </div>

              <div className="info-row grid grid-cols-[80px_1fr_auto] gap-2 items-center py-2">
                <span className="info-label text-gray-600 font-medium">주소</span>
                <span 
                  className={cn(
                    "info-val font-medium cursor-pointer transition-all",
                    expandedField === 'address' && "expanded bg-blue-50 p-2 rounded"
                  )}
                  onClick={() => toggleFieldExpansion('address')}
                >
                  {expandedField === 'address' 
                    ? selectedSite.address || '주소 없음'
                    : (selectedSite.address?.substring(0, 20) || '주소 없음') + (selectedSite.address && selectedSite.address.length > 20 ? '...' : '')
                  }
                </span>
              </div>

              <div className="info-row grid grid-cols-[80px_1fr_auto] gap-2 items-center py-2">
                <span className="info-label text-gray-600 font-medium">숙소</span>
                <span 
                  className={cn(
                    "info-val font-medium cursor-pointer transition-all",
                    expandedField === 'accommodation' && "expanded bg-blue-50 p-2 rounded"
                  )}
                  onClick={() => toggleFieldExpansion('accommodation')}
                >
                  {expandedField === 'accommodation'
                    ? selectedSite.accommodation || '숙소 정보 없음'
                    : (selectedSite.accommodation?.substring(0, 20) || '숙소 정보 없음') + (selectedSite.accommodation && selectedSite.accommodation.length > 20 ? '...' : '')
                  }
                </span>
              </div>
            </div>

            {/* 상세 정보 */}
            {showDetail && (
              <div className="detail-section border-t pt-3 mt-3 space-y-3">
                <div className="flex justify-between">
                  <div className="flex-1 mr-4">
                    <div className="text-xs text-gray-500 mb-1">현장 담당자</div>
                    <div className="text-sm font-medium">{selectedSite.manager_name || '미정'}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">연락처</div>
                    <div className="text-sm font-medium">{selectedSite.manager_phone || '미정'}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="flex-1 mr-4">
                    <div className="text-xs text-gray-500 mb-1">시작일</div>
                    <div className="text-sm font-medium">
                      {selectedSite.start_date ? new Date(selectedSite.start_date).toLocaleDateString('ko-KR') : '미정'}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1">종료일</div>
                    <div className="text-sm font-medium">
                      {selectedSite.end_date ? new Date(selectedSite.end_date).toLocaleDateString('ko-KR') : '미정'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="flex-1 mr-4">
                    <div className="text-xs text-gray-500 mb-1">등록일</div>
                    <div className="text-sm font-medium">
                      {selectedSite.created_at ? new Date(selectedSite.created_at).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  <div className="flex-1">
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
              </div>
            )}

            {/* 현장 자료 버튼 */}
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 h-12 bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setShowAttachments(true)}
              >
                <Paperclip className="h-4 w-4 mr-2" />
                첨부파일 ({attachments.length})
              </Button>
              <Button 
                className="flex-1 h-12 bg-blue-900 text-white hover:bg-blue-800"
                onClick={() => window.open(`/dashboard/sites/${selectedSite.id}/documents`, '_blank')}
              >
                <FileText className="h-4 w-4 mr-2" />
                현장문서함
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 현장 정보 검색 카드 */}
      <Card className="site-search-card">
        <div className="p-4">
          <div className="search-controls">
            {/* 검색바 */}
            <div className="search-bar flex gap-2">
              <Input
                type="text"
                placeholder="현장명 또는 주소 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button 
                size="icon"
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* 정렬 버튼 */}
            <div className="sort-controls flex gap-2">
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
            </div>
          </div>

          {/* 현장 리스트 */}
          <div className="site-summary-list mt-4 bg-gray-50 rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-4 text-center text-gray-500">로딩중...</div>
            ) : filteredSites.length === 0 ? (
              <div className="p-4 text-center text-gray-500">검색 결과가 없습니다</div>
            ) : (
              filteredSites.slice(0, 10).map((site) => (
                <div
                  key={site.id}
                  className="site-summary-item bg-white border-b last:border-b-0 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSiteSelect(site)}
                >
                  <div className="site-summary-content">
                    <div className="flex items-center justify-between mb-1">
                      <span className="site-summary-title text-blue-900 font-semibold">
                        {site.name}
                      </span>
                      {site.id === selectedSite?.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          선택됨
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {site.address?.substring(0, 30) || '주소 없음'}
                      {site.address && site.address.length > 30 && '...'}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        <Users className="inline h-3 w-3 mr-1" />
                        {site.worker_count || 0}명
                      </span>
                      <span className="text-xs text-gray-500">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {site.created_at ? new Date(site.created_at).toLocaleDateString('ko-KR') : '-'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* 첨부파일 팝업 */}
      {showAttachments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                첨부파일
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAttachments(false)}
              >
                닫기
              </Button>
            </div>

            <div className="p-5 overflow-y-auto">
              {attachments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  첨부파일이 없습니다
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{getFileIcon(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{file.name}</div>
                          <div className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedAttachment(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {file.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 미리보기 */}
              {selectedAttachment && (
                <div className="mt-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{selectedAttachment.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAttachment(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-100 rounded p-8 text-center text-gray-500">
                    <File className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    미리보기를 사용할 수 없습니다
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}