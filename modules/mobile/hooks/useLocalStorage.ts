'use client'

import { useState, useEffect, useCallback } from 'react'

interface DocumentSelectionState {
  mine: string | null
  shared: string | null
}

// 문서 상태 인터페이스
interface DocumentState {
  selectedDocuments: DocumentSelectionState
  activeTab: 'mine' | 'shared'
  searchQuery: string
  fontSize: 'fs-100' | 'fs-150'
  deleteMode: boolean
  sharedSiteFilter: string
}

const DEFAULT_DOCUMENT_STATE: DocumentState = {
  selectedDocuments: {
    mine: null,
    shared: null,
  },
  activeTab: 'mine',
  searchQuery: '',
  fontSize: 'fs-100',
  deleteMode: false,
  sharedSiteFilter: 'all',
}

// 로컬스토리지 키 타입
type StorageKey = 'documentState' | 'userPreferences' | 'uploadHistory'

// 사용자 환경설정 인터페이스
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'fs-100' | 'fs-150'
  autoSave: boolean
  notifications: boolean
}

// 업로드 히스토리 인터페이스
interface UploadHistoryItem {
  documentId: string
  fileName: string
  uploadDate: string
  fileSize: number
  success: boolean
}

export const useLocalStorage = <T>(
  key: StorageKey,
  defaultValue: T,
  options?: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
  }
) => {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options || {}

  // 초기 상태 설정
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserialize(item) : defaultValue
    } catch (error) {
      console.warn(`로컬스토리지에서 ${key} 읽기 실패:`, error)
      return defaultValue
    }
  })

  // 상태 저장 함수
  const setValue = useCallback(
    (value: T | ((prevState: T) => T)) => {
      setState(prevState => {
        const valueToStore = value instanceof Function ? value(prevState) : value

        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, serialize(valueToStore))
          }
        } catch (error) {
          console.error(`로컬스토리지에 ${key} 저장 실패:`, error)
        }

        return valueToStore
      })
    },
    [key, serialize]
  )

  // 상태 제거 함수
  const removeValue = useCallback(() => {
    try {
      setState(defaultValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`로컬스토리지에서 ${key} 제거 실패:`, error)
    }
  }, [key, defaultValue])

  return [state, setValue, removeValue] as const
}

// 문서 상태 전용 훅
export const useDocumentState = () => {
  const [documentState, setDocumentState, removeDocumentState] = useLocalStorage(
    'documentState',
    DEFAULT_DOCUMENT_STATE
  )

  const normalizeSelection = useCallback(
    (selection: DocumentState['selectedDocuments']): DocumentSelectionState => {
      if (Array.isArray(selection)) {
        const [mine, shared] = selection
        return {
          mine: mine ?? null,
          shared: shared ?? null,
        }
      }
      return selection
    },
    []
  )

  // 이전 구조(배열)에서 저장된 데이터를 객체 형태로 마이그레이션
  useEffect(() => {
    if (Array.isArray(documentState.selectedDocuments)) {
      setDocumentState(prev => ({
        ...prev,
        selectedDocuments: normalizeSelection(prev.selectedDocuments),
      }))
    }
  }, [documentState.selectedDocuments, normalizeSelection, setDocumentState])

  useEffect(() => {
    if (typeof documentState.sharedSiteFilter === 'undefined') {
      setDocumentState(prev => ({
        ...prev,
        sharedSiteFilter: 'all',
      }))
    }
  }, [documentState.sharedSiteFilter, setDocumentState])

  // 특정 필드만 업데이트하는 헬퍼 함수들
  const updateSelectedDocument = useCallback(
    (tab: 'mine' | 'shared', documentId: string | null) => {
      setDocumentState(prev => ({
        ...prev,
        selectedDocuments: {
          ...normalizeSelection(prev.selectedDocuments),
          [tab]: documentId,
        },
      }))
    },
    [normalizeSelection, setDocumentState]
  )

  const updateActiveTab = useCallback(
    (tab: 'mine' | 'shared') => {
      setDocumentState(prev => ({
        ...prev,
        activeTab: tab,
      }))
    },
    [setDocumentState]
  )

  const updateSearchQuery = useCallback(
    (query: string) => {
      setDocumentState(prev => ({
        ...prev,
        searchQuery: query,
      }))
    },
    [setDocumentState]
  )

  const updateFontSize = useCallback(
    (size: 'fs-100' | 'fs-150') => {
      setDocumentState(prev => ({
        ...prev,
        fontSize: size,
      }))
    },
    [setDocumentState]
  )

  const updateDeleteMode = useCallback(
    (mode: boolean) => {
      setDocumentState(prev => ({
        ...prev,
        deleteMode: mode,
      }))
    },
    [setDocumentState]
  )

  const updateSharedSiteFilter = useCallback(
    (siteId: string) => {
      setDocumentState(prev => ({
        ...prev,
        sharedSiteFilter: siteId,
      }))
    },
    [setDocumentState]
  )

  // 상태 초기화 함수
  const resetDocumentState = useCallback(() => {
    setDocumentState(DEFAULT_DOCUMENT_STATE)
  }, [setDocumentState])

  return {
    documentState,
    updateSelectedDocument,
    updateActiveTab,
    updateSearchQuery,
    updateFontSize,
    updateDeleteMode,
    updateSharedSiteFilter,
    resetDocumentState,
    removeDocumentState,
  }
}

// 사용자 환경설정 전용 훅
export const useUserPreferences = () => {
  const defaultPreferences: UserPreferences = {
    theme: 'auto',
    fontSize: 'fs-100',
    autoSave: true,
    notifications: true,
  }

  const [preferences, setPreferences, removePreferences] = useLocalStorage(
    'userPreferences',
    defaultPreferences
  )

  // 테마 업데이트
  const updateTheme = useCallback(
    (theme: 'light' | 'dark' | 'auto') => {
      setPreferences(prev => ({
        ...prev,
        theme,
      }))
    },
    [setPreferences]
  )

  // 폰트 크기 업데이트
  const updateFontSize = useCallback(
    (fontSize: 'fs-100' | 'fs-150') => {
      setPreferences(prev => ({
        ...prev,
        fontSize,
      }))
    },
    [setPreferences]
  )

  // 자동 저장 설정
  const updateAutoSave = useCallback(
    (autoSave: boolean) => {
      setPreferences(prev => ({
        ...prev,
        autoSave,
      }))
    },
    [setPreferences]
  )

  // 알림 설정
  const updateNotifications = useCallback(
    (notifications: boolean) => {
      setPreferences(prev => ({
        ...prev,
        notifications,
      }))
    },
    [setPreferences]
  )

  return {
    preferences,
    updateTheme,
    updateFontSize,
    updateAutoSave,
    updateNotifications,
    removePreferences,
  }
}

// 업로드 히스토리 전용 훅
export const useUploadHistory = () => {
  const [uploadHistory, setUploadHistory, removeUploadHistory] = useLocalStorage<
    UploadHistoryItem[]
  >('uploadHistory', [])

  // 업로드 기록 추가
  const addUploadRecord = useCallback(
    (record: Omit<UploadHistoryItem, 'uploadDate'>) => {
      const newRecord: UploadHistoryItem = {
        ...record,
        uploadDate: new Date().toISOString(),
      }

      setUploadHistory(prev => [newRecord, ...prev].slice(0, 100)) // 최대 100개까지만 저장
    },
    [setUploadHistory]
  )

  // 성공한 업로드만 필터링
  const getSuccessfulUploads = useCallback(() => {
    return uploadHistory.filter(item => item.success)
  }, [uploadHistory])

  // 실패한 업로드만 필터링
  const getFailedUploads = useCallback(() => {
    return uploadHistory.filter(item => !item.success)
  }, [uploadHistory])

  // 특정 문서의 업로드 기록
  const getDocumentUploads = useCallback(
    (documentId: string) => {
      return uploadHistory.filter(item => item.documentId === documentId)
    },
    [uploadHistory]
  )

  // 업로드 통계
  const getUploadStats = useCallback(() => {
    const total = uploadHistory.length
    const successful = uploadHistory.filter(item => item.success).length
    const failed = total - successful
    const totalSize = uploadHistory
      .filter(item => item.success)
      .reduce((acc, item) => acc + item.fileSize, 0)

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      totalSize,
    }
  }, [uploadHistory])

  // 오래된 기록 정리 (30일 이상)
  const cleanOldRecords = useCallback(() => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    setUploadHistory(prev => prev.filter(item => new Date(item.uploadDate) > thirtyDaysAgo))
  }, [setUploadHistory])

  return {
    uploadHistory,
    addUploadRecord,
    getSuccessfulUploads,
    getFailedUploads,
    getDocumentUploads,
    getUploadStats,
    cleanOldRecords,
    removeUploadHistory,
  }
}

// 디바운싱 기능이 포함된 localStorage 훅
export const useDebouncedLocalStorage = <T>(
  key: StorageKey,
  defaultValue: T,
  delay: number = 500
) => {
  const [state, setState] = useState<T>(defaultValue)
  const [debouncedState, setDebouncedState] = useState<T>(defaultValue)

  // 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const item = window.localStorage.getItem(key)
      const value = item ? JSON.parse(item) : defaultValue
      setState(value)
      setDebouncedState(value)
    } catch (error) {
      console.warn(`디바운스드 로컬스토리지에서 ${key} 읽기 실패:`, error)
    }
  }, [key, defaultValue])

  // 디바운싱 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedState(state)

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(key, JSON.stringify(state))
        } catch (error) {
          console.error(`디바운스드 로컬스토리지에 ${key} 저장 실패:`, error)
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [state, key, delay])

  return [debouncedState, setState] as const
}
