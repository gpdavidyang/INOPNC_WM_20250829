'use client'

import React, { useState, useEffect } from 'react'
import '@/modules/mobile/styles/worklogs.css'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSiteBlueprints } from '@/modules/mobile/hooks/use-blueprints'
import { toast } from 'sonner'

interface Blueprint {
  id: string
  name: string
  title: string
  fileUrl: string
  uploadDate: string
  isPrimary?: boolean
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
  const [error, setError] = useState<string | null>(null)
  const [blueprintChoices, setBlueprintChoices] = useState<Blueprint[]>([])
  const [showChooser, setShowChooser] = useState(false)
  const {
    data: blueprintData,
    isLoading: bpLoading,
    error: bpError,
    prefetch,
  } = useSiteBlueprints(selectedSite)

  // 현장별 주요 공도면 조회 (React Query Hook 사용) + 최근 마킹 로드
  useEffect(() => {
    if (selectedSite) {
      fetchRecentMarkup()
    }
  }, [selectedSite])

  const fetchPrimaryBlueprint = async (siteId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/partner/sites/${siteId}/documents?type=drawing`)
      const data = await response.json()

      if (data.success && data.data?.documents) {
        const drawingDocuments = data.data.documents.filter(
          (doc: any) => doc.categoryType === 'drawing' || doc.categoryType === 'blueprint'
        )

        const mapped: Blueprint[] = drawingDocuments.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          title: doc.title || doc.name,
          fileUrl: doc.fileUrl,
          uploadDate: doc.uploadDate,
          isPrimary:
            doc.is_primary_blueprint === true ||
            doc.isPrimary === true ||
            doc.metadata?.is_primary === true,
        }))

        // 정렬: 대표 도면 우선 -> 최신 업로드 순
        const sorted = mapped.sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1
          if (!a.isPrimary && b.isPrimary) return 1
          const ta = new Date(a.uploadDate).getTime()
          const tb = new Date(b.uploadDate).getTime()
          return tb - ta
        })

        setBlueprintChoices(sorted)

        if (sorted.length > 0) {
          setPrimaryBlueprint(sorted[0])
        } else {
          setPrimaryBlueprint(null)
        }
      } else {
        setPrimaryBlueprint(null)
      }
    } catch (error) {
      setError('공도면 조회에 실패했습니다')
      setPrimaryBlueprint(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentMarkup = async () => {
    // 1) 서버 최근 마킹 (있으면 최우선)
    try {
      if (selectedSite) {
        const res = await fetch(
          `/api/markup-documents/list?site_id=${encodeURIComponent(selectedSite)}`
        )
        const json = await res.json()
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const top = json.data[0]
          setRecentMarkup({
            id: top.id,
            title: top.title || top.name,
            blueprintUrl: top.blueprintUrl || top.fileUrl || '',
            updatedAt: top.updatedAt || top.createdAt || new Date().toISOString(),
            markupCount: top.markupCount || (top.markup_data?.length ?? 0),
          })
          return
        }
      }
    } catch (e) {
      // ignore and fallback to localStorage
    }

    // 2) localStorage fallback
    const recentMarkupData = localStorage.getItem('recent_markup')
    if (recentMarkupData) {
      try {
        const markup = JSON.parse(recentMarkupData)
        setRecentMarkup(markup)
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }

  // 공도면이 로드되면 자동으로 localStorage에 저장
  useEffect(() => {
    if (primaryBlueprint && selectedSite) {
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
    }
  }, [primaryBlueprint, selectedSite, siteName])

  const handleQuickMarkup = () => {
    if (!selectedSite) {
      toast.error('현장을 먼저 선택해주세요')
      return
    }

    if (!primaryBlueprint) {
      toast.info('등록된 공도면이 없습니다. 아래 대체 경로를 이용해주세요.')
      return
    }

    // 공도면이 이미 localStorage에 저장되어 있으므로 바로 이동
    const params = new URLSearchParams()
    params.set('mode', 'start')
    if (selectedSite) params.set('siteId', selectedSite)
    if (primaryBlueprint?.id) params.set('docId', primaryBlueprint.id)
    router.push(`/mobile/markup-tool?${params.toString()}`)
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
        {selectedSite && (isLoading || bpLoading) && (
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
                  <span className="preview-label">현장 공도면</span>
                </div>
                <div className="preview-title">{primaryBlueprint.title}</div>
              </div>
            )}

            {/* 메인 CTA 버튼 - Link 프리패치 */}
            {primaryBlueprint ? (
              <Link
                href={`/mobile/markup-tool?mode=start&siteId=${encodeURIComponent(selectedSite!)}&docId=${encodeURIComponent(primaryBlueprint.id)}`}
                className="primary-action-btn"
                aria-label="공도면 마킹 시작"
                prefetch
              >
                <span className="btn-text">마킹 시작</span>
                <span className="btn-arrow">→</span>
              </Link>
            ) : (
              <button className="primary-action-btn" aria-label="공도면 준비 중..." disabled>
                <span className="btn-text">공도면 준비 중...</span>
                <span className="btn-arrow">→</span>
              </button>
            )}

            {/* 다건일 때 대표 도면 선택 */}
            {blueprintChoices.length > 1 && (
              <button
                className="upload-btn"
                onClick={() => setShowChooser(true)}
                aria-label="대표 도면 선택"
              >
                다른 공도면 선택하기
              </button>
            )}

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
                <div className="no-blueprint-icon">📋</div>
                <p className="no-blueprint-title">공도면이 등록되어 있지 않습니다</p>
                <p className="no-blueprint-desc">
                  본사 관리자가 해당 현장 공도면 등록 후,
                  <br />
                  사용 가능합니다.
                </p>
                {error && (
                  <div className="text-sm" style={{ color: '#b91c1c', marginTop: 6 }}>
                    {error}
                  </div>
                )}
                <div className="support-section">
                  <p className="support-label">도움이 필요하신가요?</p>
                  <a
                    href="https://open.kakao.com/o/g6r8yDRh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="kakao-link"
                  >
                    <span className="kakao-icon">💬</span>
                    카카오톡 오픈채팅 문의
                  </a>
                </div>
                <div className="divider"></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="upload-btn"
                    onClick={() =>
                      router.push('/mobile/markup-tool?mode=upload&source=photo&saveOnly=1')
                    }
                  >
                    <span className="upload-icon">📷</span>
                    촬영본 업로드(저장)
                  </button>
                  <button
                    className="upload-btn"
                    onClick={() => router.push('/mobile/markup-tool?mode=upload&source=photo')}
                  >
                    <span className="upload-icon">✏️</span>
                    사진으로 마킹하기
                  </button>
                  <button
                    className="upload-btn"
                    onClick={() => fetchPrimaryBlueprint(selectedSite!)}
                  >
                    재시도
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 도면 선택 모달 */}
        {showChooser && blueprintChoices.length > 1 && (
          <div className="diary-viewer-overlay" onClick={() => setShowChooser(false)}>
            <div
              className="diary-viewer-panel"
              style={{ maxWidth: 520 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="diary-viewer-header">
                <div className="diary-viewer-title">공도면 선택</div>
                <button
                  className="diary-viewer-close"
                  onClick={() => setShowChooser(false)}
                  aria-label="닫기"
                >
                  ×
                </button>
              </div>
              <div className="diary-viewer-body" style={{ gridTemplateColumns: '1fr' }}>
                {blueprintChoices.map(choice => (
                  <div
                    key={choice.id}
                    className="diary-info-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setPrimaryBlueprint(choice)
                      setShowChooser(false)
                    }}
                  >
                    <span>{choice.title}</span>
                    <strong>{new Date(choice.uploadDate).toLocaleDateString('ko-KR')}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default DrawingQuickAction
