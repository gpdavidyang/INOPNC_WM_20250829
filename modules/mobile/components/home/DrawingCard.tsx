'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

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
  const [activeTab, setActiveTab] = useState<'blueprints' | 'markups' | 'gallery' | 'local'>(
    'blueprints'
  )
  const [showUploadOptions, setShowUploadOptions] = useState(false)

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
      }
    } else {
      setBlueprints([])
      setMarkupDocuments([])
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
            <h3 className="section-title">도면마킹</h3>
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
          <div className="drawing-source-tabs mb-3">
            <div className="tab-buttons-grid">
              <button
                className={`tab-btn ${activeTab === 'blueprints' ? 'active' : ''}`}
                onClick={() => setActiveTab('blueprints')}
              >
                📐 공도면
              </button>
              <button
                className={`tab-btn ${activeTab === 'markups' ? 'active' : ''}`}
                onClick={() => setActiveTab('markups')}
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
                className={`tab-btn ${showUploadOptions ? 'active' : ''}`}
                onClick={() => setShowUploadOptions(!showUploadOptions)}
              >
                ⬆️ 새 업로드
              </button>
              <button
                className="tab-btn"
                onClick={() => toast.info('공유문서함 기능은 Phase 2에서 구현 예정입니다.')}
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
                  <span className="upload-icon">📱</span>
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
                  <span className="upload-icon">📁</span>
                  <p className="upload-text">로컬 파일 선택</p>
                  <p className="upload-hint">PDF, JPG, PNG, DWG 파일 지원</p>
                </div>
              </label>
            </div>
          )}

          {/* 액션 버튼들 - 개선된 레이아웃 */}
          <div className="drawing-actions-container">
            {/* 메인 액션 버튼들 */}
            <div className="drawing-main-actions">
              <button
                className="btn btn-primary btn-large"
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
              <button
                className="btn btn-outline btn-small"
                onClick={() => {
                  const drawing = selectedBlueprint || selectedMarkupDoc
                  if (!drawing) {
                    toast.error('미리볼 도면을 먼저 선택해주세요.')
                    return
                  }
                  toast.info('미리보기 기능은 Phase 3에서 구현 예정입니다.')
                }}
              >
                <span className="btn-icon-small">👁️</span>
                <span>미리보기</span>
              </button>

              <button
                className="btn btn-outline btn-small"
                onClick={() => {
                  const drawing = selectedBlueprint || selectedMarkupDoc
                  if (!drawing) {
                    toast.error('공유할 도면을 먼저 선택해주세요.')
                    return
                  }
                  toast.info('공유 기능은 Phase 3에서 구현 예정입니다.')
                }}
              >
                <span className="btn-icon-small">📤</span>
                <span>공유</span>
              </button>

              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  if (selectedSite) {
                    if (activeTab === 'blueprints') {
                      fetchBlueprints(selectedSite)
                    } else if (activeTab === 'markups') {
                      fetchMarkupDocuments(selectedSite)
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
    </section>
  )
}

export default DrawingCard
