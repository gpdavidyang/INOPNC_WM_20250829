'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Profile } from '@/types'
import { 
  FileText, Image, Shield, Package, FolderOpen, 
  Share2, Search, Filter, Download, Eye, 
  Grid, List, ChevronDown, Plus, RefreshCw,
  CheckCircle, XCircle, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GeneralUserView from './GeneralUserView'
import PartnerView from './PartnerView'
import AdminView from './AdminView'
import DocumentList from './DocumentList'
import DocumentFilters from './DocumentFilters'
import DocumentUploadModal from './DocumentUploadModal'
import DocumentDetailModal from './DocumentDetailModal'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface UnifiedDocumentViewerProps {
  profile: Profile
  initialCategory?: string
  siteId?: string
  companyId?: string
}

// 카테고리 설정
const DOCUMENT_CATEGORIES = [
  { 
    id: 'all', 
    name: '전체', 
    icon: FolderOpen, 
    color: 'gray',
    description: '모든 문서'
  },
  { 
    id: 'shared', 
    name: '공유문서', 
    icon: Share2, 
    color: 'blue',
    description: '현장 공유 문서'
  },
  { 
    id: 'markup', 
    name: '도면마킹', 
    icon: Image, 
    color: 'purple',
    description: '도면 및 마킹 문서'
  },
  { 
    id: 'photo_grid', 
    name: '사진대지', 
    icon: Image, 
    color: 'orange',
    description: '작업 전후 사진'
  },
  { 
    id: 'required', 
    name: '필수제출', 
    icon: Shield, 
    color: 'green',
    description: '필수 제출 서류'
  },
  { 
    id: 'invoice', 
    name: '기성청구', 
    icon: Package, 
    color: 'yellow',
    description: '기성 청구 문서'
  }
]

export default function UnifiedDocumentViewer({
  profile,
  initialCategory = 'all',
  siteId,
  companyId
}: UnifiedDocumentViewerProps) {
  const { toast } = useToast()
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // UI 상태
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<UnifiedDocument | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 필터 상태
  const [filters, setFilters] = useState({
    status: 'active',
    siteId: siteId || 'all',
    documentType: 'all',
    dateRange: 'all'
  })
  
  // 페이지네이션
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  
  // 통계
  const [statistics, setStatistics] = useState<any>(null)
  
  // 역할 확인
  const isAdmin = ['admin', 'system_admin'].includes(profile.role)
  const isPartner = profile.role === 'customer_manager'
  const isGeneralUser = ['worker', 'site_manager'].includes(profile.role)
  
  // 문서 로드
  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        category_type: selectedCategory === 'all' ? '' : selectedCategory,
        search: searchTerm,
        status: filters.status,
        site_id: filters.siteId === 'all' ? '' : filters.siteId,
        document_type: filters.documentType === 'all' ? '' : filters.documentType,
        include_stats: 'true'
      })
      
      // 파트너사는 자동으로 회사 필터 적용
      if (isPartner && profile.customer_company_id) {
        params.append('company_id', profile.customer_company_id)
      }
      
      const response = await fetch(`/api/unified-documents/v2?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setDocuments(data.data || [])
        setPagination(data.pagination)
        setStatistics(data.statistics)
      } else {
        toast({
          title: '오류',
          description: '문서를 불러오는데 실패했습니다.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast({
        title: '오류',
        description: '문서를 불러오는데 실패했습니다.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  // 문서 업로드 핸들러
  const handleUpload = async (file: File, metadata: Partial<UnifiedDocument>) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      Object.keys(metadata).forEach(key => {
        formData.append(key, (metadata as any)[key])
      })
      
      const response = await fetch('/api/unified-documents/v2/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '성공',
          description: '문서가 업로드되었습니다.'
        })
        fetchDocuments(pagination.page)
        setShowUploadModal(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '문서 업로드에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }
  
  // 문서 액션 핸들러
  const handleDocumentAction = async (action: string, documentIds: string[]) => {
    try {
      const response = await fetch('/api/unified-documents/v2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, documentIds })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: '성공',
          description: data.message
        })
        fetchDocuments(pagination.page)
        setSelectedDocuments([])
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '작업 처리에 실패했습니다.',
        variant: 'destructive'
      })
    }
  }
  
  // 초기 로드 및 필터 변경 감지
  useEffect(() => {
    fetchDocuments(1)
  }, [selectedCategory, filters])
  
  // 검색어 디바운싱
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchDocuments(1)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">통합 문서함</h2>
          <p className="text-muted-foreground">
            {isPartner ? '회사 문서를 관리합니다.' : '모든 문서를 통합 관리합니다.'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 통계 배지 */}
          {statistics && (
            <>
              <Badge variant="secondary">
                총 {statistics.total_documents || 0}개
              </Badge>
              <Badge variant="outline">
                최근 7일: {statistics.recent_uploads || 0}개
              </Badge>
            </>
          )}
          
          {/* 새로고침 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true)
              fetchDocuments(pagination.page)
            }}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          
          {/* 업로드 버튼 */}
          <Button
            onClick={() => setShowUploadModal(true)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            문서 업로드
          </Button>
        </div>
      </div>
      
      {/* 카테고리 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DOCUMENT_CATEGORIES.map(category => {
          // 파트너사는 기성청구 카테고리만 특별 처리
          if (isPartner && !['all', 'invoice', 'shared'].includes(category.id)) {
            return null
          }
          
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          
          return (
            <Button
              key={category.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="min-w-fit"
            >
              <Icon className="h-4 w-4 mr-2" />
              {category.name}
              {statistics?.by_category?.[category.id] && (
                <Badge variant={isActive ? 'secondary' : 'outline'} className="ml-2">
                  {statistics.by_category[category.id]}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>
      
      {/* 검색 및 필터 */}
      <DocumentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isAdmin={isAdmin}
      />
      
      {/* 역할별 뷰 */}
      {isAdmin ? (
        <AdminView
          documents={documents}
          loading={loading}
          viewMode={viewMode}
          selectedDocuments={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
          onDocumentAction={handleDocumentAction}
          onDocumentClick={(doc) => {
            setSelectedDocument(doc)
            setShowDetailModal(true)
          }}
          pagination={pagination}
          onPageChange={(page) => fetchDocuments(page)}
        />
      ) : isPartner ? (
        <PartnerView
          documents={documents}
          loading={loading}
          viewMode={viewMode}
          selectedDocuments={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
          onDocumentAction={handleDocumentAction}
          onDocumentClick={(doc) => {
            setSelectedDocument(doc)
            setShowDetailModal(true)
          }}
          pagination={pagination}
          onPageChange={(page) => fetchDocuments(page)}
          companyId={profile.customer_company_id}
        />
      ) : (
        <GeneralUserView
          documents={documents}
          loading={loading}
          viewMode={viewMode}
          selectedDocuments={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
          onDocumentAction={handleDocumentAction}
          onDocumentClick={(doc) => {
            setSelectedDocument(doc)
            setShowDetailModal(true)
          }}
          pagination={pagination}
          onPageChange={(page) => fetchDocuments(page)}
        />
      )}
      
      {/* 문서 업로드 모달 */}
      {showUploadModal && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUpload}
          categoryType={selectedCategory === 'all' ? undefined : selectedCategory}
          profile={profile}
        />
      )}
      
      {/* 문서 상세 모달 */}
      {showDetailModal && selectedDocument && (
        <DocumentDetailModal
          document={selectedDocument}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false)
            setSelectedDocument(null)
          }}
          onUpdate={(updatedDoc) => {
            fetchDocuments(pagination.page)
            setSelectedDocument(updatedDoc)
          }}
          onDelete={() => {
            fetchDocuments(pagination.page)
            setShowDetailModal(false)
            setSelectedDocument(null)
          }}
          isAdmin={isAdmin}
          profile={profile}
        />
      )}
    </div>
  )
}