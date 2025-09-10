'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, File, Folder, Search, Download, Eye, 
  Trash2, FileText, Image, 
  Grid, List, CheckCircle, X, AlertCircle,
  Clock, Share2, Mail, MessageSquare, Link2,
  Camera, FileCheck, ChevronUp, ChevronDown
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ShareDialog from '@/components/documents/share-dialog'

interface DocumentsTabProps {
  profile: Profile
  hideRequiredDocs?: boolean
  showOnlyRequiredDocs?: boolean
  onRequiredDocsUpdate?: (completed: number, total: number) => void
}

interface Document {
  id: string
  name: string
  type: string
  size: number
  category: string
  uploadedAt: string
  uploadedBy: string
  url?: string
  thumbnail?: string
  status?: 'completed' | 'pending' | 'processing' | 'review'
  isRequired?: boolean
  documentType?: string
  site?: string
  siteAddress?: string
}

interface RequiredDocument {
  id: string
  name: string
  description: string
  category: string
  isRequired: boolean
  uploadedDocument?: Document
  example?: string
  acceptedFormats?: string[]
  maxSize?: number
}

interface UploadProgress {
  fileName: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

const MAX_FILE_SIZE_MB = 10
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export default function DocumentsTab({ 
  profile, 
  hideRequiredDocs = false,
  showOnlyRequiredDocs = false,
  onRequiredDocsUpdate 
}: DocumentsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [isRequiredDocsExpanded, setIsRequiredDocsExpanded] = useState(showOnlyRequiredDocs ? true : true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [documentToShare, setDocumentToShare] = useState<Document | null>(null)
  const [uploadingDocuments, setUploadingDocuments] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // 필수 서류 목록 - 동적으로 로드
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([])
  const [submissionStatus, setSubmissionStatus] = useState<any[]>([])

  useEffect(() => {
    loadRequiredDocuments()
    loadDocuments()
    loadSubmissionStatus()
  }, [])

  // Calculate and report required docs progress
  useEffect(() => {
    const uploadedCount = requiredDocuments.filter(reqDoc => {
      const hasSubmitted = submissionStatus.some(status => 
        status.requirement_id === reqDoc.id && 
        ['submitted', 'approved'].includes(status.submission_status)
      )
      return hasSubmitted || documents.some(doc => doc.documentType === reqDoc.id && doc.status === 'completed')
    }).length
    const totalCount = requiredDocuments.filter(doc => doc.isRequired || doc.is_mandatory).length
    
    if (onRequiredDocsUpdate) {
      onRequiredDocsUpdate(uploadedCount, totalCount)
    }
  }, [documents, requiredDocuments, submissionStatus, onRequiredDocsUpdate])

  const loadRequiredDocuments = async () => {
    try {
      const response = await fetch('/api/required-documents')
      const result = await response.json()
      
      if (result.success && result.data) {
        const transformedDocs = result.data.map((req: any) => ({
          id: req.id,
          name: req.requirement_name,
          description: req.description,
          category: req.document_type,
          isRequired: req.is_mandatory || true,
          acceptedFormats: req.file_format_allowed || ['application/pdf', 'image/jpeg', 'image/png'],
          maxSize: req.max_file_size_mb || 10,
          instructions: req.instructions
        }))
        setRequiredDocuments(transformedDocs)
      }
    } catch (error) {
      console.error('Error loading required documents:', error)
      // Keep empty array as fallback
    }
  }

  const loadSubmissionStatus = async () => {
    try {
      const response = await fetch('/api/user-document-submissions')
      const result = await response.json()
      
      if (result.success && result.data) {
        setSubmissionStatus(result.data)
      }
    } catch (error) {
      console.error('Error loading submission status:', error)
      // Keep empty array as fallback
    }
  }

  const loadDocuments = async () => {
    setLoading(true)
    try {
      // Fetch markup documents
      const markupResponse = await fetch('/api/markup-documents?location=personal')
      const markupResult = await markupResponse.json()
      
      const markupDocuments: Document[] = []
      
      if (markupResult.success && markupResult.data) {
        markupResult.data.forEach((doc: any) => {
          markupDocuments.push({
            id: doc.id,
            name: doc.title,
            type: 'markup-document',
            size: doc.file_size || 1024000, // Default 1MB if not specified
            category: 'construction-docs',
            uploadedAt: doc.created_at,
            uploadedBy: doc.created_by_name || profile.full_name,
            url: `/dashboard/markup?open=${doc.id}`
          })
        })
      }

      // Fetch documents from API with proper error handling
      const response = await fetch('/api/documents?type=personal&includeRequired=true')
      const result = await response.json()
      
      let apiDocuments: Document[] = []
      
      if (result.success && result.data && Array.isArray(result.data)) {
        // API 데이터를 Document 형식으로 변환
        apiDocuments = result.data.map((doc: any) => ({
          id: doc.id,
          name: doc.name || doc.title || doc.filename,
          type: doc.type || doc.mime_type,
          size: doc.size || doc.file_size || 0,
          category: doc.category || doc.document_type || 'personal',
          uploadedAt: doc.uploadedAt || doc.created_at,
          uploadedBy: doc.uploadedBy || doc.owner?.full_name || doc.owner_name || profile.full_name,
          url: doc.url || doc.file_url,
          site: doc.site?.name || doc.site_name,
          siteAddress: doc.site?.address || doc.site_address,
          status: doc.status || 'completed',
          documentType: doc.documentType,
          isRequired: doc.isRequired || false
        }))
      } else {
        // Fallback 데이터 (빈 배열로 시작)
        apiDocuments = [
          {
            id: '1',
            name: '2024년 7월 작업일지.pdf',
            type: 'application/pdf',
            size: 2048576, // 2MB
            category: 'work-reports',
            uploadedAt: '2024-08-01T10:30:00Z',
            uploadedBy: profile.full_name,
            url: '/documents/sample.pdf'
          },
        {
          id: '2',
          name: '안전점검표_8월.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024000, // 1MB
          category: 'safety-docs',
          uploadedAt: '2024-07-30T14:20:00Z',
          uploadedBy: profile.full_name
        },
        {
          id: '3',
          name: '현장사진_슬라브타설.jpg',
          type: 'image/jpeg',
          size: 3145728, // 3MB
          category: 'photos',
          uploadedAt: '2024-07-29T16:45:00Z',
          uploadedBy: profile.full_name,
          thumbnail: '/images/construction-site.jpg'
        },
        {
          id: '4',
          name: '시공계획서_최종.pdf',
          type: 'application/pdf',
          size: 5242880, // 5MB
          category: 'construction-docs',
          uploadedAt: '2024-07-28T09:15:00Z',
          uploadedBy: profile.full_name
        },
        {
          id: '5',
          name: '건설기술자격증.pdf',
          type: 'application/pdf',
          size: 512000, // 500KB
          category: 'certificates',
          uploadedAt: '2024-07-25T11:00:00Z',
          uploadedBy: profile.full_name
        }
      ]
      }

      // Combine markup documents with API documents
      const allDocuments = [...markupDocuments, ...apiDocuments]
      
      setDocuments(allDocuments)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter documents based on showOnlyRequiredDocs prop
  const displayDocuments = showOnlyRequiredDocs 
    ? documents.filter(doc => doc.documentType && requiredDocuments.some(reqDoc => reqDoc.id === doc.documentType))
    : documents

  const filteredAndSortedDocuments = displayDocuments
    .filter(doc => {
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (type: string) => {
    if (type === 'markup-document') return FileText
    if (type.startsWith('image/')) return Image
    if (type.includes('pdf')) return FileText
    if (type.includes('word')) return FileText
    if (type.includes('excel')) return FileText
    return File
  }

  const validateFile = (file: File): string | null => {
    // console.log('🔍 Validating file:', file.name, 'type:', file.type, 'size:', file.size)
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      // console.log('❌ File type not allowed:', file.type)
      return `지원하지 않는 파일 형식입니다. (${file.type})`
    }
    
    const maxSize = MAX_FILE_SIZE_MB * 1024 * 1024
    if (file.size > maxSize) {
      // console.log('❌ File too large:', file.size, 'max:', maxSize)
      return `파일 크기가 ${MAX_FILE_SIZE_MB}MB를 초과합니다. (${Math.round(file.size / 1024 / 1024 * 100) / 100}MB)`
    }
    
    // console.log('✅ File validation passed')
    return null
  }

  const uploadFile = async (file: File, category: string = 'misc', documentType?: string, requirementId?: string) => {
    // console.log('🔥🚀 uploadFile called with parameters:', {
    //   fileName: file.name,
    //   fileSize: file.size,
    //   fileType: file.type,
    //   category,
    //   documentType,
    //   profileName: profile.full_name
    // })
    
    // Step 1: File Validation
    // console.log('1️⃣ Starting file validation...')
    const validation = validateFile(file)
    if (validation) {
      // console.log('❌ File validation failed:', validation)
      setUploadProgress(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: validation
      }])
      return Promise.reject(new Error(validation))
    }
    // console.log('✅ File validation passed')

    // Step 2: Initialize Progress Tracking
    // console.log('2️⃣ Initializing progress tracking...')
    const progressItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }
    
    setUploadProgress(prev => {
      // console.log('📊 Adding progress item:', progressItem)
      // console.log('📊 Previous progress:', prev)
      const newProgress = [...prev, progressItem]
      // console.log('📊 New progress:', newProgress)
      return newProgress
    })

    try {
      // Step 3: Create FormData
      // console.log('3️⃣ Creating FormData...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      formData.append('uploadedBy', profile.full_name)
      
      if (documentType) {
        // console.log('📋 Adding document type to FormData:', documentType)
        formData.append('documentType', documentType)
        const reqDoc = requiredDocuments.find(doc => doc.id === documentType)
        if (reqDoc) {
          // console.log('📋 Found required document config:', reqDoc)
          formData.append('isRequired', reqDoc.isRequired.toString())
          // Add requirement_id for linking
          formData.append('requirementId', reqDoc.id)
        }
      }
      
      // Add requirement_id if provided directly
      if (requirementId) {
        formData.append('requirementId', requirementId)
      }

      // Log FormData contents
      // console.log('📋 FormData contents:')
      for (const [key, value] of formData.entries()) {
        // console.log(`  ${key}:`, value instanceof File ? `File(${value.name}, ${value.size}b)` : value)
      }

      // Step 4: API Upload
      // console.log('4️⃣ Starting API upload to /api/documents')
      setUploadProgress(prev => {
        const updated = prev.map(item => 
          item.fileName === file.name 
            ? { ...item, progress: 20 }
            : item
        )
        // console.log('📊 Updated progress to 20%:', updated)
        return updated
      })

      // console.log('📡 Making fetch request...')
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      // console.log('📡 API response received:', {
      //   status: response.status,
      //   statusText: response.statusText,
      //   ok: response.ok,
      //   headers: Object.fromEntries(response.headers.entries())
      // })

      setUploadProgress(prev => {
        const updated = prev.map(item => 
          item.fileName === file.name 
            ? { ...item, progress: 80 }
            : item
        )
        // console.log('📊 Updated progress to 80%:', updated)
        return updated
      })

      // Step 5: Handle Response
      // console.log('5️⃣ Processing response...')
      if (!response.ok) {
        // console.log('❌ Response not OK, getting error details...')
        let errorMessage = '업로드 실패'
        try {
          const errorData = await response.json()
          // console.log('❌ Error response data:', errorData)
          errorMessage = errorData.error || errorData.message || '업로드 실패'
        } catch (parseError) {
          // console.log('❌ Could not parse error response:', parseError)
        }
        
        if (response.status === 401) {
          errorMessage = '인증이 필요합니다. 다시 로그인해 주세요.'
        }
        
        throw new Error(errorMessage)
      }

      // console.log('📋 Parsing successful response...')
      const result = await response.json()
      // console.log('📋 Parsed response result:', result)
      
      if (result.success) {
        // console.log('6️⃣ Creating new document object...')
        // Add the new document to the list
        const newDocument: Document = {
          id: result.data.id,
          name: result.data.name,
          type: result.data.type,
          size: result.data.size,
          category: result.data.category,
          uploadedAt: result.data.uploadedAt,
          uploadedBy: result.data.uploadedBy,
          status: 'completed',
          documentType: result.data.documentType,
          isRequired: result.data.isRequired || false
        }
        // console.log('📋 New document object:', newDocument)

        // console.log('7️⃣ Adding document to documents list...')
        setDocuments(prev => {
          // console.log('📊 Previous documents count:', prev.length)
          const newDocs = [newDocument, ...prev]
          // console.log('📊 New documents count:', newDocs.length)
          return newDocs
        })
        
        // Update submission status if this is a required document
        if (documentType && requiredDocuments.find(doc => doc.id === documentType)) {
          try {
            await fetch('/api/user-document-submissions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requirement_id: documentType,
                document_id: result.data.id
              })
            })
            // Reload submission status
            loadSubmissionStatus()
          } catch (error) {
            console.error('Error updating submission status:', error)
          }
        }

        // console.log('8️⃣ Finalizing progress...')
        setUploadProgress(prev => {
          const updated = prev.map(item => 
            item.fileName === file.name 
              ? { ...item, progress: 100, status: 'completed' }
              : item
          )
          // console.log('📊 Final progress update:', updated)
          return updated
        })

        // Remove completed upload after 3 seconds
        setTimeout(() => {
          // console.log('🧹 Removing completed upload from progress')
          setUploadProgress(prev => prev.filter(item => item.fileName !== file.name))
        }, 3000)

        // console.log('✅ Upload completed successfully!')

      } else {
        // console.log('❌ API returned success=false:', result)
        throw new Error(result.error || '업로드 처리 실패')
      }

    } catch (error) {
      console.error('❌ File upload error in try/catch:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error constructor:', error?.constructor?.name)
      
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message)
        console.error('❌ Error stack:', error.stack)
      }
      
      setUploadProgress(prev => {
        const updated = prev.map(item => 
          item.fileName === file.name 
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : '업로드 실패' }
            : item
        )
        // console.log('📊 Error progress update:', updated)
        return updated
      })
      
      // Re-throw the error so the calling function can handle it
      throw error
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    // console.log('🔥🔄 handleFileSelect called')
    // console.log('📄 Files parameter:', files)
    // console.log('📄 Files length:', files?.length || 0)
    // console.log('📋 FileInput ref current:', fileInputRef.current)
    
    if (!files || files.length === 0) {
      // console.log('❌ No files selected or files is null/empty')
      // Reset any pending upload states
      const documentType = fileInputRef.current?.getAttribute('data-document-type')
      // console.log('📋 Document type from input:', documentType)
      if (documentType) {
        // console.log('🧹 Cleaning up upload state for:', documentType)
        setUploadingDocuments(prev => {
          const newSet = new Set(prev)
          newSet.delete(documentType)
          // console.log('📊 After cleanup, uploading documents:', Array.from(newSet))
          return newSet
        })
        fileInputRef.current?.removeAttribute('data-document-type')
        // console.log('🧹 Removed data-document-type attribute')
      }
      return
    }
    
    const documentType = fileInputRef.current?.getAttribute('data-document-type')
    // console.log('📋 Processing file selection for document type:', documentType)
    // console.log('📄 Files to process:', Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })))
    
    if (documentType) {
      // 개별 문서 업로드
      // console.log('🚀 Starting upload for document type:', documentType)
      // console.log('📊 Current uploadingDocuments before add:', Array.from(uploadingDocuments))
      
      setUploadingDocuments(prev => {
        const newSet = new Set(prev)
        newSet.add(documentType)
        // console.log('📊 After adding, uploading documents:', Array.from(newSet))
        return newSet
      })
      
      try {
        for (const file of Array.from(files)) {
          // console.log('📄 About to upload file for required document:', {
          //   fileName: file.name,
          //   fileSize: file.size,
          //   fileType: file.type,
          //   documentType: documentType,
          //   selectedCategory: selectedCategory
          // })
          
          await uploadFile(file, selectedCategory === 'all' ? 'misc' : selectedCategory, documentType)
          // console.log('✅ Successfully uploaded file:', file.name)
        }
        // console.log('✅ All files uploaded successfully for document type:', documentType)
      } catch (error) {
        console.error('❌ Required document upload error:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        alert('업로드 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
      } finally {
        // console.log('🧹 Finally block: Cleaning up upload state for:', documentType)
        setUploadingDocuments(prev => {
          const newSet = new Set(prev)
          newSet.delete(documentType)
          // console.log('📊 After final cleanup, uploading documents:', Array.from(newSet))
          return newSet
        })
        
        if (fileInputRef.current) {
          fileInputRef.current.removeAttribute('data-document-type')
          // console.log('🧹 Removed data-document-type attribute in finally block')
        }
      }
    } else {
      // 일반 파일 업로드
      // console.log('🚀 Starting general file upload (no document type)')
      setUploading(true)
      try {
        for (const file of Array.from(files)) {
          // console.log('📄 Uploading general file:', file.name)
          await uploadFile(file, selectedCategory === 'all' ? 'misc' : selectedCategory, undefined)
        }
        // console.log('✅ All general files uploaded successfully')
      } catch (error) {
        console.error('❌ General upload error:', error)
        alert('업로드 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'))
      } finally {
        // console.log('🧹 Cleaning up general upload state')
        setUploading(false)
      }
    }
  }


  const deleteDocument = async (documentId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    const doc = documents.find(d => d.id === documentId)
    if (!doc) return

    setDocuments(prev => prev.filter(d => d.id !== documentId))
  }


  const handleShareDocument = (document: Document) => {
    setDocumentToShare(document)
    setShareDialogOpen(true)
  }

  const generateShareUrl = (document: Document) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    return `${baseUrl}/dashboard/documents/shared/${document.id}?token=${generateShareToken(document.id)}`
  }

  const generateShareToken = (documentId: string) => {
    // Generate a simple share token (in production, this should be more secure)
    return btoa(`${documentId}-${Date.now()}`).substring(0, 16)
  }

  const handleViewDocument = (document: Document) => {
    if (!document) {
      console.error('Document not found')
      alert('문서를 찾을 수 없습니다.')
      return
    }
    
    if (document.type === 'markup-document') {
      // Open markup document in markup editor
      router.push(`/dashboard/markup?open=${document.id}`)
    } else if (document.url) {
      // For other documents, open in new tab
      window.open(document.url, '_blank')
    } else {
      console.error('Document URL not found')
      alert('문서 URL을 찾을 수 없습니다.')
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    try {
      if (document.type === 'markup-document') {
        // For markup documents, we could export as PDF or image
        alert('마킹 도면 다운로드 기능은 준비 중입니다.')
        return
      }

      if (document.url) {
        // Create a temporary link and click it to download
        const link = window.document.createElement('a')
        link.href = document.url
        link.download = document.name
        link.style.display = 'none'
        window.document.body.appendChild(link)
        link.click()
        window.document.body.removeChild(link)
      } else {
        // For mock documents without actual URLs
        alert('다운로드할 수 있는 파일이 없습니다.')
      }
    } catch (error) {
      console.error('Download failed:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-sm text-gray-500 dark:text-gray-400">문서를 불러오는 중...</p>
      </div>
    )
  }

  // 필수 서류 업로드 상태 계산
  const uploadedRequiredDocs = requiredDocuments.filter(reqDoc => 
    documents.some(doc => doc.documentType === reqDoc.id && doc.status === 'completed')
  ).length
  const totalRequiredDocs = requiredDocuments.filter(doc => doc.isRequired).length

  // 선택된 문서 공유 함수
  const handleShare = (method: 'sms' | 'email' | 'kakao' | 'link') => {
    if (selectedDocuments.length === 0) {
      alert('공유할 문서를 선택해주세요.')
      return
    }

    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id))
    const shareText = `선택한 문서 ${selectedDocs.length}개:\n${selectedDocs.map(doc => doc.name).join('\n')}`

    switch (method) {
      case 'sms':
        window.location.href = `sms:?body=${encodeURIComponent(shareText)}`
        break
      case 'email':
        window.location.href = `mailto:?subject=문서 공유&body=${encodeURIComponent(shareText)}`
        break
      case 'kakao':
        // 카카오톡 공유 API 연동 필요
        alert('카카오톡 공유 기능은 준비 중입니다.')
        break
      case 'link':
        // 공유 링크 생성 로직
        navigator.clipboard.writeText(shareText)
        alert('링크가 클립보드에 복사되었습니다.')
        break
    }
    setShowShareModal(false)
    setIsSelectionMode(false)
    setSelectedDocuments([])
  }

  // 문서 선택 토글
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  // 선택된 문서들 삭제
  const handleDeleteSelected = async () => {
    if (selectedDocuments.length === 0) return
    
    const confirmMessage = `선택한 ${selectedDocuments.length}개의 문서를 삭제하시겠습니까?`
    if (!confirm(confirmMessage)) return
    
    try {
      // Delete selected documents
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)))
      setSelectedDocuments([])
      setIsSelectionMode(false)
    } catch (error) {
      console.error('Error deleting documents:', error)
      alert('문서 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact Document Management Header - Hide if showing only required docs */}
      {!showOnlyRequiredDocs && (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-medium text-gray-700 dark:text-gray-300">내문서함</h2>
            {isSelectionMode && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {selectedDocuments.length}개 선택됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {isSelectionMode ? (
              <>
                <button
                  onClick={() => {
                    setIsSelectionMode(false)
                    setSelectedDocuments([])
                  }}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  disabled={selectedDocuments.length === 0}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors"
                >
                  <Share2 className="h-3 w-3" />
                  공유
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md"
                >
                  <CheckCircle className="h-3 w-3" />
                  선택
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors touch-manipulation"
                >
                  <Upload className="h-3 w-3" />
                  업로드
                </button>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="리스트 보기"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    title="그리드 보기"
                  >
                    <Grid className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search and Filters - Compact Design */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1.5 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="파일명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <div className="relative">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-')
                  setSortBy(newSortBy as 'date' | 'name')
                  setSortOrder(newSortOrder as 'asc' | 'desc')
                }}
                className="appearance-none pl-2.5 pr-6 py-1.5 text-xs font-medium border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-colors min-w-[90px]"
              >
                <option value="date-desc">최신순</option>
                <option value="date-asc">오래된순</option>
                <option value="name-asc">이름순 (가-하)</option>
                <option value="name-desc">이름순 (하-가)</option>
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 필수 서류 체크리스트 - Show based on props */}
      {!hideRequiredDocs && (
      <div className="bg-gradient-to-r from-gray-50 to-gray-50 dark:from-gray-900/20 dark:to-gray-900/20 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {showOnlyRequiredDocs ? '필수 서류 업로드' : '필수 제출 서류'} ({uploadedRequiredDocs}/{totalRequiredDocs}개 완료)
            </h3>
            {showOnlyRequiredDocs && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {uploadedRequiredDocs === totalRequiredDocs 
                  ? '🎉 모든 필수 서류 업로드가 완료되었습니다!' 
                  : '안전한 현장 근무를 위해 다음 서류들을 모두 업로드해주세요.'
                }
              </p>
            )}
            {/* Progress Bar */}
            <div className="mt-2 flex items-center gap-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${(uploadedRequiredDocs / totalRequiredDocs) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {Math.round((uploadedRequiredDocs / totalRequiredDocs) * 100)}%
              </span>
            </div>
          </div>
          {!showOnlyRequiredDocs && (
            <button
              onClick={() => setIsRequiredDocsExpanded(!isRequiredDocsExpanded)}
              className="ml-3 p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              title={isRequiredDocsExpanded ? "접기" : "펼치기"}
            >
              {isRequiredDocsExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
        

        {/* 필수 서류 목록 - 펼쳐진 경우에만 표시 (필수 서류 탭에서는 항상 표시) */}
        {(isRequiredDocsExpanded || showOnlyRequiredDocs) && (
          <div className="grid gap-3">
            {requiredDocuments.map((reqDoc) => {
              const uploadedDoc = documents.find(doc => doc.documentType === reqDoc.id)
              const isUploaded = uploadedDoc?.status === 'completed'
              const isProcessing = uploadedDoc?.status === 'processing'
              const needsReview = uploadedDoc?.status === 'review'
              
              return (
                <div key={reqDoc.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        {isUploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : isProcessing ? (
                          <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
                        ) : needsReview ? (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {reqDoc.name}
                          {!reqDoc.isRequired && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(선택)</span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{reqDoc.description}</p>
                        {isUploaded && uploadedDoc && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-green-700 dark:text-green-300 truncate">
                                    {uploadedDoc.name}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <span className="text-xs text-green-600 dark:text-green-400 whitespace-nowrap">
                                  {formatFileSize(uploadedDoc.size)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {isUploaded ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDocument(uploadedDoc)
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="미리보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadDocument(uploadedDoc)
                            }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleShareDocument(uploadedDoc)
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="공유하기"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteDocument(uploadedDoc.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            // console.log('🖱️ Upload button clicked for document:', reqDoc.id)
                            // console.log('📋 Button element:', event?.target)
                            
                            if (!fileInputRef.current) {
                              console.error('❌ File input ref is not available')
                              // console.log('🔍 fileInputRef:', fileInputRef)
                              alert('파일 입력 요소에 접근할 수 없습니다. 페이지를 새로고침해주세요.')
                              return
                            }
                            
                            // console.log('✅ File input ref found:', fileInputRef.current)
                            // console.log('🔍 File input properties:', {
                            //   type: fileInputRef.current.type,
                            //   accept: fileInputRef.current.accept,
                            //   multiple: fileInputRef.current.multiple,
                            //   value: fileInputRef.current.value,
                            //   disabled: fileInputRef.current.disabled
                            // })
                            
                            if (uploadingDocuments.has(reqDoc.id)) {
                              // console.log('⏳ Already uploading for document:', reqDoc.id)
                              return // Prevent multiple uploads for this specific document
                            }
                            
                            // console.log('📤 Starting upload process for document:', reqDoc.id)
                            // console.log('📊 Current uploadingDocuments:', Array.from(uploadingDocuments))
                            
                            // Set the document type before triggering file selection
                            fileInputRef.current.setAttribute('data-document-type', reqDoc.id)
                            // console.log('🏷️ Set data-document-type to:', reqDoc.id)
                            // console.log('🔍 Verify attribute was set:', fileInputRef.current.getAttribute('data-document-type'))
                            
                            // Reset the file input to ensure change event fires
                            const oldValue = fileInputRef.current.value
                            fileInputRef.current.value = ''
                            // console.log('🔄 Reset file input value from', oldValue, 'to', fileInputRef.current.value)
                            
                            // Trigger file selection
                            try {
                              // console.log('🎯 About to click file input...')
                              fileInputRef.current.click()
                              // console.log('✅ File input clicked successfully')
                              
                              // Add a small delay to check if the dialog opened
                              setTimeout(() => {
                                // console.log('⏰ 500ms after click - checking if dialog opened')
                                // console.log('🔍 File input value after click:', fileInputRef.current?.value)
                              }, 500)
                            } catch (error) {
                              console.error('❌ Error clicking file input:', error)
                              alert('파일 선택을 시작할 수 없습니다.')
                            }
                          }}
                          disabled={uploadingDocuments.has(reqDoc.id)}
                          className={`px-3 py-1.5 text-white text-xs font-medium rounded-md transition-colors touch-manipulation ${
                            uploadingDocuments.has(reqDoc.id) 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                          }`}
                        >
                          {uploadingDocuments.has(reqDoc.id) ? '업로드 중...' : '업로드하기'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          )}
      </div>
      )}

      {/* Main Content - Always show unless both required and personal docs are hidden */}
      {(!showOnlyRequiredDocs || displayDocuments.length > 0) && (
      <div>
        <div>
          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">업로드 진행상황</h4>
              <div className="space-y-2">
                {uploadProgress.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.fileName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.status === 'completed' ? '완료' : 
                           item.status === 'error' ? '실패' : 
                           `${item.progress}%`}
                        </span>
                      </div>
                      {item.status === 'uploading' && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                      {item.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.error}</p>
                      )}
                    </div>
                    {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {item.status === 'error' && <X className="h-4 w-4 text-red-500" />}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Documents Grid/List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {showOnlyRequiredDocs ? '제출된 필수 서류가 없습니다' : '문서가 없습니다'}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {showOnlyRequiredDocs 
                    ? '필수 서류를 업로드해주세요.' 
                    : searchTerm 
                      ? '검색 조간에 맞는 문서가 없습니다.' 
                      : '새로운 문서를 업로드해보세요.'
                  }
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                {filteredAndSortedDocuments.map((document: any) => {
                  const getFileTypeDisplay = (type: string) => {
                    if (type === 'markup-document') return '도면'
                    if (type.includes('pdf')) return 'PDF'
                    if (type.includes('word')) return 'DOC'
                    if (type.includes('excel')) return 'XLS'
                    if (type.startsWith('image/')) return 'IMG'
                    return 'FILE'
                  }
                  
                  const getFileTypeColor = (type: string) => {
                    if (type === 'markup-document') return 'bg-purple-100 text-purple-700 border-purple-200'
                    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200'
                    if (type.includes('word')) return 'bg-blue-100 text-blue-700 border-blue-200'
                    if (type.includes('excel')) return 'bg-green-100 text-green-700 border-green-200'
                    if (type.startsWith('image/')) return 'bg-orange-100 text-orange-700 border-orange-200'
                    return 'bg-gray-100 text-gray-700 border-gray-200'
                  }

                  return (
                    <div
                      key={document.id}
                      className={`relative border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      {/* Selection Checkbox */}
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(document.id)}
                            onChange={() => toggleDocumentSelection(document.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center text-center">
                        {/* File Type Badge */}
                        <div className="mb-3">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-md ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                          {document.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatFileSize(document.size)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                          {formatDate(document.uploadedAt)}
                        </p>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="보기"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="다운로드"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleShareDocument(document)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                            title="공유하기"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteDocument(document.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAndSortedDocuments.map((document: any) => {
                  const FileIcon = getFileIcon(document.type)
                  const getFileTypeDisplay = (type: string) => {
                    if (type === 'markup-document') return '도면'
                    if (type.includes('pdf')) return 'PDF'
                    if (type.includes('word')) return 'DOC'
                    if (type.includes('excel')) return 'XLS'
                    if (type.startsWith('image/')) return 'IMG'
                    return 'FILE'
                  }
                  
                  const getFileTypeColor = (type: string) => {
                    if (type === 'markup-document') return 'bg-purple-100 text-purple-700 border-purple-200'
                    if (type.includes('pdf')) return 'bg-red-100 text-red-700 border-red-200'
                    if (type.includes('word')) return 'bg-blue-100 text-blue-700 border-blue-200'
                    if (type.includes('excel')) return 'bg-green-100 text-green-700 border-green-200'
                    if (type.startsWith('image/')) return 'bg-orange-100 text-orange-700 border-orange-200'
                    return 'bg-gray-100 text-gray-700 border-gray-200'
                  }

                  return (
                    <div
                      key={document.id}
                      className={`bg-white dark:bg-gray-800 border rounded p-2 hover:shadow-sm transition-all duration-200 cursor-pointer ${
                        isSelectionMode && selectedDocuments.includes(document.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => isSelectionMode && toggleDocumentSelection(document.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(document.id)}
                              onChange={() => toggleDocumentSelection(document.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        
                        {/* Badge Only */}
                        <div className="flex-shrink-0">
                          <span className={`inline-block px-1 py-0.5 text-xs font-medium rounded ${getFileTypeColor(document.type)}`}>
                            {getFileTypeDisplay(document.type)}
                          </span>
                        </div>
                        
                        {/* File Info - Enhanced Layout with Site Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                                {document.name}
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                                <span>
                                  {new Date(document.uploadedAt).toLocaleDateString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {document.site && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate max-w-20 text-xs" title={document.siteAddress}>
                                      {document.site}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                                {document.uploadedBy}
                              </div>
                            </div>
                            
                            {/* Action Buttons - Compact */}
                            <div className="flex items-center gap-0.5 ml-2">
                              <button
                                onClick={() => handleViewDocument(document)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="보기"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocument(document)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                title="다운로드"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleShareDocument(document)}
                                className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                                title="공유하기"
                              >
                                <Share2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteDocument(document.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title="삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={(e) => {
          // console.log('🔥 File input onChange event triggered')
          // console.log('📄 Selected files count:', e.target.files?.length || 0)
          // console.log('📋 Current data-document-type:', e.target.getAttribute('data-document-type'))
          // console.log('🎯 File input element:', e.target)
          
          if (e.target.files?.length) {
            // console.log('📄 Files details:')
            for (let i = 0; i < e.target.files.length; i++) {
              const file = e.target.files[i]
              // console.log(`  📄 File ${i + 1}: ${file.name} (${file.size} bytes, ${file.type})`)
            }
          } else {
            // console.log('❌ No files selected or files is null/undefined')
          }
          
          // Add timeout to ensure state updates properly
          setTimeout(() => {
            // console.log('⏰ Timeout: Calling handleFileSelect')
            handleFileSelect(e.target.files)
          }, 100)
        }}
        className="hidden"
        style={{ display: 'none' }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    문서 공유하기
                  </h3>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  선택한 {selectedDocuments.length}개의 문서를 공유합니다
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleShare('sms')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">문자</span>
                  </button>

                  <button
                    onClick={() => handleShare('email')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Mail className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">이메일</span>
                  </button>

                  <button
                    onClick={() => handleShare('kakao')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <MessageSquare className="h-6 w-6 mb-2 text-yellow-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">카카오톡</span>
                  </button>

                  <button
                    onClick={() => handleShare('link')}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Link2 className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-200">링크 복사</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Document Share Dialog */}
      {shareDialogOpen && documentToShare && (
        <ShareDialog
          isOpen={shareDialogOpen}
          onClose={() => {
            setShareDialogOpen(false)
            setDocumentToShare(null)
          }}
          document={documentToShare}
          shareUrl={generateShareUrl(documentToShare)}
        />
      )}
    </div>
  )
}