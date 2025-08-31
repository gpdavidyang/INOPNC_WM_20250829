'use client'

import React, { useState } from 'react'
import { Search, Download, Trash2, Building2, Users, Share2, RefreshCw, Upload, X, FileText, Calendar, User, MapPin, Edit2 } from 'lucide-react'
import UnifiedDocumentManager from '@/components/unified-documents/UnifiedDocumentManager'
import LegacyDocumentAdapter from '@/components/unified-documents/LegacyDocumentAdapter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUnifiedDocuments, type UnifiedDocument } from '@/hooks/use-unified-documents'

interface SharedDocumentsManagementUnifiedProps {
  siteId?: string
  viewMode?: 'admin' | 'user'
}

export default function SharedDocumentsManagementUnified({
  siteId,
  viewMode = 'admin'
}: SharedDocumentsManagementUnifiedProps) {
  const [selectedDocument, setSelectedDocument] = useState<UnifiedDocument | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // 통합 문서 시스템 사용
  const {
    documents: sharedDocuments,
    categories,
    pagination,
    statistics,
    loading,
    error,
    updateDocument,
    deleteDocument,
    fetchDocuments
  } = useUnifiedDocuments({
    categoryType: 'shared',
    siteId,
    status: 'active'
  })

  const handleDocumentClick = (document: UnifiedDocument) => {
    setSelectedDocument(document)
    setShowDetailModal(true)
    setIsEditMode(false)
  }

  const handleEditDocument = async (updates: Partial<UnifiedDocument>) => {
    if (!selectedDocument) return

    const updated = await updateDocument(selectedDocument.id, updates)
    if (updated) {
      setSelectedDocument(updated)
      setIsEditMode(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    const success = await deleteDocument(documentId)
    if (success) {
      setShowDetailModal(false)
      setSelectedDocument(null)
    }
  }

  const handleDownload = (document: UnifiedDocument) => {
    window.open(document.file_url, '_blank')
  }

  const handleShare = async (document: UnifiedDocument) => {
    try {
      await navigator.clipboard.writeText(document.file_url)
      // Toast로 성공 메시지 표시
      console.log('링크가 클립보드에 복사되었습니다.')
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">공유문서함</h2>
          <p className="text-muted-foreground">
            모든 사용자가 접근 가능한 공유 문서를 관리합니다.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            총 {statistics?.by_category?.shared || 0}개 문서
          </Badge>
          
          <Button onClick={() => fetchDocuments()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통합 문서 관리자 */}
      <UnifiedDocumentManager
        defaultCategory="shared"
        siteId={siteId}
        viewMode={viewMode}
        allowUpload={viewMode === 'admin'}
        allowBulkActions={viewMode === 'admin'}
        showCategories={false}
      />

      {/* 문서 상세 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedDocument?.title}</span>
              <div className="flex items-center gap-2">
                {viewMode === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isEditMode ? '취소' : '편집'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDocument && handleDownload(selectedDocument)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  다운로드
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDocument && handleShare(selectedDocument)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  공유
                </Button>
                {viewMode === 'admin' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => selectedDocument && handleDeleteDocument(selectedDocument.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              {isEditMode ? (
                <DocumentEditForm
                  document={selectedDocument}
                  onSave={handleEditDocument}
                  onCancel={() => setIsEditMode(false)}
                />
              ) : (
                <DocumentDetailView document={selectedDocument} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 에러 상태 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-red-600">{error}</span>
              <Button variant="ghost" size="sm" onClick={() => fetchDocuments()}>
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 문서 상세 보기 컴포넌트
interface DocumentDetailViewProps {
  document: UnifiedDocument
}

function DocumentDetailView({ document }: DocumentDetailViewProps) {
  return (
    <div className="space-y-4">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">제목</label>
              <p className="text-sm">{document.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">파일명</label>
              <p className="text-sm">{document.original_filename || document.file_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">크기</label>
              <p className="text-sm">{formatFileSize(document.file_size || 0)}</p>
            </div>
            <div>
              <label className="text-sm font-medium">유형</label>
              <p className="text-sm">{document.mime_type}</p>
            </div>
          </div>
          
          {document.description && (
            <div>
              <label className="text-sm font-medium">설명</label>
              <p className="text-sm">{document.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 메타데이터 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">업로드자</label>
              <p className="text-sm">{document.uploader?.full_name || '알 수 없음'}</p>
            </div>
            <div>
              <label className="text-sm font-medium">생성일</label>
              <p className="text-sm">{new Date(document.created_at).toLocaleString('ko-KR')}</p>
            </div>
            {document.site && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">현장</label>
                <p className="text-sm">{document.site.name} ({document.site.address})</p>
              </div>
            )}
          </div>

          {document.tags && document.tags.length > 0 && (
            <div>
              <label className="text-sm font-medium">태그</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 미리보기 (이미지인 경우) */}
      {document.mime_type?.startsWith('image/') && (
        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={document.file_url} 
              alt={document.title}
              className="max-w-full h-auto rounded-lg"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// 문서 편집 폼 컴포넌트
interface DocumentEditFormProps {
  document: UnifiedDocument
  onSave: (updates: Partial<UnifiedDocument>) => Promise<void>
  onCancel: () => void
}

function DocumentEditForm({ document, onSave, onCancel }: DocumentEditFormProps) {
  const [formData, setFormData] = useState({
    title: document.title,
    description: document.description || '',
    is_public: document.is_public,
    tags: document.tags?.join(', ') || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await onSave({
        title: formData.title,
        description: formData.description,
        is_public: formData.is_public,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>문서 편집</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">제목 *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">설명</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border rounded-lg resize-none"
              rows={3}
              placeholder="문서에 대한 설명을 입력하세요..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">태그 (쉼표로 구분)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="태그1, 태그2, 태그3"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              className="rounded"
            />
            <label htmlFor="is_public" className="text-sm font-medium">
              공개 문서로 설정
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}

// 유틸리티 함수
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}