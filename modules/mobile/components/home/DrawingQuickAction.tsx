'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Blueprint {
  id: string
  name: string
  title: string
  fileUrl: string
  uploadDate: string
}

interface RecentMarkup {
  id: string
  title: string
  blueprintUrl: string
  updatedAt: string
  markupCount: number
}

interface DrawingQuickActionProps {
  className?: string
  selectedSite?: string
  siteName?: string
  userId?: string
}

export const DrawingQuickAction: React.FC<DrawingQuickActionProps> = ({
  className = '',
  selectedSite,
  siteName,
  userId,
}) => {
  const router = useRouter()
  const [primaryBlueprint, setPrimaryBlueprint] = useState<Blueprint | null>(null)
  const [recentMarkup, setRecentMarkup] = useState<RecentMarkup | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 현장별 주요 공도면 조회 (최대 1개만)
  useEffect(() => {
    if (selectedSite) {
      fetchPrimaryBlueprint(selectedSite)
      fetchRecentMarkup()
    }
  }, [selectedSite])

  const fetchPrimaryBlueprint = async (siteId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/partner/sites/${siteId}/documents?type=drawing`)
      const data = await response.json()

      if (data.success && data.data?.documents) {
        const drawingDocuments = data.data.documents.filter(
          (doc: any) => doc.categoryType === 'drawing' || doc.categoryType === 'blueprint'
        )

        if (drawingDocuments.length > 0) {
          // 가장 최근 또는 주요 공도면 1개만 선택
          const primary = drawingDocuments[0]
          setPrimaryBlueprint({
            id: primary.id,
            name: primary.name,
            title: primary.title || primary.name,
            fileUrl: primary.fileUrl,
            uploadDate: primary.uploadDate,
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch blueprint:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentMarkup = () => {
    // localStorage에서 최근 마킹 도면 조회
    const recentMarkupData = localStorage.getItem('recent_markup')
    if (recentMarkupData) {
      try {
        const markup = JSON.parse(recentMarkupData)
        setRecentMarkup(markup)
      } catch (error) {
        console.error('Failed to parse recent markup:', error)
      }
    }
  }

  const handleQuickMarkup = () => {
    if (!selectedSite) {
      toast.error('현장을 먼저 선택해주세요')
      return
    }

    if (!primaryBlueprint) {
      toast.info('등록된 공도면이 없습니다. 도면 관리에서 업로드해주세요.')
      router.push('/mobile/markup-tool?mode=upload')
      return
    }

    // 선택된 도면 정보를 localStorage에 저장
    const drawingData = {
      id: primaryBlueprint.id,
      name: primaryBlueprint.name,
      title: primaryBlueprint.title,
      url: primaryBlueprint.fileUrl,
      size: 0,
      type: 'blueprint',
      uploadDate: new Date(primaryBlueprint.uploadDate),
      isMarked: false,
      source: 'blueprint',
      siteId: selectedSite,
      siteName: siteName,
    }

    localStorage.setItem('selected_drawing', JSON.stringify(drawingData))
    localStorage.setItem('selected_site', JSON.stringify({ id: selectedSite, name: siteName }))

    // 마킹 도구 페이지로 이동 (공도면 자동 로드됨)
    router.push('/mobile/markup-tool')
  }

  const handleDrawingManagement = () => {
    // 도면 관리 페이지로 이동 (전체 기능)
    router.push('/mobile/markup-tool?mode=browse')
  }

  const handleRecentMarkupOpen = () => {
    if (!recentMarkup) return

    // 최근 마킹 도면 열기
    const drawingData = {
      id: recentMarkup.id,
      name: recentMarkup.title,
      title: recentMarkup.title,
      url: recentMarkup.blueprintUrl,
      size: 0,
      type: 'markup',
      uploadDate: new Date(recentMarkup.updatedAt),
      isMarked: true,
      markupCount: recentMarkup.markupCount,
    }

    localStorage.setItem('selected_drawing', JSON.stringify(drawingData))
    router.push('/mobile/markup-tool?mode=continue')
  }

  return (
    <section className={`drawing-quick-section ${className}`}>
      <div className="drawing-quick-container">
        <div className="section-header">
          <h3 className="section-title">도면마킹</h3>
          {selectedSite && (
            <button
              className="link-btn"
              onClick={handleDrawingManagement}
              aria-label="도면 관리 페이지로 이동"
            >
              도면 관리 →
            </button>
          )}
        </div>

        {/* 현장 미선택 상태 */}
        {!selectedSite && (
          <div className="empty-state">
            <div className="empty-icon">🏗️</div>
            <p className="empty-text">현장을 먼저 선택해주세요</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {selectedSite && isLoading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">공도면 확인 중...</p>
          </div>
        )}

        {/* 메인 콘텐츠 */}
        {selectedSite && !isLoading && (
          <div className="quick-content">
            {/* 현장 공도면 표시 */}
            {primaryBlueprint && (
              <div className="blueprint-preview">
                <div className="preview-header">
                  <span className="preview-icon">📐</span>
                  <span className="preview-label">현장 공도면</span>
                </div>
                <div className="preview-title">{primaryBlueprint.title}</div>
              </div>
            )}

            {/* 메인 CTA 버튼 */}
            <button
              className="primary-action-btn"
              onClick={handleQuickMarkup}
              aria-label="공도면 마킹 시작"
            >
              <span className="btn-icon">✏️</span>
              <span className="btn-text">공도면 마킹하기</span>
              <span className="btn-arrow">→</span>
            </button>

            {/* 최근 마킹 도면 (있는 경우) */}
            {recentMarkup && (
              <div className="recent-markup" onClick={handleRecentMarkupOpen}>
                <div className="recent-header">
                  <span className="recent-icon">🎨</span>
                  <span className="recent-label">최근 마킹</span>
                  <span className="recent-count">{recentMarkup.markupCount}개 마킹</span>
                </div>
                <div className="recent-title">{recentMarkup.title}</div>
                <div className="recent-date">
                  {new Date(recentMarkup.updatedAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            )}

            {/* 공도면이 없는 경우 */}
            {!primaryBlueprint && (
              <div className="no-blueprint">
                <p className="no-blueprint-text">등록된 공도면이 없습니다</p>
                <button
                  className="upload-btn"
                  onClick={() => router.push('/mobile/markup-tool?mode=upload')}
                >
                  공도면 업로드하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default DrawingQuickAction
