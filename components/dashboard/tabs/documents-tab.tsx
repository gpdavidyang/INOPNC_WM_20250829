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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import DocumentCard from '@/components/documents/common/DocumentCard'
import DocumentFilters from '@/components/documents/common/DocumentFilters'
import ShareDialog from '@/components/documents/share-dialog'
import { getFileTypeStyle, getStatusStyle } from '@/components/documents/design-tokens'

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
  submissionStatus?: 'not_submitted' | 'submitted' | 'approved' | 'rejected'
  rejectionReason?: string
  reviewedAt?: string
  expiryDate?: string
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
  submissionStatus?: 'not_submitted' | 'submitted' | 'approved' | 'rejected'
  rejectionReason?: string
  expiryDays?: number
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
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
  
  const handleRequiredDocumentUpload = async (documentType: string) => {
    // console.log('🖱️ handleRequiredDocumentUpload called for:', documentType)
    
    if (!fileInputRef.current) {
      console.error('❌ File input ref is not available')
      alert('파일 입력 요소에 접근할 수 없습니다. 페이지를 새로고침해주세요.')
      return
    }
    
    if (uploadingDocuments.has(documentType)) {
      // console.log('⏳ Already uploading for document:', documentType)
      return // Prevent multiple uploads for this specific document
    }
    
    // Set the document type before triggering file selection
    fileInputRef.current.setAttribute('data-document-type', documentType)
    
    // Reset the file input to ensure change event fires
    fileInputRef.current.value = ''
    
    // Trigger file selection
    fileInputRef.current.click()
  }
  
  // 제출 상태별 스타일 정의
  const getStatusStyle = (status?: string) => {
    switch(status) {
      case 'approved':
        return { 
          color: 'text-green-600 dark:text-green-400', 
          bg: 'bg-green-50 dark:bg-green-900/20',
          icon: CheckCircle,
          text: '승인됨'
        }
      case 'submitted':
        return { 
          color: 'text-yellow-600 dark:text-yellow-400', 
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          icon: Clock,
          text: '검토중'
        }
      case 'rejected':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bg: 'bg-red-50 dark:bg-red-900/20',
          icon: X,
          text: '반려됨'
        }
      default:
        return { 
          color: 'text-gray-600 dark:text-gray-400', 
          bg: 'bg-gray-50 dark:bg-gray-900/20',
          icon: AlertCircle,
          text: '미제출'
        }
    }
  }

  useEffect(() => {
    loadRequiredDocuments()
    loadDocuments()
    loadSubmissionStatus()
  }, [])

  // Calculate and report required docs progress
  useEffect(() => {
    if (!Array.isArray(requiredDocuments) || !Array.isArray(documents) || !Array.isArray(submissionStatus)) {
      return
    }
    
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
  }, [documents.length, requiredDocuments.length, submissionStatus.length, onRequiredDocsUpdate])

  const loadRequiredDocuments = async () => {
    try {
      const response = await fetch('/api/required-document-types')
      const result = await response.json()
      
      if (result.required_documents && Array.isArray(result.required_documents)) {
        const transformedDocs = result.required_documents.map((req: any) => ({
          id: req.id,
          name: req.name_ko,
          description: req.description,
          category: req.code,
          isRequired: req.is_mandatory || req.isRequired || true,
          acceptedFormats: req.file_types || ['application/pdf', 'image/jpeg', 'image/png'],
          maxSize: req.max_file_size || 10485760, // bytes
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
        
        // Update required documents with submission status
        setRequiredDocuments(prev => {
          if (!Array.isArray(prev)) return []
          return prev.map(doc => {
            const submission = result.data.find((s: any) => s.requirement_id === doc.id)
            if (submission) {
              return {
                ...doc,
                submissionStatus: submission.submission_status,
              rejectionReason: submission.rejection_reason,
              submittedAt: submission.submitted_at,
              approvedAt: submission.approved_at,
              rejectedAt: submission.rejected_at
            }
          }
          return { ...doc, submissionStatus: 'not_submitted' }
        })
        })
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
      // Show validation error toast
      const toastDiv = document.createElement('div')
      toastDiv.className = 'fixed bottom-4 right-4 bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2'
      toastDiv.style.cssText = 'z-index: 9999; animation: slideInRight 0.3s ease-out;'
      toastDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <span>${validation}</span>
      `
      document.body.appendChild(toastDiv)
      
      // Remove toast after 5 seconds with fade out
      setTimeout(() => {
        toastDiv.style.animation = 'slideOutRight 0.3s ease-out'
        setTimeout(() => {
          if (document.body.contains(toastDiv)) {
            document.body.removeChild(toastDiv)
          }
        }, 300)
      }, 5000)
      return Promise.reject(new Error(validation))
    }
    // console.log('✅ File validation passed')

    try {
      // Step 3: Create FormData
      // console.log('3️⃣ Creating FormData...')
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      formData.append('uploadedBy', profile.full_name)
      
      if (documentType) {
        // console.log('📋 Adding document type to FormData:', documentType)
        const reqDoc = requiredDocuments.find(doc => doc.id === documentType)
        if (reqDoc) {
          // console.log('📋 Found required document config:', reqDoc)
          // For required documents, use 'other' as documentType
          formData.append('documentType', 'other')
          formData.append('isRequired', 'true')
          formData.append('requirementId', reqDoc.id)
        } else {
          formData.append('documentType', documentType)
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
        if (!Array.isArray(prev)) return []
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

        // console.log('✅ Upload completed successfully!')
        // Show success toast message
        const toastDiv = document.createElement('div')
        toastDiv.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2'
        toastDiv.style.cssText = 'z-index: 9999; animation: slideInRight 0.3s ease-out;'
        toastDiv.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>${file.name} 업로드 성공</span>
        `
        document.body.appendChild(toastDiv)
        
        // Remove toast after 5 seconds with fade out
        setTimeout(() => {
          toastDiv.style.animation = 'slideOutRight 0.3s ease-out'
          setTimeout(() => {
            if (document.body.contains(toastDiv)) {
              document.body.removeChild(toastDiv)
            }
          }, 300)
        }, 5000)

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
      
      // Show error toast message
      const toastDiv = document.createElement('div')
      toastDiv.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2'
      toastDiv.style.cssText = 'z-index: 9999; animation: slideInRight 0.3s ease-out;'
      toastDiv.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
        <span>${file.name} 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}</span>
      `
      document.body.appendChild(toastDiv)
      
      // Remove toast after 7 seconds with fade out
      setTimeout(() => {
        toastDiv.style.animation = 'slideOutRight 0.3s ease-out'
        setTimeout(() => {
          if (document.body.contains(toastDiv)) {
            document.body.removeChild(toastDiv)
          }
        }, 300)
      }, 7000)
      
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

  // Categories for DocumentFilters
  const categories = [
    { id: 'all', label: '전체' },
    { id: 'work-reports', label: '작업일지' },
    { id: 'safety-docs', label: '안전문서' },
    { id: 'photos', label: '사진' },
    { id: 'construction-docs', label: '시공문서' },
    { id: 'certificates', label: '자격증' },
    { id: 'other', label: '기타' }
  ]

  // Sort options for DocumentFilters
  const sortOptions = [
    { value: 'date-desc', label: '최신순' },
    { value: 'date-asc', label: '오래된순' },
    { value: 'name-asc', label: '이름순 (가-하)' },
    { value: 'name-desc', label: '이름순 (하-가)' }
  ]

  return (
    <div className="space-y-6">
      {/* Modern DocumentFilters - Hide if showing only required docs */}
      {!showOnlyRequiredDocs && (
        <Card>
          <CardContent className="p-6">
            <DocumentFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="파일명 검색..."
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={() => {}} // Category selection disabled for personal docs
              sortOptions={sortOptions}
              selectedSort={`${sortBy}-${sortOrder}`}
              onSortChange={(value) => {
                const [newSortBy, newSortOrder] = value.split('-')
                setSortBy(newSortBy as 'date' | 'name')
                setSortOrder(newSortOrder as 'asc' | 'desc')
              }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showUpload={true}
              onUploadClick={() => fileInputRef.current?.click()}
              uploadLoading={uploading}
              isSelectionMode={isSelectionMode}
              selectedCount={selectedDocuments.length}
              onToggleSelectionMode={() => {
                setIsSelectionMode(!isSelectionMode)
                if (isSelectionMode) {
                  setSelectedDocuments([])
                }
              }}
              onClearSelection={() => setSelectedDocuments([])}
              additionalActions={
                isSelectionMode && selectedDocuments.length > 0 ? (
                  <Button
                    onClick={() => setShowShareModal(true)}
                    size="sm"
                    className="h-8"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    공유
                  </Button>
                ) : null
              }
              compact={true}
            />
          </CardContent>
        </Card>
      )}

      {/* 필수 서류 체크리스트 - Show based on props */}
      {!hideRequiredDocs && (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {showOnlyRequiredDocs ? '필수 서류 업로드' : '필수 제출 서류'} ({uploadedRequiredDocs}/{totalRequiredDocs}개 완료)
              </h3>
              {showOnlyRequiredDocs && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {uploadedRequiredDocs === totalRequiredDocs 
                    ? '🎉 모든 필수 서류 업로드가 완료되었습니다!' 
                    : '안전한 현장 근무를 위해 다음 서류들을 모두 업로드해주세요.'
                  }
                </p>
              )}
              {/* Progress Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Progress 
                    value={(uploadedRequiredDocs / totalRequiredDocs) * 100} 
                    className="h-2"
                  />
                </div>
                <Badge variant="secondary" className="text-sm font-medium">
                  {Math.round((uploadedRequiredDocs / totalRequiredDocs) * 100)}%
                </Badge>
              </div>
            </div>
            {!showOnlyRequiredDocs && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRequiredDocsExpanded(!isRequiredDocsExpanded)}
                className="ml-6"
                title={isRequiredDocsExpanded ? "접기" : "펼치기"}
              >
                {isRequiredDocsExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
          
          {/* 필수 서류 목록 - 펼쳐진 경우에만 표시 (필수 서류 탭에서는 항상 표시) */}
          {(isRequiredDocsExpanded || showOnlyRequiredDocs) && (
            <div className="grid gap-4">
              {Array.isArray(requiredDocuments) && requiredDocuments.map((reqDoc) => {
                const uploadedDoc = documents.find(doc => doc.documentType === reqDoc.id)
                const isUploaded = uploadedDoc?.status === 'completed'
                const isProcessing = uploadedDoc?.status === 'processing'
                const needsReview = uploadedDoc?.status === 'review'
                const statusStyle = getStatusStyle(reqDoc.submissionStatus || 'pending')
                
                return (
                  <Card key={reqDoc.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex-shrink-0">
                            {reqDoc.submissionStatus === 'approved' ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : reqDoc.submissionStatus === 'submitted' ? (
                              <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />
                            ) : reqDoc.submissionStatus === 'rejected' ? (
                              <X className="h-6 w-6 text-red-500" />
                            ) : isUploaded ? (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            ) : isProcessing ? (
                              <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />
                            ) : needsReview ? (
                              <AlertCircle className="h-6 w-6 text-orange-500" />
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {reqDoc.name}
                                {!reqDoc.isRequired && (
                                  <Badge variant="outline" className="ml-2 text-xs">선택</Badge>
                                )}
                              </h4>
                              {reqDoc.submissionStatus && reqDoc.submissionStatus !== 'not_submitted' && (
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs"
                                  style={{
                                    backgroundColor: statusStyle.bg,
                                    color: statusStyle.text
                                  }}
                                >
                                  {reqDoc.submissionStatus === 'approved' ? '승인됨' :
                                   reqDoc.submissionStatus === 'submitted' ? '검토중' :
                                   reqDoc.submissionStatus === 'rejected' ? '반려됨' : '미제출'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{reqDoc.description}</p>
                            {reqDoc.submissionStatus === 'rejected' && reqDoc.rejectionReason && (
                              <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-700 dark:text-red-300">
                                  <span className="font-medium">반려 사유:</span> {reqDoc.rejectionReason}
                                </p>
                              </div>
                            )}
                            {isUploaded && uploadedDoc && (
                              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-green-700 dark:text-green-300 truncate">
                                        {uploadedDoc.name}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300">
                                    {formatFileSize(uploadedDoc.size)}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {reqDoc.submissionStatus === 'approved' && uploadedDoc ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDocument(uploadedDoc)
                                }}
                                title="미리보기"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadDocument(uploadedDoc)
                                }}
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : reqDoc.submissionStatus === 'submitted' && uploadedDoc ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDocument(uploadedDoc)
                                }}
                                title="미리보기"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Badge variant="secondary" className="text-yellow-600 dark:text-yellow-400">
                                검토중...
                              </Badge>
                            </div>
                          ) : reqDoc.submissionStatus === 'rejected' ? (
                            <Button
                              onClick={() => handleRequiredDocumentUpload(reqDoc.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                              size="sm"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              재제출
                            </Button>
                          ) : isUploaded && uploadedDoc ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewDocument(uploadedDoc)
                                }}
                                title="미리보기"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadDocument(uploadedDoc)
                                }}
                                title="다운로드"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleShareDocument(uploadedDoc)
                                }}
                                title="공유하기"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteDocument(uploadedDoc.id)
                                }}
                                title="삭제"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleRequiredDocumentUpload(reqDoc.id)}
                              disabled={uploadingDocuments.has(reqDoc.id)}
                              size="sm"
                            >
                              {uploadingDocuments.has(reqDoc.id) ? (
                                <Clock className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-2" />
                              )}
                              {uploadingDocuments.has(reqDoc.id) ? '업로드 중...' : '업로드하기'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Modern Document Grid/List using DocumentCard */}
      {(!showOnlyRequiredDocs || displayDocuments.length > 0) && (
        <Card>
          <CardContent className={viewMode === 'grid' ? 'p-6' : 'p-4'}>
            {filteredAndSortedDocuments.length === 0 ? (
              <div className="text-center py-16">
                <Folder className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {showOnlyRequiredDocs ? '제출된 필수 서류가 없습니다' : '문서가 없습니다'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  {showOnlyRequiredDocs 
                    ? '필수 서류를 업로드해주세요.' 
                    : searchTerm 
                      ? '검색 조건에 맞는 문서가 없습니다. 다른 검색어를 시도해보세요.' 
                      : '새로운 문서를 업로드하여 시작해보세요.'
                  }
                </p>
                {!showOnlyRequiredDocs && !searchTerm && (
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                    size="lg"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    첫 문서 업로드하기
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.isArray(filteredAndSortedDocuments) && filteredAndSortedDocuments.map((document: any) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    viewMode="grid"
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedDocuments.includes(document.id)}
                    onSelect={toggleDocumentSelection}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onDelete={deleteDocument}
                    showOwner={true}
                    showSite={true}
                    showStatus={false}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(filteredAndSortedDocuments) && filteredAndSortedDocuments.map((document: any) => (
                  <DocumentCard
                    key={document.id}
                    document={document}
                    viewMode="list"
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedDocuments.includes(document.id)}
                    onSelect={toggleDocumentSelection}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onDelete={deleteDocument}
                    showOwner={true}
                    showSite={true}
                    showStatus={false}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

      {/* Modern Share Modal using Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={() => setShowShareModal(false)}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    문서 공유하기
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowShareModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  선택한 {selectedDocuments.length}개의 문서를 공유합니다
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleShare('sms')}
                    className="flex flex-col items-center justify-center p-6 h-auto hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <MessageSquare className="h-8 w-8 mb-3 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">문자</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleShare('email')}
                    className="flex flex-col items-center justify-center p-6 h-auto hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Mail className="h-8 w-8 mb-3 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">이메일</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleShare('kakao')}
                    className="flex flex-col items-center justify-center p-6 h-auto hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <MessageSquare className="h-8 w-8 mb-3 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">카카오톡</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleShare('link')}
                    className="flex flex-col items-center justify-center p-6 h-auto hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Link2 className="h-8 w-8 mb-3 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">링크 복사</span>
                  </Button>
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