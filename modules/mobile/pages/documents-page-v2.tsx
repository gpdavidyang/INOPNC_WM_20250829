'use client'

import React, { useState, useEffect } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/mobile-layout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { useLongPress } from '@/modules/mobile/hooks/useLongPress'
import { DocumentPreviewModal } from '@/modules/mobile/components/documents/DocumentPreviewModal'
import { DocumentShareModal } from '@/modules/mobile/components/documents/DocumentShareModal'
import { FileUploadSection } from '@/modules/mobile/components/documents/FileUploadSection'
import { useDocumentState, useUserPreferences, useUploadHistory } from '@/modules/mobile/hooks/useLocalStorage'
import './documents-page-v2.css'

interface DocumentItem {
  id: string
  title: string
  hasUpload?: boolean
  isActive?: boolean
}

export const DocumentsPageV2: React.FC = () => {
  return (
    <MobileAuthGuard>
      <DocumentsContentV2 />
    </MobileAuthGuard>
  )
}

const DocumentsContentV2: React.FC = () => {
  const { profile } = useMobileUser()
  
  // 로컬스토리지 상태 훅들
  const {
    documentState,
    updateSelectedDocuments,
    updateActiveTab,
    updateSearchQuery,
    updateFontSize,
    updateDeleteMode
  } = useDocumentState()
  
  const { preferences, updateTheme } = useUserPreferences()
  const { addUploadRecord, getUploadStats } = useUploadHistory()
  
  // 로컬 상태는 localStorage에서 초기화
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>(documentState.activeTab)
  const [searchQuery, setSearchQuery] = useState(documentState.searchQuery)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set(documentState.selectedDocuments.length > 0 ? documentState.selectedDocuments : ['A'])
  )
  const [fontSize, setFontSize] = useState<'fs-100' | 'fs-150'>(documentState.fontSize)
  const [deleteMode, setDeleteMode] = useState(documentState.deleteMode)
  
  // 모달 상태 관리
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    document: DocumentItem | null
  }>({
    isOpen: false,
    document: null
  })
  
  const [shareModal, setShareModal] = useState<{
    isOpen: boolean
  }>({
    isOpen: false
  })
  
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean
    documentId: string | null
    documentTitle: string | null
  }>({
    isOpen: false,
    documentId: null,
    documentTitle: null
  })

  // 내 문서함 문서 목록
  const myDocuments: DocumentItem[] = [
    { id: 'A', title: '배치전 검진', hasUpload: true, isActive: true },
    { id: 'B', title: '기초안전보건교육', hasUpload: true },
    { id: 'C', title: '차량보험증', hasUpload: true },
    { id: 'D', title: '차량등록증', hasUpload: true },
    { id: 'E', title: '통장사본', hasUpload: true },
    { id: 'F', title: '신분증', hasUpload: true },
    { id: 'G', title: '고령자 서류', hasUpload: true },
  ]

  // 공유 문서함 문서 목록
  const sharedDocuments: DocumentItem[] = [
    { id: 'H', title: '현장 안전 수칙(공유)', hasUpload: true },
    { id: 'I', title: '장비 점검 체크리스트', hasUpload: true },
  ]

  const currentDocuments = activeTab === 'mine' ? myDocuments : sharedDocuments

  // 검색 필터링
  const filteredDocuments = currentDocuments.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // 롱프레스로 삭제 모드 진입
  const enterDeleteMode = () => {
    setDeleteMode(true)
    // 햅틱 피드백 (지원하는 브라우저에서)
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
  }

  // 삭제 모드 종료
  const exitDeleteMode = () => {
    setDeleteMode(false)
  }

  const handleTabClick = (tab: 'mine' | 'shared') => {
    setActiveTab(tab)
    updateActiveTab(tab)
    // 탭 전환 시 선택 초기화 및 삭제 모드 종료
    const emptySelection = new Set<string>()
    setSelectedDocuments(emptySelection)
    updateSelectedDocuments([])
    setDeleteMode(false)
    updateDeleteMode(false)
  }

  const handleDocumentClick = (docId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(docId)) {
      newSelected.delete(docId)
    } else {
      newSelected.add(docId)
    }
    setSelectedDocuments(newSelected)
    updateSelectedDocuments(Array.from(newSelected))
  }

  const handleCheckboxClick = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation()
    handleDocumentClick(docId)
  }

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const title = e.currentTarget as HTMLElement
    title.classList.toggle('expanded')

    // 다른 제목들 닫기
    document.querySelectorAll('.doc-selection-title').forEach(otherTitle => {
      if (otherTitle !== title) {
        otherTitle.classList.remove('expanded')
      }
    })
  }

  const handleUploadDocument = (docId: string) => {
    const document = currentDocuments.find(doc => doc.id === docId)
    if (document) {
      setUploadModal({
        isOpen: true,
        documentId: docId,
        documentTitle: document.title
      })
    }
  }

  const handlePreviewDocument = (docId: string) => {
    const document = currentDocuments.find(doc => doc.id === docId)
    if (document) {
      setPreviewModal({
        isOpen: true,
        document
      })
    }
  }

  const handleDeleteDocument = (docId: string) => {
    console.log('Delete document:', docId)
    // 삭제 로직 구현
  }

  const handleAddNewDocument = () => {
    console.log('Add new document')
    // 새 문서 추가 로직 구현
  }

  // 롱프레스 훅 설정
  const longPressHandlers = useLongPress({
    onLongPress: enterDeleteMode,
    delay: 800,
  })

  const handleSaveDocuments = () => {
    const selected = Array.from(selectedDocuments)
    console.log('Save documents:', selected)
    alert(`${selected.length}개의 문서가 저장되었습니다.`)
  }

  const handleShareDocuments = () => {
    if (selectedDocuments.size === 0) {
      alert('공유할 문서를 선택해주세요.')
      return
    }
    
    setShareModal({
      isOpen: true
    })
  }

  const handleSearchCancel = () => {
    setSearchQuery('')
  }

  const handleUploadComplete = (uploadedFiles: any[]) => {
    console.log('Files uploaded successfully:', uploadedFiles)
    
    // TODO: 실제 구현에서는 서버에 업로드 상태를 업데이트해야 함
    // updateDocumentUploadStatus(uploadModal.documentId, uploadedFiles)
    
    alert(`${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다.`)
    setUploadModal({
      isOpen: false,
      documentId: null,
      documentTitle: null
    })
  }

  const handleUploadError = (error: string, fileName: string) => {
    console.error('Upload error:', error, fileName)
    alert(`업로드 실패: ${fileName}\n${error}`)
  }

  useEffect(() => {
    // localStorage에서 폰트 크기 설정 로드
    const savedFontSize = localStorage.getItem('inopnc_font_size') as 'fs-100' | 'fs-150' | null
    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.body.className = savedFontSize
    } else {
      document.body.className = 'fs-100'
    }

    // 버튼 클릭 애니메이션
    const handleButtonClick = function (this: HTMLElement) {
      this.classList.add('clicked')
      setTimeout(() => {
        this.classList.remove('clicked')
      }, 600)
    }

    const buttons = document.querySelectorAll('.btn')
    buttons.forEach(button => {
      button.addEventListener('click', handleButtonClick)
    })

    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', handleButtonClick)
      })
    }
  }, [])

  // 폰트 크기 토글 함수
  const toggleFontSize = () => {
    const newSize = fontSize === 'fs-100' ? 'fs-150' : 'fs-100'
    setFontSize(newSize)
    document.body.className = newSize
    localStorage.setItem('inopnc_font_size', newSize)
  }

  return (
    <MobileLayout
      title=""
      userRole={profile?.role as 'worker' | 'site_manager'}
      showBack={false}
      showNotification={false}
    >
      <div className="doc-wrap">
        {/* 탭 네비게이션 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <div className="tabs" role="tablist">
            <div
              className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
              data-tab="mine"
              role="tab"
              aria-selected={activeTab === 'mine'}
              onClick={() => handleTabClick('mine')}
            >
              내 문서함
            </div>
            <div
              className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
              data-tab="shared"
              role="tab"
              aria-selected={activeTab === 'shared'}
              onClick={() => handleTabClick('shared')}
            >
              공유 문서함
            </div>
          </div>
        </div>

        {/* 삭제 모드 배너 */}
        {deleteMode && (
          <div className="delete-mode-banner">
            <div className="delete-mode-content">
              <div className="delete-mode-icon">🗑️</div>
              <div className="delete-mode-text">
                <div className="delete-mode-title">삭제 모드</div>
                <div className="delete-mode-description">삭제할 문서를 선택하세요</div>
              </div>
              <button
                className="delete-mode-exit"
                onClick={exitDeleteMode}
                aria-label="삭제 모드 종료"
              >
                완료
              </button>
            </div>
          </div>
        )}

        {/* 검색 섹션 */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" className="search-icon">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                className="search-input"
                placeholder="문서명 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              className="cancel-btn"
              onClick={handleSearchCancel}
              style={{ marginRight: '4px' }}
            >
              취소
            </button>
            <button
              className="cancel-btn"
              onClick={toggleFontSize}
              title="글자 크기 변경"
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {fontSize === 'fs-100' ? 'A' : 'A'}
              <span
                style={{ fontSize: fontSize === 'fs-100' ? '16px' : '12px', marginLeft: '2px' }}
              >
                {fontSize === 'fs-100' ? '↑' : '↓'}
              </span>
            </button>
          </div>
        </div>

        {/* 문서 목록 */}
        <div className="document-cards">
          {filteredDocuments.map(doc => (
            <div
              key={doc.id}
              className={`doc-selection-card ${selectedDocuments.has(doc.id) ? 'active' : ''} ${deleteMode ? 'delete-mode' : ''}`}
              data-id={doc.id}
              onClick={() => handleDocumentClick(doc.id)}
              {...longPressHandlers}
            >
              <div className="doc-selection-content">
                <div
                  className={`doc-selection-title ${doc.id === 'A' ? 'font-size-16' : ''}`}
                  onClick={handleTitleClick}
                >
                  {doc.title}
                </div>
              </div>
              <div className="doc-selection-actions">
                {doc.hasUpload && (
                  <button
                    className="upload-btn"
                    onClick={e => {
                      e.stopPropagation()
                      handleUploadDocument(doc.id)
                    }}
                  >
                    업로드
                  </button>
                )}
                <button
                  className="preview-btn"
                  onClick={e => {
                    e.stopPropagation()
                    handlePreviewDocument(doc.id)
                  }}
                >
                  보기
                </button>
                <button
                  className="delete-btn"
                  style={{ display: deleteMode ? 'block' : 'none' }}
                  onClick={e => {
                    e.stopPropagation()
                    handleDeleteDocument(doc.id)
                  }}
                >
                  삭제
                </button>
                <div
                  className="doc-selection-checkbox"
                  onClick={e => handleCheckboxClick(e, doc.id)}
                >
                  <div
                    className={`selection-checkmark ${selectedDocuments.has(doc.id) ? 'active' : ''}`}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 항목 추가하기 박스 */}
          <div className="add-upload-box" onClick={handleAddNewDocument}>
            <div className="add-upload-content">
              <div className="add-upload-icon">+</div>
              <div className="add-upload-text">항목 추가하기</div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="foot">
          <button className="btn btn-save" onClick={handleSaveDocuments}>
            저장하기
          </button>
          <button className="btn btn-primary" onClick={handleShareDocuments}>
            공유하기
          </button>
        </div>

        {/* 문서 미리보기 모달 */}
        <DocumentPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, document: null })}
          document={previewModal.document}
        />

        {/* 문서 공유 모달 */}
        <DocumentShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false })}
          selectedDocuments={Array.from(selectedDocuments)}
          documents={currentDocuments}
        />

        {/* 파일 업로드 모달 */}
        <FileUploadSection
          isOpen={uploadModal.isOpen}
          onClose={() => setUploadModal({
            isOpen: false,
            documentId: null,
            documentTitle: null
          })}
          documentTitle={uploadModal.documentTitle}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </div>
    </MobileLayout>
  )
}
