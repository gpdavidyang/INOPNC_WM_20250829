'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { SaveDropdown } from './SaveDropdown'
import { DrawingUploadModal } from './DrawingUploadModal'
import { DrawingPreviewModal } from './DrawingPreviewModal'
import { DrawingShareModal } from './DrawingShareModal'
import { createClient } from '@/lib/supabase/client'

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

export const DrawingCard: React.FC<DrawingCardProps> = ({
  className = '',
  selectedSite,
  userId,
}) => {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [markupDocuments, setMarkupDocuments] = useState<MarkupDocument[]>([])
  const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null)
  const [selectedMarkupDoc, setSelectedMarkupDoc] = useState<MarkupDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<
    'blueprints' | 'markups' | 'gallery' | 'local' | 'shared' | 'upload'
  >('blueprints')
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sharedDocuments, setSharedDocuments] = useState<Blueprint[]>([])
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [previewData, setPreviewData] = useState<{
    imageUrl: string
    title: string
    markupData?: any[]
  } | null>(null)

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
        // 도면(drawing) 및 청사진(blueprint) 타입만 필터링
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

  // 공유문서함 조회 함수
  const fetchSharedDocuments = async (siteId: string) => {
    if (!siteId) return

    setIsLoading(true)
    try {
      const supabase = createClient()
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
  }

  // 마킹도면 조회 함수
  const fetchMarkupDocuments = async (siteId: string) => {
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
  }

  // 현장 선택 시 공도면 및 마킹도면 조회
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
  }, [selectedSite, activeTab])

  // 공도면 선택 핸들러
  const handleBlueprintSelect = (blueprint: Blueprint) => {
    setSelectedBlueprint(blueprint)
    setSelectedMarkupDoc(null) // 마킹도면 선택 해제

    // localStorage에 선택된 도면 저장 (마킹도구에서 사용)
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
  }

  // 마킹도면 선택 핸들러
  const handleMarkupDocSelect = (markupDoc: MarkupDocument) => {
    setSelectedMarkupDoc(markupDoc)
    setSelectedBlueprint(null) // 공도면 선택 해제

    // localStorage에 선택된 마킹도면 저장
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
  }

  // 갤러리에서 파일 선택 핸들러
  const handleGallerySelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 선택할 수 있습니다.')
      return
    }

    // 파일을 Data URL로 변환
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

      // 선택 표시
      setSelectedBlueprint(null)
      setSelectedMarkupDoc(null)
    }
    reader.readAsDataURL(file)
  }

  // 저장 핸들러
  const handleSave = async (type: 'shared' | 'local' | 'gallery' | 'temporary') => {
    const selectedDrawing = selectedBlueprint || selectedMarkupDoc
    if (!selectedDrawing) {
      toast.error('저장할 도면을 먼저 선택해주세요.')
      return
    }

    const supabase = createClient()

    switch (type) {
      case 'shared':
        // 공유문서함에 저장
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
        // 로컬에 다운로드
        try {
          const response = await fetch(selectedDrawing.fileUrl || selectedDrawing.blueprintUrl)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${selectedDrawing.title || selectedDrawing.name}.${blob.type.split('/')[1]}`
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
        // 사진첩에 저장 (모바일 전용)
        try {
          if (navigator.share) {
            const response = await fetch(selectedDrawing.fileUrl || selectedDrawing.blueprintUrl)
            const blob = await response.blob()
            const file = new File([blob], `${selectedDrawing.title}.jpg`, { type: blob.type })

            await navigator.share({
              files: [file],
              title: selectedDrawing.title,
              text: '도면 저장',
            })
            toast.success('사진첩에 저장했습니다.')
          } else {
            // 대체: 다운로드
            await handleSave('local')
          }
        } catch (error) {
          console.error('Error saving to gallery:', error)
          toast.error('사진첩 저장 실패')
        }
        break

      case 'temporary':
        // 임시 저장 (localStorage)
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
  }

  // 업로드 성공 핸들러
  const handleUploadSuccess = (file: any) => {
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

    // localStorage에도 저장
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
    <section className={`section mb-3.5 ${className}`}>
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

          {/* 도면 소스 탭 버튼들 */}
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
              <button
                className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                onClick={() => setActiveTab('gallery')}
              >
                📱 갤러리
              </button>
              <button
                className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
                onClick={() => setActiveTab('local')}
              >
                📁 로컬폴더
              </button>
              <button
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('upload')
                  setShowUploadModal(true)
                }}
              >
                ⬆️ 새 업로드
              </button>
              <button
                className={`tab-btn ${activeTab === 'shared' ? 'active' : ''}`}
                onClick={() => setActiveTab('shared')}
              >
                🗂️ 공유문서함
              </button>
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="drawing-loading mb-3">
              <div className="loading-spinner"></div>
              <p className="loading-text">공도면을 불러오는 중...</p>
            </div>
          )}

          {/* 에러 상태 - 현장 선택 안됨 */}
          {!selectedSite && !isLoading && (
            <div className="drawing-placeholder mb-3">
              <div className="placeholder-icon">🏗️</div>
              <p className="placeholder-text">현장을 먼저 선택해주세요</p>
            </div>
          )}

          {/* 에러 상태 - 공도면 없음 */}
          {selectedSite && error && !isLoading && (
            <div className="drawing-placeholder mb-3">
              <div className="placeholder-icon">📐</div>
              <p className="placeholder-text">{error}</p>
            </div>
          )}

          {/* 공도면 탭 콘텐츠 */}
          {activeTab === 'blueprints' && blueprints.length > 0 && !isLoading && (
            <div className="drawing-files-list mb-3">
              {blueprints.map(blueprint => (
                <div
                  key={blueprint.id}
                  className={`drawing-file-item ${selectedBlueprint?.id === blueprint.id ? 'selected' : ''}`}
                  onClick={() => handleBlueprintSelect(blueprint)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedBlueprint?.id === blueprint.id}
                  aria-label={`${blueprint.title} 공도면 ${selectedBlueprint?.id === blueprint.id ? '선택됨' : '선택'}`}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleBlueprintSelect(blueprint)
                    }
                  }}
                >
                  <div className="file-info">
                    <span className="file-icon">📐</span>
                    <div className="file-details">
                      <span className="file-name">{blueprint.title}</span>
                      <div className="file-meta">
                        <span className="file-size">{formatFileSize(blueprint.fileSize)}</span>
                        <span className="file-uploader">업로드: {blueprint.uploader}</span>
                        <span className="file-date">{blueprint.uploadDate}</span>
                      </div>
                      {blueprint.description && (
                        <span className="file-description">{blueprint.description}</span>
                      )}
                    </div>
                  </div>
                  {selectedBlueprint?.id === blueprint.id && (
                    <div className="file-selected-badge">선택됨</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 마킹도면 탭 콘텐츠 */}
          {activeTab === 'markups' && !isLoading && (
            <div className="drawing-files-list mb-3">
              {markupDocuments.length > 0 ? (
                markupDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className={`drawing-file-item ${selectedMarkupDoc?.id === doc.id ? 'selected' : ''}`}
                    onClick={() => handleMarkupDocSelect(doc)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedMarkupDoc?.id === doc.id}
                    aria-label={`${doc.title} 마킹도면 ${selectedMarkupDoc?.id === doc.id ? '선택됨' : '선택'}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleMarkupDocSelect(doc)
                      }
                    }}
                  >
                    <div className="file-info">
                      <span className="file-icon">🎨</span>
                      <div className="file-details">
                        <span className="file-name">{doc.title}</span>
                        <div className="file-meta">
                          <span className="file-uploader">작성자: {doc.createdByName}</span>
                          <span className="file-date">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </span>
                          <span className="markup-count">{doc.markupCount}개 마킹</span>
                        </div>
                        <span className="file-description">현장: {doc.siteName}</span>
                      </div>
                    </div>
                    {selectedMarkupDoc?.id === doc.id && (
                      <div className="file-selected-badge">선택됨</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="drawing-placeholder">
                  <div className="placeholder-icon">🎨</div>
                  <p className="placeholder-text">저장된 마킹도면이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 갤러리 탭 콘텐츠 */}
          {activeTab === 'gallery' && !isLoading && (
            <div className="drawing-upload-area mb-3">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleGallerySelect}
                style={{ display: 'none' }}
                id="gallery-input"
              />
              <label htmlFor="gallery-input" className="upload-label">
                <div className="upload-content">
                  <span className="upload-icon" aria-hidden="true">
                    {/* Line icon: photo/image */}
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="16" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="9.5" r="1.5"></circle>
                      <path d="M21 17l-5-5-4 4-3-3-6 6"></path>
                    </svg>
                  </span>
                  <p className="upload-text">갤러리에서 이미지 선택</p>
                  <p className="upload-hint">사진첩의 도면 이미지를 선택하세요</p>
                </div>
              </label>
            </div>
          )}

          {/* 로컬폴더 탭 콘텐츠 */}
          {activeTab === 'local' && !isLoading && (
            <div className="drawing-upload-area mb-3">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dwg"
                onChange={handleGallerySelect}
                style={{ display: 'none' }}
                id="local-input"
              />
              <label htmlFor="local-input" className="upload-label">
                <div className="upload-content">
                  <span className="upload-icon" aria-hidden="true">
                    {/* Line icon: folder */}
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                    </svg>
                  </span>
                  <p className="upload-text">로컬 파일 선택</p>
                  <p className="upload-hint">PDF, JPG, PNG, DWG 파일 지원</p>
                </div>
              </label>
            </div>
          )}

          {/* 공유문서함 탭 콘텐츠 */}
          {activeTab === 'shared' && !isLoading && (
            <div className="drawing-files-list mb-3">
              {sharedDocuments.length > 0 ? (
                sharedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className={`drawing-file-item ${selectedBlueprint?.id === doc.id ? 'selected' : ''}`}
                    onClick={() => handleBlueprintSelect(doc)}
                  >
                    <div className="file-info">
                      <span className="file-icon">🗂️</span>
                      <div className="file-details">
                        <span className="file-name">{doc.title}</span>
                        <div className="file-meta">
                          <span className="file-size">{formatFileSize(doc.fileSize)}</span>
                          <span className="file-date">{doc.uploadDate}</span>
                        </div>
                        {doc.description && (
                          <span className="file-description">{doc.description}</span>
                        )}
                      </div>
                    </div>
                    {selectedBlueprint?.id === doc.id && (
                      <div className="file-selected-badge">선택됨</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="drawing-placeholder">
                  <div className="placeholder-icon">🗂️</div>
                  <p className="placeholder-text">공유문서함에 도면이 없습니다.</p>
                </div>
              )}
            </div>
          )}

          {/* 액션 버튼들 - 개선된 레이아웃 */}
          <div className="drawing-actions-container">
            {/* 메인 액션 버튼들 */}
            <div className="drawing-main-actions">
              <button
                className="btn btn-primary btn-large"
                aria-label="마킹 도구로 도면 편집 시작"
                aria-disabled={
                  !selectedBlueprint &&
                  !selectedMarkupDoc &&
                  !localStorage.getItem('selected_drawing')
                }
                onClick={() => {
                  const hasSelection =
                    selectedBlueprint ||
                    selectedMarkupDoc ||
                    localStorage.getItem('selected_drawing')
                  if (!hasSelection) {
                    toast.error('도면을 먼저 선택해주세요.')
                    return
                  }
                  // 마킹 도구 페이지로 이동
                  window.location.href = '/mobile/markup-tool'
                }}
                disabled={
                  !selectedBlueprint &&
                  !selectedMarkupDoc &&
                  !localStorage.getItem('selected_drawing')
                }
              >
                <span className="btn-icon">🖊️</span>
                <span className="btn-text">마킹 시작하기</span>
              </button>
            </div>

            {/* 서브 액션 버튼들 */}
            <div className="drawing-sub-actions">
              {/* 저장 드롭다운 */}
              <SaveDropdown
                onSave={handleSave}
                disabled={!selectedBlueprint && !selectedMarkupDoc}
                isLoading={isLoading}
              />

              <button
                className="btn btn-outline btn-small"
                aria-label="선택한 도면 미리보기"
                aria-disabled={!selectedBlueprint && !selectedMarkupDoc}
                onClick={() => {
                  const drawing = selectedBlueprint || selectedMarkupDoc
                  if (!drawing) {
                    toast.error('미리볼 도면을 먼저 선택해주세요.')
                    return
                  }

                  // 미리보기 데이터 설정
                  if (selectedBlueprint) {
                    setPreviewData({
                      imageUrl: selectedBlueprint.fileUrl,
                      title: selectedBlueprint.title,
                      markupData: undefined,
                    })
                  } else if (selectedMarkupDoc) {
                    setPreviewData({
                      imageUrl: selectedMarkupDoc.blueprintUrl,
                      title: selectedMarkupDoc.title,
                      markupData: selectedMarkupDoc.markupData,
                    })
                  }
                  setShowPreviewModal(true)
                }}
              >
                <span className="btn-icon-small">👁️</span>
                <span>미리보기</span>
              </button>

              <button
                className="btn btn-outline btn-small"
                aria-label="선택한 도면 공유하기"
                aria-disabled={!selectedBlueprint && !selectedMarkupDoc}
                onClick={() => {
                  const drawing = selectedBlueprint || selectedMarkupDoc
                  if (!drawing) {
                    toast.error('공유할 도면을 먼저 선택해주세요.')
                    return
                  }
                  setShowShareModal(true)
                }}
              >
                <span className="btn-icon-small">📤</span>
                <span>공유</span>
              </button>

              <button
                className="btn btn-secondary btn-small"
                aria-label="도면 목록 새로고침"
                aria-disabled={isLoading || !selectedSite}
                onClick={() => {
                  if (selectedSite) {
                    if (activeTab === 'blueprints') {
                      fetchBlueprints(selectedSite)
                    } else if (activeTab === 'markups') {
                      fetchMarkupDocuments(selectedSite)
                    } else if (activeTab === 'shared') {
                      fetchSharedDocuments(selectedSite)
                    }
                    toast.success('목록을 새로고침했습니다.')
                  } else {
                    toast.error('현장을 먼저 선택해주세요.')
                  }
                }}
                disabled={isLoading || !selectedSite}
              >
                <span className="btn-icon-small">🔄</span>
                <span>새로고침</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 업로드 모달 */}
      <DrawingUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        siteId={selectedSite}
        userId={userId}
      />

      {/* 미리보기 모달 */}
      {previewData && (
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

      {/* 공유 모달 */}
      {(selectedBlueprint || selectedMarkupDoc) && (
        <DrawingShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          documentId={selectedBlueprint?.id || selectedMarkupDoc?.id || ''}
          documentTitle={selectedBlueprint?.title || selectedMarkupDoc?.title || ''}
          imageUrl={selectedBlueprint?.fileUrl || selectedMarkupDoc?.blueprintUrl || ''}
          markupData={selectedMarkupDoc?.markupData}
        />
      )}
    </section>
  )
}

export default DrawingCard
