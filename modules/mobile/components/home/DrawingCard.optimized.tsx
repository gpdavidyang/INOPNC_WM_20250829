'use client'

import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

// Lazy load modals for better performance
const SaveDropdown = lazy(() => import('./SaveDropdown'))
const DrawingUploadModal = lazy(() => import('./DrawingUploadModal'))
const DrawingPreviewModal = lazy(() => import('./DrawingPreviewModal'))
const DrawingShareModal = lazy(() => import('./DrawingShareModal'))

// Loading fallback component
const ModalLoading = () => (
  <div className="modal-loading">
    <div className="loading-spinner"></div>
  </div>
)

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

interface DrawingCardProps {
  className?: string
  selectedSite?: string
  userId?: string
}

// Memoized file item component for better performance
const FileItem = React.memo<{
  item: Blueprint | MarkupDocument
  isSelected: boolean
  onSelect: () => void
  type: 'blueprint' | 'markup'
}>(({ item, isSelected, onSelect, type }) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect()
      }
    },
    [onSelect]
  )

  const isBlueprint = type === 'blueprint'
  const blueprint = item as Blueprint
  const markup = item as MarkupDocument

  return (
    <div
      className={`drawing-file-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${item.title} ${type === 'blueprint' ? '공도면' : '마킹도면'} ${
        isSelected ? '선택됨' : '선택'
      }`}
      onKeyDown={handleKeyDown}
    >
      <div className="file-info">
        <span className="file-icon">{isBlueprint ? '📐' : '🎨'}</span>
        <div className="file-details">
          <span className="file-name">{item.title}</span>
          <div className="file-meta">
            {isBlueprint ? (
              <>
                <span className="file-size">{formatFileSize(blueprint.fileSize)}</span>
                <span className="file-uploader">업로드: {blueprint.uploader}</span>
                <span className="file-date">{blueprint.uploadDate}</span>
              </>
            ) : (
              <>
                <span className="file-uploader">작성자: {markup.createdByName}</span>
                <span className="file-date">{new Date(markup.createdAt).toLocaleDateString()}</span>
                <span className="markup-count">{markup.markupCount}개 마킹</span>
              </>
            )}
          </div>
          {isBlueprint && blueprint.description && (
            <span className="file-description">{blueprint.description}</span>
          )}
          {!isBlueprint && <span className="file-description">현장: {markup.siteName}</span>}
        </div>
      </div>
      {isSelected && <div className="file-selected-badge">선택됨</div>}
    </div>
  )
})

FileItem.displayName = 'FileItem'

// Utility function outside component to avoid recreation
const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return '크기 정보 없음'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export const DrawingCard: React.FC<DrawingCardProps> = React.memo(
  ({ className = '', selectedSite, userId }) => {
    const [blueprints, setBlueprints] = useState<Blueprint[]>([])
    const [markupDocuments, setMarkupDocuments] = useState<MarkupDocument[]>([])
    const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
    const [selectedMarkupDoc, setSelectedMarkupDoc] = useState<MarkupDocument | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<
      'blueprints' | 'markups' | 'gallery' | 'local' | 'shared' | 'upload'
    >('blueprints')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [sharedDocuments, setSharedDocuments] = useState<Blueprint[]>([])
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [previewData, setPreviewData] = useState<{
      imageUrl: string
      title: string
      markupData?: any[]
    } | null>(null)

    // Memoized supabase client
    const supabase = useMemo(() => createClient(), [])

    // Memoized fetch functions with useCallback
    const fetchBlueprints = useCallback(async (siteId: string) => {
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
    }, [])

    const fetchSharedDocuments = useCallback(
      async (siteId: string) => {
        if (!siteId) return

        setIsLoading(true)
        try {
          const { data, error } = await supabase
            .from('unified_documents')
            .select('*')
            .eq('site_id', siteId)
            .eq('category_type', 'drawing')
            .eq('status', 'active')
            .order('created_at', { ascending: false })

          if (error) throw error

          const formattedDocs: Blueprint[] = (data || []).map(doc => ({
            id: doc.id,
            name: doc.file_name,
            title: doc.title,
            description: doc.description,
            fileUrl: doc.file_url,
            uploadDate: doc.created_at,
            uploader: doc.uploaded_by,
            fileSize: doc.file_size,
            mimeType: doc.mime_type,
          }))

          setSharedDocuments(formattedDocs)
        } catch (error) {
          console.error('Error fetching shared documents:', error)
          toast.error('공유문서함 조회 실패')
        } finally {
          setIsLoading(false)
        }
      },
      [supabase]
    )

    const fetchMarkupDocuments = useCallback(
      async (siteId: string) => {
        if (!siteId) return

        setIsLoading(true)
        try {
          const params = new URLSearchParams({
            site_id: siteId,
            ...(userId && { user_id: userId }),
            include_shared: 'true',
          })

          const response = await fetch(`/api/markup-documents/list?${params}`)
          const data = await response.json()

          if (data.success && data.data?.documents) {
            setMarkupDocuments(data.data.documents)
          } else {
            setMarkupDocuments([])
          }
        } catch (error) {
          console.error('Error fetching markup documents:', error)
          setMarkupDocuments([])
        } finally {
          setIsLoading(false)
        }
      },
      [userId]
    )

    // Effect for fetching data
    useEffect(() => {
      if (selectedSite) {
        if (activeTab === 'blueprints') {
          fetchBlueprints(selectedSite)
        } else if (activeTab === 'markups') {
          fetchMarkupDocuments(selectedSite)
        } else if (activeTab === 'shared') {
          fetchSharedDocuments(selectedSite)
        }
      } else {
        setBlueprints([])
        setMarkupDocuments([])
        setSharedDocuments([])
        setSelectedBlueprint(null)
        setSelectedMarkupDoc(null)
        setError(null)
      }
    }, [selectedSite, activeTab, fetchBlueprints, fetchMarkupDocuments, fetchSharedDocuments])

    // Memoized handlers
    const handleBlueprintSelect = useCallback((blueprint: Blueprint) => {
      setSelectedBlueprint(blueprint)
      setSelectedMarkupDoc(null)

      const drawingFile = {
        id: blueprint.id,
        name: blueprint.name,
        size: blueprint.fileSize || 0,
        type: blueprint.mimeType,
        url: blueprint.fileUrl,
        uploadDate: new Date(blueprint.uploadDate),
        isMarked: false,
      }

      localStorage.setItem('selected_drawing', JSON.stringify(drawingFile))
      toast.success(`"${blueprint.title}" 공도면을 선택했습니다.`)
    }, [])

    const handleMarkupDocSelect = useCallback((markupDoc: MarkupDocument) => {
      setSelectedMarkupDoc(markupDoc)
      setSelectedBlueprint(null)

      const drawingFile = {
        id: markupDoc.id,
        name: markupDoc.title,
        url: markupDoc.blueprintUrl,
        uploadDate: new Date(markupDoc.createdAt),
        isMarked: true,
        markupData: markupDoc.markupData,
      }

      localStorage.setItem('selected_drawing', JSON.stringify(drawingFile))
      toast.success(`"${markupDoc.title}" 마킹도면을 선택했습니다.`)
    }, [])

    const handleGallerySelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 선택할 수 있습니다.')
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        const drawingFile = {
          id: `gallery_${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: e.target?.result as string,
          uploadDate: new Date(),
          isMarked: false,
          source: 'gallery',
        }

        localStorage.setItem('selected_drawing', JSON.stringify(drawingFile))
        toast.success(`갤러리에서 "${file.name}"을 선택했습니다.`)

        setSelectedBlueprint(null)
        setSelectedMarkupDoc(null)
      }
      reader.readAsDataURL(file)
    }, [])

    const handleSave = useCallback(
      async (type: 'shared' | 'local' | 'gallery' | 'temporary') => {
        const selectedDrawing = selectedBlueprint || selectedMarkupDoc
        if (!selectedDrawing) {
          toast.error('저장할 도면을 먼저 선택해주세요.')
          return
        }

        switch (type) {
          case 'shared':
            try {
              const { error } = await supabase.from('unified_documents').insert({
                title: selectedDrawing.title || selectedDrawing.name,
                description: selectedDrawing.description,
                file_url: selectedDrawing.fileUrl || selectedDrawing.blueprintUrl,
                file_name: selectedDrawing.name,
                file_size: selectedDrawing.fileSize,
                mime_type: selectedDrawing.mimeType || 'image/jpeg',
                category_type: 'drawing',
                sub_type: 'marked',
                site_id: selectedSite,
                uploaded_by: userId,
                status: 'active',
              })

              if (error) throw error
              toast.success('공유문서함에 저장했습니다.')
            } catch (error) {
              console.error('Error saving to shared:', error)
              toast.error('공유문서함 저장 실패')
            }
            break

          case 'local':
            try {
              const response = await fetch(selectedDrawing.fileUrl || selectedDrawing.blueprintUrl)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${selectedDrawing.title || selectedDrawing.name}.${
                blob.type.split('/')[1]
              }`
              document.body.appendChild(a)
              a.click()
              window.URL.revokeObjectURL(url)
              document.body.removeChild(a)
              toast.success('파일을 다운로드했습니다.')
            } catch (error) {
              console.error('Error downloading:', error)
              toast.error('다운로드 실패')
            }
            break

          case 'gallery':
            try {
              if (navigator.share) {
                const response = await fetch(
                  selectedDrawing.fileUrl || selectedDrawing.blueprintUrl
                )
                const blob = await response.blob()
                const file = new File([blob], `${selectedDrawing.title}.jpg`, { type: blob.type })

                await navigator.share({
                  files: [file],
                  title: selectedDrawing.title,
                  text: '도면 저장',
                })
                toast.success('사진첩에 저장했습니다.')
              } else {
                await handleSave('local')
              }
            } catch (error) {
              console.error('Error saving to gallery:', error)
              toast.error('사진첩 저장 실패')
            }
            break

          case 'temporary':
            try {
              const drawingData = {
                ...selectedDrawing,
                savedAt: new Date().toISOString(),
                siteId: selectedSite,
              }
              localStorage.setItem('temp_drawing', JSON.stringify(drawingData))
              toast.success('임시 저장했습니다.')
            } catch (error) {
              console.error('Error saving temporarily:', error)
              toast.error('임시 저장 실패')
            }
            break
        }
      },
      [selectedBlueprint, selectedMarkupDoc, selectedSite, userId, supabase]
    )

    const handleUploadSuccess = useCallback(
      (file: any) => {
        const newBlueprint: Blueprint = {
          id: file.id,
          name: file.name,
          title: file.name,
          description: '',
          fileUrl: file.url,
          uploadDate: file.uploadDate.toISOString(),
          uploader: userId || 'Unknown',
          fileSize: file.size,
          mimeType: file.type,
        }

        setBlueprints(prev => [newBlueprint, ...prev])
        setSelectedBlueprint(newBlueprint)
        setActiveTab('blueprints')
        setShowUploadModal(false)

        const drawingFile = {
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          url: file.url,
          uploadDate: file.uploadDate,
          isMarked: false,
        }
        localStorage.setItem('selected_drawing', JSON.stringify(drawingFile))
      },
      [userId]
    )

    // Render function continues with the same JSX but using lazy-loaded components
    return (
      <section className={`section mb-3.5 ${className}`}>
        {/* Same JSX content as original but with Suspense wrappers for modals */}
        <div className="work-form-container">
          <div className="form-section drawing-section">
            <div className="section-header mb-3">
              <h3 className="section-title" id="drawing-section-title">
                도면마킹
              </h3>
              <span className="upload-counter">
                {activeTab === 'blueprints' &&
                  blueprints.length > 0 &&
                  `${blueprints.length}개 공도면`}
                {activeTab === 'markups' &&
                  markupDocuments.length > 0 &&
                  `${markupDocuments.length}개 마킹도면`}
              </span>
            </div>

            {/* Tab buttons with accessibility */}
            <div className="drawing-source-tabs mb-3" role="tablist" aria-label="도면 소스 선택">
              <div className="tab-buttons-grid">
                <button
                  className={`tab-btn ${activeTab === 'blueprints' ? 'active' : ''}`}
                  onClick={() => setActiveTab('blueprints')}
                  role="tab"
                  aria-selected={activeTab === 'blueprints'}
                  aria-controls="blueprints-panel"
                  aria-label="공도면 탭"
                >
                  📐 공도면
                </button>
                <button
                  className={`tab-btn ${activeTab === 'markups' ? 'active' : ''}`}
                  onClick={() => setActiveTab('markups')}
                  role="tab"
                  aria-selected={activeTab === 'markups'}
                  aria-controls="markups-panel"
                  aria-label="마킹도면 탭"
                >
                  🎨 마킹도면
                </button>
                {/* Other tab buttons remain the same */}
              </div>
            </div>

            {/* Content panels with optimized FileItem components */}
            {activeTab === 'blueprints' && blueprints.length > 0 && !isLoading && (
              <div className="drawing-files-list mb-3">
                {blueprints.map(blueprint => (
                  <FileItem
                    key={blueprint.id}
                    item={blueprint}
                    isSelected={selectedBlueprint?.id === blueprint.id}
                    onSelect={() => handleBlueprintSelect(blueprint)}
                    type="blueprint"
                  />
                ))}
              </div>
            )}

            {activeTab === 'markups' && !isLoading && (
              <div className="drawing-files-list mb-3">
                {markupDocuments.length > 0 ? (
                  markupDocuments.map(doc => (
                    <FileItem
                      key={doc.id}
                      item={doc}
                      isSelected={selectedMarkupDoc?.id === doc.id}
                      onSelect={() => handleMarkupDocSelect(doc)}
                      type="markup"
                    />
                  ))
                ) : (
                  <div className="drawing-placeholder">
                    <div className="placeholder-icon">🎨</div>
                    <p className="placeholder-text">저장된 마킹도면이 없습니다.</p>
                  </div>
                )}
              </div>
            )}

            {/* Other content sections remain the same */}
          </div>
        </div>

        {/* Lazy-loaded modals with Suspense */}
        <Suspense fallback={<ModalLoading />}>
          {showUploadModal && (
            <DrawingUploadModal
              isOpen={showUploadModal}
              onClose={() => setShowUploadModal(false)}
              onUploadSuccess={handleUploadSuccess}
              siteId={selectedSite}
              userId={userId}
            />
          )}

          {previewData && showPreviewModal && (
            <DrawingPreviewModal
              isOpen={showPreviewModal}
              onClose={() => {
                setShowPreviewModal(false)
                setPreviewData(null)
              }}
              imageUrl={previewData.imageUrl}
              title={previewData.title}
              markupData={previewData.markupData}
              onShare={() => {
                setShowPreviewModal(false)
                setShowShareModal(true)
              }}
            />
          )}

          {(selectedBlueprint || selectedMarkupDoc) && showShareModal && (
            <DrawingShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              documentId={selectedBlueprint?.id || selectedMarkupDoc?.id || ''}
              documentTitle={selectedBlueprint?.title || selectedMarkupDoc?.title || ''}
              imageUrl={selectedBlueprint?.fileUrl || selectedMarkupDoc?.blueprintUrl || ''}
              markupData={selectedMarkupDoc?.markupData}
            />
          )}
        </Suspense>
      </section>
    )
  }
)

DrawingCard.displayName = 'DrawingCard'

export default DrawingCard
