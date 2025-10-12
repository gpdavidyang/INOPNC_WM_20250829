'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { DrawingUploadModal } from '../home/DrawingUploadModal'
import { DrawingPreviewModal } from '../home/DrawingPreviewModal'
import { DrawingShareModal } from '../home/DrawingShareModal'
import { SaveDropdown } from '../home/SaveDropdown'

interface Blueprint {
  id: string
  name: string
  title: string
  description?: string
  fileUrl: string
  uploadDate: string
  uploader: string
  fileSize?: number
  mimeType: string
}

interface MarkupDocument {
  id: string
  title: string
  blueprintUrl: string
  markupData: any[]
  siteName: string
  createdByName: string
  createdAt: string
  updatedAt: string
  isMarked: boolean
  markupCount: number
}

interface DrawingBrowserProps {
  selectedSite?: string
  siteName?: string
  userId?: string
  onDrawingSelect?: (drawing: any) => void
  initialMode?: 'browse' | 'upload'
}

export const DrawingBrowser: React.FC<DrawingBrowserProps> = ({
  selectedSite,
  siteName,
  userId,
  onDrawingSelect,
  initialMode = 'browse',
}) => {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [markupDocuments, setMarkupDocuments] = useState<MarkupDocument[]>([])
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [selectedMarkupDoc, setSelectedMarkupDoc] = useState<MarkupDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'blueprints' | 'markups' | 'gallery' | 'local' | 'shared' | 'upload'
  >(initialMode === 'upload' ? 'upload' : 'blueprints')
  const [showUploadModal, setShowUploadModal] = useState(initialMode === 'upload')
  const [sharedDocuments, setSharedDocuments] = useState<Blueprint[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [previewData, setPreviewData] = useState<{
    imageUrl: string
    title: string
    markupData?: any[]
  } | null>(null)

  const supabase = createClient()

  // 현장별 공도면 조회
  const fetchBlueprints = async (siteId: string) => {
    if (!siteId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/partner/sites/${siteId}/documents?type=drawing`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '공도면을 불러올 수 없습니다.')
      }

      if (data.success && data.data?.documents) {
        const drawingDocuments = data.data.documents.filter(
          (doc: any) => doc.categoryType === 'drawing' || doc.categoryType === 'blueprint'
        )

        const formattedBlueprints: Blueprint[] = drawingDocuments.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          title: doc.title || doc.name,
          description: doc.description,
          fileUrl: doc.fileUrl,
          uploadDate: doc.uploadDate,
          uploader: doc.uploader,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
        }))

        setBlueprints(formattedBlueprints)

        if (formattedBlueprints.length === 0) {
          setError('공도면이 등록되어 있지 않습니다.')
        }
      } else {
        setError('공도면이 등록되어 있지 않습니다.')
      }
    } catch (error) {
      console.error('공도면 조회 실패:', error)
      setError(error instanceof Error ? error.message : '공도면 조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 마킹도면 조회
  const fetchMarkupDocuments = async (siteId: string) => {
    if (!siteId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/markup-documents/list?siteId=${siteId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setMarkupDocuments(data.data)
      } else {
        setError('마킹도면을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('마킹도면 조회 실패:', error)
      setError('마킹도면 조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 공유문서함 조회
  const fetchSharedDocuments = async (siteId: string) => {
    if (!siteId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('unified_documents')
        .select('*')
        .eq('site_id', siteId)
        .eq('category_type', 'shared')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedShared: Blueprint[] = data.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        title: doc.title || doc.name,
        description: doc.description,
        fileUrl: doc.file_url,
        uploadDate: doc.created_at,
        uploader: doc.uploaded_by_name || '알 수 없음',
        fileSize: doc.file_size,
        mimeType: doc.mime_type || 'application/octet-stream',
      }))

      setSharedDocuments(formattedShared)
    } catch (error) {
      console.error('공유문서 조회 실패:', error)
      setError('공유문서 조회에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!selectedSite) return

    switch (activeTab) {
      case 'blueprints':
        fetchBlueprints(selectedSite)
        break
      case 'markups':
        fetchMarkupDocuments(selectedSite)
        break
      case 'shared':
        fetchSharedDocuments(selectedSite)
        break
      case 'upload':
        setShowUploadModal(true)
        break
    }
  }, [activeTab, selectedSite])

  // 도면 선택 핸들러
  const handleBlueprintSelect = (blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint)
    setSelectedMarkupDoc(null)

    const drawingData = {
      id: blueprint.id,
      name: blueprint.name,
      title: blueprint.title,
      url: blueprint.fileUrl,
      size: blueprint.fileSize || 0,
      type: 'blueprint',
      uploadDate: new Date(blueprint.uploadDate),
      isMarked: false,
      source: 'blueprint',
      siteId: selectedSite,
      siteName: siteName,
    }

    localStorage.setItem('selected_drawing', JSON.stringify(drawingData))

    if (onDrawingSelect) {
      onDrawingSelect(drawingData)
    } else {
      toast.success(`"${blueprint.title}" 공도면을 선택했습니다.`)
    }
  }

  // 마킹도면 선택 핸들러
  const handleMarkupDocSelect = (markupDoc: MarkupDocument) => {
    setSelectedMarkupDoc(markupDoc)
    setSelectedBlueprint(null)

    const drawingData = {
      id: markupDoc.id,
      name: markupDoc.title,
      title: markupDoc.title,
      url: markupDoc.blueprintUrl,
      size: 0,
      type: 'markup',
      uploadDate: new Date(markupDoc.updatedAt),
      isMarked: true,
      markupData: markupDoc.markupData,
      markupCount: markupDoc.markupCount,
      source: 'markup',
      siteId: selectedSite,
      siteName: siteName,
    }

    localStorage.setItem('selected_drawing', JSON.stringify(drawingData))

    if (onDrawingSelect) {
      onDrawingSelect(drawingData)
    } else {
      toast.success(`"${markupDoc.title}" 마킹도면을 선택했습니다.`)
    }
  }

  // 갤러리 선택 핸들러
  const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 선택할 수 있습니다.')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const drawingData = {
        id: `gallery_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: e.target?.result as string,
        uploadDate: new Date(),
        isMarked: false,
        source: 'gallery',
        siteId: selectedSite,
        siteName: siteName,
      }

      localStorage.setItem('selected_drawing', JSON.stringify(drawingData))

      if (onDrawingSelect) {
        onDrawingSelect(drawingData)
      } else {
        toast.success(`갤러리에서 "${file.name}"을 선택했습니다.`)
      }

      setSelectedBlueprint(null)
      setSelectedMarkupDoc(null)
    }
    reader.readAsDataURL(file)
  }

  // 미리보기 열기
  const handlePreview = () => {
    const selected = selectedBlueprint || selectedMarkupDoc
    if (!selected) {
      toast.error('미리볼 도면을 선택해주세요.')
      return
    }

    setPreviewData({
      imageUrl: selectedBlueprint ? selectedBlueprint.fileUrl : selectedMarkupDoc!.blueprintUrl,
      title: selectedBlueprint ? selectedBlueprint.title : selectedMarkupDoc!.title,
      markupData: selectedMarkupDoc?.markupData,
    })
    setShowPreviewModal(true)
  }

  // 파일 크기 포맷팅
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '크기 정보 없음'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="drawing-browser" style={{ width: '100%' }}>
      <div className="browser-header">
        <h2 className="browser-title">도면 관리</h2>
        <div className="browser-actions">
          <button
            className="preview-btn"
            onClick={handlePreview}
            disabled={!selectedBlueprint && !selectedMarkupDoc}
          >
            미리보기
          </button>
          <button
            className="share-btn"
            onClick={() => setShowShareModal(true)}
            disabled={!selectedBlueprint && !selectedMarkupDoc}
          >
            공유
          </button>
        </div>
      </div>

      {/* 탭 네비게이션 - 2행 2열 그리드 */}
      <div className="browser-tabs" style={{ width: '100%', display: 'block' }}>
        <div
          className="tab-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%' }}
        >
          <button
            className={`tab-btn ${activeTab === 'blueprints' ? 'active' : ''}`}
            style={{ width: '100%' }}
            onClick={() => setActiveTab('blueprints')}
          >
            공도면
          </button>
          <button
            className={`tab-btn ${activeTab === 'markups' ? 'active' : ''}`}
            style={{ width: '100%' }}
            onClick={() => setActiveTab('markups')}
          >
            마킹도면
          </button>
          <button
            className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            style={{ width: '100%' }}
            onClick={() => setActiveTab('gallery')}
          >
            갤러리
          </button>
          <button
            className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
            style={{ width: '100%' }}
            onClick={() => setActiveTab('local')}
          >
            로컬폴더
          </button>
        </div>
        {/* '새 업로드'와 '공유문서함' 버튼 제거 */}
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="browser-loading">
          <div className="loading-spinner"></div>
          <p>로딩 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isLoading && (
        <div className="browser-error">
          <p>{error}</p>
        </div>
      )}

      {/* 파일 리스트 */}
      <div className="browser-content">
        {/* 공도면 목록 */}
        {activeTab === 'blueprints' && !isLoading && (
          <div className="file-list">
            {blueprints.map(blueprint => (
              <div
                key={blueprint.id}
                className={`file-item ${selectedBlueprint?.id === blueprint.id ? 'selected' : ''}`}
                onClick={() => handleBlueprintSelect(blueprint)}
              >
                <div className="file-icon">📐</div>
                <div className="file-info">
                  <div className="file-name">{blueprint.title}</div>
                  <div className="file-meta">
                    {formatFileSize(blueprint.fileSize)} • {blueprint.uploader}
                  </div>
                </div>
                {selectedBlueprint?.id === blueprint.id && <div className="file-check">✓</div>}
              </div>
            ))}
            {blueprints.length === 0 && (
              <div className="empty-state">
                <p>등록된 공도면이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 마킹도면 목록 */}
        {activeTab === 'markups' && !isLoading && (
          <div className="file-list">
            {markupDocuments.map(doc => (
              <div
                key={doc.id}
                className={`file-item ${selectedMarkupDoc?.id === doc.id ? 'selected' : ''}`}
                onClick={() => handleMarkupDocSelect(doc)}
              >
                <div className="file-icon">🎨</div>
                <div className="file-info">
                  <div className="file-name">{doc.title}</div>
                  <div className="file-meta">
                    {doc.markupCount}개 마킹 • {doc.createdByName}
                  </div>
                </div>
                {selectedMarkupDoc?.id === doc.id && <div className="file-check">✓</div>}
              </div>
            ))}
            {markupDocuments.length === 0 && (
              <div className="empty-state">
                <p>마킹된 도면이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {/* 갤러리 */}
        {activeTab === 'gallery' && (
          <div className="gallery-upload">
            <label className="gallery-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleGallerySelect}
                className="gallery-input"
              />
              <div className="gallery-button">
                <span className="gallery-icon">📱</span>
                <span>갤러리에서 선택</span>
              </div>
            </label>
          </div>
        )}

        {/* 로컬폴더 */}
        {activeTab === 'local' && (
          <div className="local-upload">
            <label className="local-label">
              <input
                type="file"
                accept="image/*,.pdf,.dwg"
                onChange={handleGallerySelect}
                className="local-input"
              />
              <div className="local-button">
                <span className="local-icon">📁</span>
                <span>로컬 파일 선택</span>
              </div>
            </label>
          </div>
        )}

        {/* 공유문서함 */}
        {activeTab === 'shared' && !isLoading && (
          <div className="file-list">
            {sharedDocuments.map(doc => (
              <div
                key={doc.id}
                className={`file-item ${selectedBlueprint?.id === doc.id ? 'selected' : ''}`}
                onClick={() => handleBlueprintSelect(doc)}
              >
                <div className="file-icon">🗂️</div>
                <div className="file-info">
                  <div className="file-name">{doc.title}</div>
                  <div className="file-meta">
                    {formatFileSize(doc.fileSize)} • {doc.uploader}
                  </div>
                </div>
                {selectedBlueprint?.id === doc.id && <div className="file-check">✓</div>}
              </div>
            ))}
            {sharedDocuments.length === 0 && (
              <div className="empty-state">
                <p>공유된 문서가 없습니다</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 모달들 */}
      {showUploadModal && (
        <DrawingUploadModal
          isOpen={showUploadModal}
          onClose={() => {
            setShowUploadModal(false)
            setActiveTab('blueprints')
          }}
          onUploadSuccess={() => {
            setShowUploadModal(false)
            setActiveTab('blueprints')
            if (selectedSite) {
              fetchBlueprints(selectedSite)
            }
          }}
          siteId={selectedSite}
          userId={userId}
        />
      )}

      {showPreviewModal && previewData && (
        <DrawingPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          imageUrl={previewData.imageUrl}
          title={previewData.title}
          markupData={previewData.markupData}
          onShare={() => setShowShareModal(true)}
        />
      )}

      {showShareModal && (
        <DrawingShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          drawing={selectedBlueprint || selectedMarkupDoc}
          onShareSuccess={() => {
            toast.success('도면이 성공적으로 공유되었습니다.')
            setShowShareModal(false)
          }}
        />
      )}
    </div>
  )
}

export default DrawingBrowser
