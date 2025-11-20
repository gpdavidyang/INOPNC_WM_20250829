'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MobileLayout as MobileLayoutShell } from '@/modules/mobile/components/layout/MobileLayout'
import { MobileAuthGuard } from '@/modules/mobile/components/auth/mobile-auth-guard'
import { useUnifiedAuth } from '@/hooks/use-unified-auth'
import { useLongPress } from '@/modules/mobile/hooks/useLongPress'
import { DocumentPreviewModal } from '@/modules/mobile/components/documents/DocumentPreviewModal'
import { DocumentShareModal } from '@/modules/mobile/components/documents/DocumentShareModal'
import { DocumentUploadModal } from '@/modules/mobile/components/documents/DocumentUploadModal'
import { useDocumentState } from '@/modules/mobile/hooks/useLocalStorage'
import {
  NotificationProvider,
  useNotificationHelpers,
} from '@/modules/mobile/hooks/useNotification'
import { FilePreviewButton } from '@/components/files/FilePreviewButton'
import './documents-page-v2.css'

interface DocumentItem {
  id: string
  title: string
  hasUpload: boolean
  fileUrl?: string
  fileName?: string
  folderPath?: string
  storageBucket?: string | null
  storagePath?: string | null
  siteId?: string | null
  siteName?: string | null
}

interface PreviewModalState {
  isOpen: boolean
  document: DocumentItem | null
}

interface ShareModalState {
  isOpen: boolean
}

interface UploadModalState {
  isOpen: boolean
  documentId: string | null
  documentTitle: string | null
}

interface DocumentCollection {
  mine: DocumentItem[]
  shared: DocumentItem[]
}

interface SiteOption {
  id: string
  name: string
}

const INITIAL_DOCUMENTS: DocumentCollection = {
  mine: [],
  shared: [],
}

const DOCUMENT_FETCH_LIMIT = 100

const DOCUMENT_TYPE_MAPPING: Record<string, string> = {
  A: 'pre-employment-checkup',
  B: 'safety-training',
  C: 'vehicle-insurance',
  D: 'vehicle-registration',
  E: 'bank-account-copy',
  F: 'id-card',
  G: 'senior-documents',
  H: 'site-safety-rules',
  I: 'equipment-checklist',
}

type DocumentTab = 'mine' | 'shared'

enum DocumentTypeQuery {
  Personal = 'personal',
  Shared = 'shared',
}

export const DocumentsPageV2: React.FC = () => {
  return (
    <MobileAuthGuard>
      <NotificationProvider>
        <DocumentsContentV2 />
      </NotificationProvider>
    </MobileAuthGuard>
  )
}

const DocumentsContentV2: React.FC = () => {
  useUnifiedAuth()

  const {
    documentState,
    updateSelectedDocument,
    updateActiveTab,
    updateSearchQuery,
    updateDeleteMode,
    updateSharedSiteFilter,
  } = useDocumentState()

  const { showSuccess, showWarning, showInfo, showError } = useNotificationHelpers()

  const [documents, setDocuments] = useState<DocumentCollection>(INITIAL_DOCUMENTS)
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [expandedTitleId, setExpandedTitleId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState<PreviewModalState>({
    isOpen: false,
    document: null,
  })
  const [shareModal, setShareModal] = useState<ShareModalState>({ isOpen: false })
  const [uploadModal, setUploadModal] = useState<UploadModalState>({
    isOpen: false,
    documentId: null,
    documentTitle: null,
  })
  const [sharedSiteOptions, setSharedSiteOptions] = useState<SiteOption[]>([])

  const activeTab = documentState.activeTab
  const searchQuery = documentState.searchQuery
  const selectedByTab = documentState.selectedDocuments
  const sharedSiteFilter = documentState.sharedSiteFilter ?? 'all'

  const transformDocuments = useCallback((items: unknown[]): DocumentItem[] => {
    if (!Array.isArray(items)) {
      return []
    }

    return items
      .filter(item => item && typeof item === 'object' && 'id' in (item as Record<string, unknown>))
      .map(item => {
        const doc = item as Record<string, unknown>
        const id = String(doc.id)
        const title =
          (typeof doc.title === 'string' && doc.title.trim()) ||
          (typeof doc.file_name === 'string' && doc.file_name.trim()) ||
          '제목 없음'
        const fileUrl = typeof doc.file_url === 'string' ? doc.file_url : undefined
        const fileName = typeof doc.file_name === 'string' ? doc.file_name : undefined
        const folderPath = typeof doc.folder_path === 'string' ? doc.folder_path : undefined
        const storageBucket = typeof doc.storage_bucket === 'string' ? doc.storage_bucket : null
        const storagePath =
          typeof doc.storage_path === 'string'
            ? doc.storage_path
            : typeof doc.folder_path === 'string'
              ? doc.folder_path
              : null
        const siteInfo =
          doc.site && typeof doc.site === 'object'
            ? (doc.site as { id?: unknown; name?: unknown })
            : undefined
        const siteId = siteInfo && siteInfo.id != null ? String(siteInfo.id) : null
        const siteName = siteInfo && typeof siteInfo.name === 'string' ? siteInfo.name : null

        return {
          id,
          title,
          hasUpload: Boolean(fileUrl),
          fileUrl,
          fileName,
          folderPath,
          storageBucket,
          storagePath,
          siteId,
          siteName,
        }
      })
  }, [])

  const fetchDocuments = useCallback(async () => {
    setIsFetching(true)
    setFetchError(null)

    try {
      const buildQuery = (type: DocumentTypeQuery) => {
        const params = new URLSearchParams({
          type,
          limit: String(DOCUMENT_FETCH_LIMIT),
          page: '1',
        })

        if (type === DocumentTypeQuery.Shared && sharedSiteFilter && sharedSiteFilter !== 'all') {
          params.set('site_id', sharedSiteFilter)
        }

        return `/api/documents?${params.toString()}`
      }

      const [personalResponse, sharedResponse] = await Promise.all([
        fetch(buildQuery(DocumentTypeQuery.Personal), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch(buildQuery(DocumentTypeQuery.Shared), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      const parseResponse = async (response: Response, label: string) => {
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          const message = errorBody?.error || `${label} 문서를 불러오지 못했습니다.`
          throw new Error(message)
        }

        const result = await response.json()
        if (!result?.success) {
          throw new Error(result?.error || `${label} 문서를 불러오지 못했습니다.`)
        }

        return transformDocuments(result.data || [])
      }

      const [personalDocuments, sharedDocuments] = await Promise.all([
        parseResponse(personalResponse, '내'),
        parseResponse(sharedResponse, '공유'),
      ])

      setDocuments({
        mine: personalDocuments,
        shared: sharedDocuments,
      })

      setSharedSiteOptions(prev => {
        if (sharedDocuments.length === 0) {
          return sharedSiteFilter === 'all' ? [] : prev
        }

        const seed = sharedSiteFilter === 'all' ? [] : prev
        const optionMap = new Map<string, SiteOption>()

        seed.forEach(option => {
          optionMap.set(option.id, option)
        })

        sharedDocuments.forEach(doc => {
          if (!doc.siteId) {
            return
          }

          const name = doc.siteName && doc.siteName.trim().length > 0 ? doc.siteName : '현장 미지정'
          optionMap.set(doc.siteId, { id: doc.siteId, name })
        })

        return Array.from(optionMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : '문서 목록을 불러오지 못했습니다.'
      setFetchError(message)
      showError(message, '문서 불러오기 실패')
    } finally {
      setIsFetching(false)
    }
  }, [sharedSiteFilter, showError, transformDocuments])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const ensureSelection = useCallback(
    (tab: DocumentTab, list: DocumentItem[], currentSelectedId: string | null) => {
      if (list.length === 0) {
        if (currentSelectedId) {
          updateSelectedDocument(tab, null)
        }
        return
      }

      const exists = currentSelectedId && list.some(doc => doc.id === currentSelectedId)
      if (!exists) {
        updateSelectedDocument(tab, list[0].id)
      }
    },
    [updateSelectedDocument]
  )

  useEffect(() => {
    ensureSelection('mine', documents.mine, selectedByTab.mine)
  }, [documents.mine, ensureSelection, selectedByTab.mine])

  useEffect(() => {
    ensureSelection('shared', documents.shared, selectedByTab.shared)
  }, [documents.shared, ensureSelection, selectedByTab.shared])

  useEffect(() => {
    if (sharedSiteFilter === 'all') {
      return
    }

    const hasOption = sharedSiteOptions.some(option => option.id === sharedSiteFilter)

    if (!hasOption) {
      updateSharedSiteFilter('all')
      updateSelectedDocument('shared', null)
    }
  }, [sharedSiteFilter, sharedSiteOptions, updateSharedSiteFilter, updateSelectedDocument])

  const activateDeleteMode = useCallback(
    (docId: string) => {
      setDeleteTargetId(docId)
      updateDeleteMode(true)
    },
    [updateDeleteMode]
  )

  const clearDeleteMode = useCallback(() => {
    setDeleteTargetId(null)
    updateDeleteMode(false)
  }, [updateDeleteMode])

  const getLongPressHandlers = useLongPress<string>({
    onLongPress: activateDeleteMode,
  })

  useEffect(() => {
    if (!deleteTargetId) {
      updateDeleteMode(false)
      return
    }

    const handleDismiss = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.delete-btn')) {
        return
      }
      clearDeleteMode()
    }

    document.addEventListener('click', handleDismiss)
    document.addEventListener('touchstart', handleDismiss)

    return () => {
      document.removeEventListener('click', handleDismiss)
      document.removeEventListener('touchstart', handleDismiss)
    }
  }, [clearDeleteMode, deleteTargetId, updateDeleteMode])

  const currentDocuments = useMemo(
    () => (activeTab === 'mine' ? documents.mine : documents.shared),
    [activeTab, documents]
  )

  const currentSelectedId = selectedByTab[activeTab] ?? null

  const filteredDocuments = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) {
      return currentDocuments
    }
    return currentDocuments.filter(doc => doc.title.toLowerCase().includes(keyword))
  }, [currentDocuments, searchQuery])

  const handleTabChange = (tab: DocumentTab) => {
    if (tab === activeTab) return
    updateActiveTab(tab)
    clearDeleteMode()
    setExpandedTitleId(null)
  }

  const handleDocumentSelect = (docId: string) => {
    updateSelectedDocument(activeTab, docId)
    clearDeleteMode()
  }

  const handleCheckboxToggle = (docId: string) => {
    const nextId = currentSelectedId === docId ? null : docId
    updateSelectedDocument(activeTab, nextId)
    clearDeleteMode()
  }

  const handleTitleToggle = (docId: string) => {
    setExpandedTitleId(prev => (prev === docId ? null : docId))
  }

  const handleSearchChange = (value: string) => {
    updateSearchQuery(value)
  }

  const handleSearchCancel = () => {
    updateSearchQuery('')
  }

  const handleSharedSiteFilterChange = (value: string) => {
    if (value === sharedSiteFilter) {
      return
    }

    updateSharedSiteFilter(value)
    updateSelectedDocument('shared', null)
    clearDeleteMode()
    setExpandedTitleId(null)
  }

  const handleUploadDocument = (docId: string) => {
    const document = currentDocuments.find(doc => doc.id === docId)
    if (!document) return

    setUploadModal({
      isOpen: true,
      documentId: document.id,
      documentTitle: document.title,
    })
  }

  const handleDeleteDocument = async (docId: string) => {
    const document = currentDocuments.find(doc => doc.id === docId)
    if (!document) return

    const confirmed = window.confirm(`"${document.title}" 문서를 삭제하시겠습니까?`)
    if (!confirmed) {
      clearDeleteMode()
      return
    }

    try {
      const response = await fetch(`/api/documents?id=${document.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody?.error || '문서 삭제에 실패했습니다.')
      }

      showSuccess('문서를 삭제했습니다.', '삭제 완료')
      if (currentSelectedId === docId) {
        updateSelectedDocument(activeTab, null)
      }
      await fetchDocuments()
    } catch (error) {
      showError(error instanceof Error ? error.message : '문서 삭제에 실패했습니다.', '삭제 실패')
    }

    clearDeleteMode()
  }

  const handleAddNewDocument = () => {
    showInfo('새로운 문서 항목 추가 기능은 준비 중입니다.', '준비 중')
    clearDeleteMode()
  }

  const handleSaveDocuments = () => {
    if (!currentSelectedId) {
      showWarning('저장할 문서를 선택해주세요.', '문서 미선택')
      return
    }

    const document = currentDocuments.find(doc => doc.id === currentSelectedId)
    if (!document) return

    try {
      const storageKey = 'inopnc_saved_documents'
      const raw = window.localStorage.getItem(storageKey)
      const saved: { id: string; title: string }[] = raw ? JSON.parse(raw) : []

      const exists = saved.some(item => item.id === document.id)
      if (exists) {
        showInfo('이미 저장된 문서입니다.', '중복 저장')
        return
      }

      const next = [...saved, { id: document.id, title: document.title }]
      window.localStorage.setItem(storageKey, JSON.stringify(next))
      showSuccess('선택한 문서를 저장했습니다.', '저장 완료')
    } catch (error) {
      console.error('문서 저장 실패:', error)
      showWarning('문서를 저장하지 못했습니다.', '저장 실패')
    }
  }

  const handleShareDocuments = () => {
    if (!currentSelectedId) {
      showWarning('공유할 문서를 선택해주세요.', '문서 미선택')
      return
    }

    clearDeleteMode()
    setShareModal({ isOpen: true })
  }

  const handleUploadComplete = (uploadedFiles: unknown[]) => {
    if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
      showSuccess(`${uploadedFiles.length}개 파일이 업로드되었습니다.`, '업로드 완료')
    }
    setUploadModal({ isOpen: false, documentId: null, documentTitle: null })
    clearDeleteMode()
    fetchDocuments()
  }

  const renderDocuments = () => {
    if (isFetching && filteredDocuments.length === 0) {
      return <div className="document-loading-state">문서를 불러오는 중입니다...</div>
    }

    if (fetchError && filteredDocuments.length === 0) {
      return <div className="document-error-state">{fetchError}</div>
    }

    if (filteredDocuments.length === 0) {
      return (
        <div className="empty-state" role="status">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">표시할 문서가 없습니다</div>
          <div className="empty-state-description">
            다른 검색어를 시도하거나 문서를 업로드해 주세요.
          </div>
        </div>
      )
    }

    return filteredDocuments.map(doc => {
      const isSelected = currentSelectedId === doc.id
      const isDeleteTarget = deleteTargetId === doc.id
      const longPressHandlers = getLongPressHandlers(doc.id)
      const isExpanded = expandedTitleId === doc.id
      const siteLabel =
        doc.siteName && doc.siteName.trim().length > 0 ? doc.siteName : '현장 미지정'

      const previewRecord = doc.fileUrl
        ? {
            file_url: doc.fileUrl,
            storage_bucket: doc.storageBucket || undefined,
            storage_path: doc.storagePath || doc.folderPath || undefined,
            file_name: doc.fileName,
            title: doc.title,
          }
        : null
      return (
        <div
          key={doc.id}
          className={`doc-selection-card${isSelected ? ' active' : ''}${isDeleteTarget ? ' delete-mode' : ''}`}
          data-id={doc.id}
          {...longPressHandlers}
          onClick={() => handleDocumentSelect(doc.id)}
          role="listitem"
        >
          <div className="doc-selection-content">
            <div
              className={`doc-selection-title ${doc.id === 'A' ? 'font-size-16' : ''} ${isExpanded ? 'expanded' : ''}`}
              onClick={event => {
                event.stopPropagation()
                handleTitleToggle(doc.id)
              }}
            >
              {doc.title}
            </div>
            {activeTab === 'shared' && (
              <div className="doc-selection-meta">
                <span className="doc-site-chip">{siteLabel}</span>
              </div>
            )}
          </div>
          <div className="doc-selection-actions">
            {doc.hasUpload && (
              <button
                type="button"
                className="upload-btn"
                onClick={event => {
                  event.stopPropagation()
                  handleUploadDocument(doc.id)
                }}
              >
                업로드
              </button>
            )}
            {previewRecord ? (
              <FilePreviewButton
                document={previewRecord}
                className="preview-btn"
                onClick={event => event.stopPropagation()}
              >
                보기
              </FilePreviewButton>
            ) : (
              <button
                type="button"
                className="preview-btn"
                disabled
                onClick={event => event.stopPropagation()}
              >
                보기
              </button>
            )}
            <button
              type="button"
              className="delete-btn"
              style={{ display: isDeleteTarget ? 'inline-flex' : 'none' }}
              onClick={event => {
                event.stopPropagation()
                handleDeleteDocument(doc.id)
              }}
            >
              삭제
            </button>
            <div className="doc-selection-checkbox">
              <div
                className={`selection-checkmark ${isSelected ? 'active' : ''}`}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={event => {
                  event.stopPropagation()
                  handleCheckboxToggle(doc.id)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    handleCheckboxToggle(doc.id)
                  }
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )
    })
  }

  return (
    <MobileLayoutShell>
      <div className="doc-wrap">
        <div className="tabs" role="tablist">
          <button
            type="button"
            className={`tab ${activeTab === 'mine' ? 'active' : ''}`}
            onClick={() => handleTabChange('mine')}
            role="tab"
            aria-selected={activeTab === 'mine'}
          >
            내 문서함
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
            onClick={() => handleTabChange('shared')}
            role="tab"
            aria-selected={activeTab === 'shared'}
          >
            공유 문서함
          </button>
        </div>

        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" className="search-icon" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                className="search-input"
                placeholder="문서명 검색"
                value={searchQuery}
                onChange={event => handleSearchChange(event.target.value)}
                aria-label="문서명 검색"
              />
            </div>
            <button type="button" className="cancel-btn" onClick={handleSearchCancel}>
              취소
            </button>
          </div>
        </div>

        {activeTab === 'shared' && (
          <div className="site-filter-section">
            <label className="site-filter-label" htmlFor="shared-site-filter">
              현장
            </label>
            <select
              id="shared-site-filter"
              className="site-filter-select"
              value={sharedSiteFilter}
              onChange={event => handleSharedSiteFilterChange(event.target.value)}
            >
              <option value="all">전체</option>
              {sharedSiteOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="document-cards" role="list">
          {renderDocuments()}

          <div
            className="add-upload-box"
            role="button"
            tabIndex={0}
            onClick={handleAddNewDocument}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                handleAddNewDocument()
              }
            }}
          >
            <div className="add-upload-content">
              <div className="add-upload-icon">+</div>
              <div className="add-upload-text">항목 추가하기</div>
            </div>
          </div>
        </div>

        <div className="foot">
          <button type="button" className="btn btn-save" onClick={handleSaveDocuments}>
            저장하기
          </button>
          <button type="button" className="btn btn-primary" onClick={handleShareDocuments}>
            공유하기
          </button>
        </div>

        <DocumentPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, document: null })}
          document={previewModal.document}
        />

        <DocumentShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal({ isOpen: false })}
          selectedDocuments={currentSelectedId ? [currentSelectedId] : []}
          documents={currentDocuments}
        />

        <DocumentUploadModal
          isOpen={uploadModal.isOpen}
          onClose={() => setUploadModal({ isOpen: false, documentId: null, documentTitle: null })}
          documentId={uploadModal.documentId ?? undefined}
          documentTitle={uploadModal.documentTitle ?? undefined}
          documentType={
            uploadModal.documentId
              ? (DOCUMENT_TYPE_MAPPING[uploadModal.documentId] ??
                (activeTab === 'shared' ? 'shared' : 'personal'))
              : activeTab === 'shared'
                ? 'shared'
                : 'personal'
          }
          isPublic={activeTab === 'shared'}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </MobileLayoutShell>
  )
}
