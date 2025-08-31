import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

export interface UnifiedDocument {
  id: string
  title: string
  description?: string
  file_name: string
  original_filename?: string
  file_url: string
  file_path?: string
  file_size?: number
  mime_type?: string
  category_type: string
  sub_category?: string
  document_type?: string
  owner_id?: string
  uploaded_by: string
  site_id?: string
  customer_company_id?: string
  daily_report_id?: string
  status: 'active' | 'archived' | 'deleted' | 'rejected'
  is_public: boolean
  is_archived: boolean
  approval_required: boolean
  approved_by?: string
  approved_at?: string
  metadata?: Record<string, any>
  photo_metadata?: Record<string, any>
  markup_data?: any[]
  receipt_metadata?: Record<string, any>
  tags?: string[]
  folder_path?: string
  legacy_table?: string
  legacy_id?: string
  created_at: string
  updated_at: string
  
  // Relations
  owner?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  uploader?: {
    id: string
    full_name: string
    email: string
    role: string
  }
  site?: {
    id: string
    name: string
    address: string
    status: string
  }
  customer_company?: {
    id: string
    name: string
    company_type: string
  }
  daily_report?: {
    id: string
    report_date: string
    status: string
  }
}

export interface DocumentCategory {
  category_type: string
  display_name_ko: string
  display_name_en?: string
  description?: string
  icon?: string
  color?: string
  sort_order: number
  stats?: {
    total: number
    active: number
  }
}

export interface DocumentFilters {
  categoryType?: string
  subCategory?: string
  siteId?: string
  ownerId?: string
  status?: string
  search?: string
  tags?: string[]
  page?: number
  limit?: number
  sortBy?: 'created_at' | 'title' | 'file_size'
  sortOrder?: 'asc' | 'desc'
}

export interface DocumentPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DocumentStatistics {
  total_documents: number
  by_category: Record<string, number>
}

interface UseUnifiedDocumentsReturn {
  // Data
  documents: UnifiedDocument[]
  categories: DocumentCategory[]
  pagination: DocumentPagination | null
  statistics: DocumentStatistics | null
  
  // Loading states
  loading: boolean
  uploading: boolean
  
  // Error states
  error: string | null
  
  // Actions
  fetchDocuments: (filters?: DocumentFilters) => Promise<void>
  fetchCategories: (includeStats?: boolean) => Promise<void>
  uploadDocument: (file: File, metadata: Partial<UnifiedDocument>) => Promise<UnifiedDocument | null>
  updateDocument: (id: string, updates: Partial<UnifiedDocument>) => Promise<UnifiedDocument | null>
  deleteDocument: (id: string, hardDelete?: boolean) => Promise<boolean>
  bulkAction: (action: 'delete' | 'archive' | 'restore' | 'update' | 'change_category', documentIds: string[], updateData?: any) => Promise<boolean>
  
  // Utility functions
  getDocumentsByCategory: (categoryType: string) => UnifiedDocument[]
  searchDocuments: (query: string) => Promise<void>
  clearError: () => void
}

export function useUnifiedDocuments(initialFilters?: DocumentFilters): UseUnifiedDocumentsReturn {
  const [documents, setDocuments] = useState<UnifiedDocument[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [pagination, setPagination] = useState<DocumentPagination | null>(null)
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchDocuments = useCallback(async (filters: DocumentFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      
      Object.entries({ ...initialFilters, ...filters }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            searchParams.set(key, value.join(','))
          } else {
            searchParams.set(key, String(value))
          }
        }
      })

      const response = await fetch(`/api/unified-documents?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch documents')
      }

      setDocuments(result.data || [])
      setPagination(result.pagination || null)
      setStatistics(result.statistics || null)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents'
      setError(errorMessage)
      toast({
        title: '문서 조회 실패',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [initialFilters, toast])

  const fetchCategories = useCallback(async (includeStats = true) => {
    try {
      const searchParams = new URLSearchParams()
      if (includeStats) {
        searchParams.set('include_stats', 'true')
      }

      const response = await fetch(`/api/unified-documents/categories?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }

      setCategories(result.data || [])

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      setError(errorMessage)
      console.error('Fetch categories error:', err)
    }
  }, [])

  const uploadDocument = useCallback(async (file: File, metadata: Partial<UnifiedDocument>): Promise<UnifiedDocument | null> => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, value.join(','))
          } else {
            formData.append(key, String(value))
          }
        }
      })

      const response = await fetch('/api/unified-documents', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload document')
      }

      toast({
        title: '문서 업로드 성공',
        description: `${file.name} 파일이 성공적으로 업로드되었습니다.`
      })

      // 문서 목록 새로고침
      await fetchDocuments()

      return result.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload document'
      setError(errorMessage)
      toast({
        title: '문서 업로드 실패',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setUploading(false)
    }
  }, [fetchDocuments, toast])

  const updateDocument = useCallback(async (id: string, updates: Partial<UnifiedDocument>): Promise<UnifiedDocument | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/unified-documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update document')
      }

      // 로컬 상태 업데이트
      setDocuments(prev => prev.map(doc => 
        doc.id === id ? { ...doc, ...result.data } : doc
      ))

      toast({
        title: '문서 업데이트 성공',
        description: '문서가 성공적으로 업데이트되었습니다.'
      })

      return result.data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update document'
      setError(errorMessage)
      toast({
        title: '문서 업데이트 실패',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    }
  }, [toast])

  const deleteDocument = useCallback(async (id: string, hardDelete = false): Promise<boolean> => {
    setError(null)

    try {
      const searchParams = new URLSearchParams()
      if (hardDelete) {
        searchParams.set('hard', 'true')
      }

      const response = await fetch(`/api/unified-documents/${id}?${searchParams.toString()}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete document')
      }

      // 로컬 상태에서 제거 또는 상태 업데이트
      if (hardDelete) {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === id ? { ...doc, status: 'deleted' } : doc
        ))
      }

      toast({
        title: hardDelete ? '문서 영구 삭제 완료' : '문서 삭제 완료',
        description: hardDelete ? '문서가 영구적으로 삭제되었습니다.' : '문서가 휴지통으로 이동되었습니다.'
      })

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete document'
      setError(errorMessage)
      toast({
        title: '문서 삭제 실패',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [toast])

  const bulkAction = useCallback(async (
    action: 'delete' | 'archive' | 'restore' | 'update' | 'change_category',
    documentIds: string[],
    updateData?: any
  ): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch('/api/unified-documents/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          documentIds,
          updateData
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to perform bulk action')
      }

      toast({
        title: '대량 작업 완료',
        description: `${result.data.affected_documents}개 문서에 대한 ${action} 작업이 완료되었습니다.`
      })

      // 문서 목록 새로고침
      await fetchDocuments()

      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk action'
      setError(errorMessage)
      toast({
        title: '대량 작업 실패',
        description: errorMessage,
        variant: 'destructive'
      })
      return false
    }
  }, [fetchDocuments, toast])

  const getDocumentsByCategory = useCallback((categoryType: string): UnifiedDocument[] => {
    return documents.filter(doc => doc.category_type === categoryType && doc.status === 'active')
  }, [documents])

  const searchDocuments = useCallback(async (query: string) => {
    await fetchDocuments({ search: query })
  }, [fetchDocuments])

  // 초기 데이터 로드
  useEffect(() => {
    fetchDocuments(initialFilters)
    fetchCategories()
  }, [fetchDocuments, fetchCategories, initialFilters])

  return {
    // Data
    documents,
    categories,
    pagination,
    statistics,
    
    // Loading states
    loading,
    uploading,
    
    // Error states
    error,
    
    // Actions
    fetchDocuments,
    fetchCategories,
    uploadDocument,
    updateDocument,
    deleteDocument,
    bulkAction,
    
    // Utility functions
    getDocumentsByCategory,
    searchDocuments,
    clearError
  }
}