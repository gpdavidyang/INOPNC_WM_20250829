'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, Upload, Download, Search, Eye, Trash2, MoreVertical,
  Clock, ChevronDown, Grid3x3, List, Check, X, File, FileImage,
  FileSpreadsheet, FileArchive, AlertCircle, CheckCircle2, 
  PlusCircle, User, Award, Shield, Briefcase, Calendar, Filter,
  CalendarDays, SortAsc, FileType, HardDrive, Share2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { getMyDocuments, uploadDocument, deleteDocument } from '@/app/actions/documents'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useFontSize,  getTypographyClass, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

interface MyDocumentsProps {
  profile: any
}

interface Document {
  id: string
  category: string
  name: string
  size: number
  uploadDate: string
  lastModified: string
  uploadedBy: string
  fileType: string
  url?: string
}

interface RequiredDocument {
  id: string
  title: string
  category: string
  icon: any
  description: string
  required: boolean
  uploaded: boolean
  uploadDate?: string
  fileName?: string
}


export function MyDocuments({ profile }: MyDocumentsProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState('list')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [dragOverDocId, setDragOverDocId] = useState<string | null>(null)
  const [requiredDocsExpanded, setRequiredDocsExpanded] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [fileTypeFilter, setFileTypeFilter] = useState('all')
  const [sizeFilter, setSizeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedShareDoc, setSelectedShareDoc] = useState<RequiredDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const requiredDocInputRef = useRef<HTMLInputElement>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadDocuments()
    // Set user from profile
    setUser(profile)
  }, [filterType, sortBy, profile])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getMyDocuments({
        category: filterType === 'all' ? undefined : filterType,
        userId: profile.id
      })
      
      if (result.success && result.data) {
        // Sort documents
        const sorted = [...result.data].sort((a: any, b: any) => {
          if (sortBy === 'date') {
            return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
          } else if (sortBy === 'name') {
            return a.name.localeCompare(b.name)
          } else if (sortBy === 'size') {
            return b.size - a.size
          }
          return 0
        })
        setDocuments(sorted)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleUploadFiles(files)
  }


  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true)
    
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('category', 'personal')
        formData.append('uploadedBy', user?.id || '')
        formData.append('documentType', 'personal')
        formData.append('isRequired', 'false')
        
        // Use API route directly for file upload
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const error = await response.json()
          console.error('Upload failed:', error)
          alert(`파일 업로드 실패: ${error.error || '알 수 없는 오류'}`)
        }
      }
      
      // Refresh documents list after upload
      await loadDocuments()
    } catch (error) {
      console.error('Upload error:', error)
      alert('파일 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (confirm('이 문서를 삭제하시겠습니까?')) {
      const result = await deleteDocument(documentId)
      if (result.success) {
        loadDocuments()
        setSelectedDocs(selectedDocs.filter(id => id !== documentId))
      }
    }
  }

  const handleBulkDownload = () => {
    selectedDocs.forEach(docId => {
      const doc = documents.find((d: any) => d.id === docId)
      if (doc?.url) {
        window.open(doc.url, '_blank')
      }
    })
  }

  const handleBulkDelete = async () => {
    if (confirm(`선택한 ${selectedDocs.length}개 문서를 삭제하시겠습니까?`)) {
      for (const docId of selectedDocs) {
        await deleteDocument(docId)
      }
      loadDocuments()
      setSelectedDocs([])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const FILE_TYPES: Record<string, any> = {
    pdf: { icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    doc: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    docx: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    xls: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    xlsx: { icon: FileSpreadsheet, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    jpg: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    jpeg: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    png: { icon: FileImage, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    zip: { icon: FileArchive, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    default: { icon: File, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' }
  }

  const getFileTypeConfig = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    return FILE_TYPES[ext as keyof typeof FILE_TYPES] || FILE_TYPES.default
  }

  // Required documents configuration
  const REQUIRED_DOCUMENTS: RequiredDocument[] = [
    {
      id: 'id_card',
      title: '신분증',
      category: 'identification',
      icon: User,
      description: '주민등록증, 운전면허증 등',
      required: true,
      uploaded: false
    },
    {
      id: 'certificate',
      title: '자격증명서',
      category: 'certification',
      icon: Award,
      description: '해당 업무 관련 자격증',
      required: true,
      uploaded: false
    },
    {
      id: 'insurance',
      title: '보험가입증명서',
      category: 'insurance',
      icon: Shield,
      description: '산재보험, 고용보험 등',
      required: true,
      uploaded: false
    },
    {
      id: 'contract',
      title: '계약서',
      category: 'contract',
      icon: FileText,
      description: '근로계약서, 도급계약서 등',
      required: true,
      uploaded: false
    },
    {
      id: 'safety_training',
      title: '안전교육이수증',
      category: 'safety',
      icon: Briefcase,
      description: '안전교육 수료 증명서',
      required: false,
      uploaded: false
    },
    {
      id: 'health_checkup',
      title: '건강검진서',
      category: 'health',
      icon: Calendar,
      description: '정기 건강검진 결과서',
      required: false,
      uploaded: false
    }
  ]

  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>(REQUIRED_DOCUMENTS)

  // Helper functions for required documents
  const getRequiredDocsProgress = () => {
    const requiredCount = requiredDocs.filter(doc => doc.required).length
    const uploadedRequiredCount = requiredDocs.filter(doc => doc.required && doc.uploaded).length
    return {
      completed: uploadedRequiredCount,
      total: requiredCount,
      percentage: requiredCount > 0 ? Math.round((uploadedRequiredCount / requiredCount) * 100) : 0
    }
  }

  const handleRequiredDocUpload = async (docId: string, files: File[]) => {
    if (files.length === 0) return
    
    const file = files[0]
    const docInfo = requiredDocs.find(d => d.id === docId)
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'required')
    formData.append('uploadedBy', user?.id || '')
    formData.append('documentType', 'required')
    formData.append('isRequired', 'true')
    formData.append('requirementId', docId)
    
    try {
      // Use API route directly for file upload
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error('Required doc upload failed:', error)
        alert(`파일 업로드 실패: ${error.error || '알 수 없는 오류'}`)
        return
      }
      
      // Update required docs state
      setRequiredDocs(prev => prev.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              uploaded: true, 
              uploadDate: new Date().toISOString(),
              fileName: file.name 
            }
          : doc
      ))
      
      // Reload documents list
      loadDocuments()
    } catch (error) {
      console.error('Required document upload failed:', error)
    }
  }

  const filteredDocuments = documents.filter((doc: any) => {
    // Text search filter
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase()))

    // File type filter
    const fileExt = doc.name.split('.').pop()?.toLowerCase() || ''
    const matchesFileType = fileTypeFilter === 'all' || 
                           (fileTypeFilter === 'documents' && ['pdf', 'doc', 'docx'].includes(fileExt)) ||
                           (fileTypeFilter === 'spreadsheets' && ['xls', 'xlsx', 'csv'].includes(fileExt)) ||
                           (fileTypeFilter === 'images' && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) ||
                           (fileTypeFilter === 'archives' && ['zip', 'rar', '7z', 'tar'].includes(fileExt))

    // Size filter
    const matchesSize = sizeFilter === 'all' ||
                       (sizeFilter === 'small' && doc.size < 1024 * 1024) || // < 1MB
                       (sizeFilter === 'medium' && doc.size >= 1024 * 1024 && doc.size < 10 * 1024 * 1024) || // 1MB-10MB
                       (sizeFilter === 'large' && doc.size >= 10 * 1024 * 1024) // > 10MB

    // Date filter
    const docDate = new Date(doc.uploadDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24))
    
    const matchesDate = dateFilter === 'all' ||
                       (dateFilter === 'today' && daysDiff === 0) ||
                       (dateFilter === 'week' && daysDiff <= 7) ||
                       (dateFilter === 'month' && daysDiff <= 30) ||
                       (dateFilter === 'year' && daysDiff <= 365)

    return matchesSearch && matchesFileType && matchesSize && matchesDate
  })

  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map((d: any) => d.id))
    }
  }

  return (
    <div className="space-y-2">
      {/* Mobile-Optimized Header with Actions */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            내문서함
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({filteredDocuments.length}개)
            </span>
          </h2>
          
          {/* Touch-Optimized Action Buttons */}
          <div className="flex items-center gap-2">
            {selectedDocs.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocs([])}
                  className="text-gray-600 h-12 px-3 min-w-[48px]"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">선택 해제</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                  className="h-12 px-3 min-w-[48px]"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">다운로드 ({selectedDocs.length})</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:bg-red-50 h-12 px-3 min-w-[48px]"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">삭제</span>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-12 px-3 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
                    업로드 중...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-1" />
                    파일 업로드
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Required Documents Section - Updated Design */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div 
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          onClick={() => setRequiredDocsExpanded(!requiredDocsExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Briefcase className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                필수 제출 서류 (아이디 인증)
              </h3>
              <p className="text-sm text-gray-500">
                {(() => {
                  const progress = getRequiredDocsProgress()
                  return `${progress.completed}/${progress.total}개 완료`
                })()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Completion percentage badge */}
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              getRequiredDocsProgress().percentage === 100
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : getRequiredDocsProgress().percentage >= 50
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"  
                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            )}>
              {getRequiredDocsProgress().percentage}%
            </span>
            
            <ChevronDown className={cn(
              "h-5 w-5 text-gray-400 transition-transform",
              requiredDocsExpanded && "rotate-180"
            )} />
          </div>
        </div>

        {requiredDocsExpanded && (
          <div className="p-4 pt-0">
            {/* 2-Column Grid Layout for Required Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {requiredDocs.map((doc) => {
                const IconComponent = doc.icon
                return (
                  <div
                    key={doc.id}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all",
                      dragOverDocId === doc.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]"
                        : doc.uploaded 
                          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10" 
                          : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 hover:border-blue-300 dark:hover:border-blue-700"
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOverDocId(doc.id)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      // Only clear if leaving the card entirely
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = e.clientX
                      const y = e.clientY
                      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
                        setDragOverDocId(null)
                      }
                    }}
                    onDrop={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragOverDocId(null)
                      
                      const files = Array.from(e.dataTransfer?.files || [])
                      if (files.length > 0) {
                        await handleRequiredDocUpload(doc.id, files)
                      }
                    }}
                  >
                    {/* Upload Status Badge */}
                    {doc.uploaded && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle2 className="h-3 w-3" />
                          업로드 완료
                        </span>
                      </div>
                    )}
                    {doc.required && !doc.uploaded && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          필수
                        </span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      {/* Icon and Title */}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2.5 rounded-lg flex-shrink-0",
                          doc.uploaded 
                            ? "bg-green-100 dark:bg-green-900/30" 
                            : "bg-gray-100 dark:bg-gray-700"
                        )}>
                          <IconComponent className={cn(
                            "h-5 w-5",
                            doc.uploaded ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
                          )} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {doc.title}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.description}
                          </p>
                          {doc.uploaded && doc.fileName && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 truncate">
                              <FileText className="inline h-3 w-3 mr-1" />
                              {doc.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Upload Zone with Drag & Drop */}
                      <div className="mt-auto">
                        {doc.uploaded ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {doc.uploadDate && format(new Date(doc.uploadDate), 'yyyy.MM.dd', { locale: ko })}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-500 hover:text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedShareDoc(doc)
                                    setShareModalOpen(true)
                                  }}
                                  title="공유"
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-500 hover:text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    // Handle re-upload or delete
                                    setRequiredDocs(prev => prev.map(d => 
                                      d.id === doc.id 
                                        ? { ...d, uploaded: false, uploadDate: undefined, fileName: undefined }
                                        : d
                                    ))
                                  }}
                                  title="삭제"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Drag & Drop Zone */}
                            <div 
                              className={cn(
                                "border-2 border-dashed rounded-lg p-3 text-center transition-all",
                                dragOverDocId === doc.id
                                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                              )}
                            >
                              <Upload className={cn(
                                "h-6 w-6 mx-auto mb-1",
                                dragOverDocId === doc.id 
                                  ? "text-blue-500 animate-bounce" 
                                  : "text-gray-400"
                              )} />
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {dragOverDocId === doc.id 
                                  ? '파일을 놓으세요' 
                                  : '파일을 드래그하거나'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png'
                                input.onchange = (e) => {
                                  const files = Array.from((e.target as HTMLInputElement).files || [])
                                  handleRequiredDocUpload(doc.id, files)
                                }
                                input.click()
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              파일 선택
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Progress Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  전체 진행 상황
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {getRequiredDocsProgress().completed} / {getRequiredDocsProgress().total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${getRequiredDocsProgress().percentage}%` }}
                />
              </div>
              {getRequiredDocsProgress().percentage === 100 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2 text-center font-medium">
                  ✨ 모든 필수 서류가 제출되었습니다!
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compact Search and Controls */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border space-y-3">
        {/* Search Input - Full Width on Mobile */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="파일명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12 text-sm bg-gray-50 dark:bg-gray-700/50"
          />
        </div>

        {/* Filter Controls Row */}
        <div className="flex items-center gap-2">
          {/* Basic Filter Dropdown */}
          <CustomSelect value={filterType} onValueChange={setFilterType}>
            <CustomSelectTrigger className={cn(
              "flex-1",
              touchMode === 'glove' && "min-h-[60px] text-base",
              touchMode === 'precision' && "min-h-[44px] text-sm",
              touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
            )}>
              <CustomSelectValue placeholder="전체 현장" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="all">전체 현장</CustomSelectItem>
              <CustomSelectItem value="personal">개인 문서</CustomSelectItem>
              <CustomSelectItem value="work">작업 문서</CustomSelectItem>
              <CustomSelectItem value="certificate">증명서</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>

          {/* Sort Dropdown */}
          <CustomSelect value={sortBy} onValueChange={setSortBy}>
            <CustomSelectTrigger className={cn(
              "flex-1",
              touchMode === 'glove' && "min-h-[60px] text-base",
              touchMode === 'precision' && "min-h-[44px] text-sm",
              touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
            )}>
              <CustomSelectValue placeholder="정렬 방식" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="date">날짜순</CustomSelectItem>
              <CustomSelectItem value="name">이름순</CustomSelectItem>
              <CustomSelectItem value="size">크기순</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={cn(
              "min-w-[48px] h-10",
              filtersExpanded && "bg-blue-50 border-blue-200 text-blue-600",
              touchMode === 'glove' && "min-h-[60px] text-base px-4",
              touchMode === 'precision' && "min-h-[44px] text-sm px-3"
            )}
          >
            <Filter className="h-4 w-4" />
            <ChevronDown className={cn(
              "h-4 w-4 ml-1 transition-transform",
              filtersExpanded && "rotate-180"
            )} />
          </Button>

          {/* Touch-Optimized View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded transition-colors min-w-[48px] h-10",
                viewMode === 'list'
                  ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded transition-colors min-w-[48px] h-10",
                viewMode === 'grid'
                  ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {filtersExpanded && (
          <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Filter className="h-4 w-4" />
              <span>고급 필터</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* File Type Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <FileType className="h-3 w-3" />
                  파일 종류
                </label>
                <CustomSelect value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                  <CustomSelectTrigger className={cn(
                    "w-full",
                    touchMode === 'glove' && "min-h-[60px] text-base",
                    touchMode === 'precision' && "min-h-[44px] text-sm",
                    touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                  )}>
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 종류</CustomSelectItem>
                    <CustomSelectItem value="documents">문서 (PDF, DOC)</CustomSelectItem>
                    <CustomSelectItem value="spreadsheets">스프레드시트 (XLS, CSV)</CustomSelectItem>
                    <CustomSelectItem value="images">이미지 (JPG, PNG)</CustomSelectItem>
                    <CustomSelectItem value="archives">압축파일 (ZIP, RAR)</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              {/* Size Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  파일 크기
                </label>
                <CustomSelect value={sizeFilter} onValueChange={setSizeFilter}>
                  <CustomSelectTrigger className={cn(
                    "w-full",
                    touchMode === 'glove' && "min-h-[60px] text-base",
                    touchMode === 'precision' && "min-h-[44px] text-sm",
                    touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                  )}>
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 크기</CustomSelectItem>
                    <CustomSelectItem value="small">소형 (1MB 미만)</CustomSelectItem>
                    <CustomSelectItem value="medium">중형 (1MB-10MB)</CustomSelectItem>
                    <CustomSelectItem value="large">대형 (10MB 이상)</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  업로드 날짜
                </label>
                <CustomSelect value={dateFilter} onValueChange={setDateFilter}>
                  <CustomSelectTrigger className={cn(
                    "w-full",
                    touchMode === 'glove' && "min-h-[60px] text-base",
                    touchMode === 'precision' && "min-h-[44px] text-sm",
                    touchMode !== 'precision' && touchMode !== 'glove' && "min-h-[40px] text-sm"
                  )}>
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체 기간</CustomSelectItem>
                    <CustomSelectItem value="today">오늘</CustomSelectItem>
                    <CustomSelectItem value="week">지난 1주일</CustomSelectItem>
                    <CustomSelectItem value="month">지난 1개월</CustomSelectItem>
                    <CustomSelectItem value="year">지난 1년</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>

            {/* Active Filter Summary */}
            {(fileTypeFilter !== 'all' || sizeFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  적용된 필터:
                </span>
                <div className="flex flex-wrap gap-1">
                  {fileTypeFilter !== 'all' && (
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                      파일종류
                      <button 
                        onClick={() => setFileTypeFilter('all')}
                        className="hover:bg-blue-200 rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {sizeFilter !== 'all' && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1">
                      크기
                      <button 
                        onClick={() => setSizeFilter('all')}
                        className="hover:bg-green-200 rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  {dateFilter !== 'all' && (
                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full flex items-center gap-1">
                      날짜
                      <button 
                        onClick={() => setDateFilter('all')}
                        className="hover:bg-purple-200 rounded-full p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setFileTypeFilter('all')
                      setSizeFilter('all') 
                      setDateFilter('all')
                    }}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    모두 지우기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document List or Upload Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          문서를 불러오는 중...
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Empty State */
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchTerm ? '검색 결과가 없습니다.' : '업로드된 문서가 없습니다.'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            상단의 "파일 업로드" 버튼을 사용해 문서를 업로드하세요.
          </p>
        </Card>
      ) : viewMode === 'list' ? (
        /* Mobile-Optimized List View */
        <div className="bg-white dark:bg-gray-800 rounded-lg border divide-y">
          {/* Compact Select All Header */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 flex items-center">
            <input
              type="checkbox"
              checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
              onChange={toggleSelectAll}
              className="mr-3 h-5 w-5 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              전체 선택
            </span>
          </div>

          {/* Enhanced Document Items */}
          {filteredDocuments.map((doc: any) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            const isRecent = new Date().getTime() - new Date(doc.uploadDate).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
            
            return (
              <div
                key={doc.id}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all min-h-[68px] border-l-4 border-transparent hover:border-blue-200"
              >
                {/* Enhanced Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(doc.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDocs([...selectedDocs, doc.id])
                    } else {
                      setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                    }
                  }}
                  className="mr-3 h-5 w-5 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />

                {/* Enhanced File Icon with Badge */}
                <div className="mr-3 relative">
                  <div className={cn("p-3 rounded-xl shadow-sm", fileConfig.bg)}>
                    <FileIcon className={cn("h-6 w-6", fileConfig.color)} />
                  </div>
                  {isRecent && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      NEW
                    </div>
                  )}
                  {doc.document_type === 'required' && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1">
                      <AlertCircle className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>

                {/* Enhanced File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {doc.name}
                    </p>
                    {doc.document_type === 'required' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full shrink-0">
                        필수
                      </span>
                    )}
                    {doc.is_public && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                        공유
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {formatFileSize(doc.size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(doc.uploadDate), 'MM월 dd일', { locale: ko })}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {doc.uploadedBy || '본인'}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                      {doc.description}
                    </p>
                  )}
                </div>

                {/* Enhanced Quick Actions */}
                <div className="flex items-center gap-1 ml-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 min-w-[40px] hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => {
                      if (doc.url) {
                        window.open(doc.url, '_blank')
                      }
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 min-w-[40px] hover:bg-green-50 hover:text-green-600 transition-colors"
                    onClick={() => {
                      if (doc.url) {
                        const a = document.createElement('a')
                        a.href = doc.url
                        a.download = doc.name
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 min-w-[40px] text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Enhanced Grid View */
        <div className="grid grid-cols-2 gap-3">
          {filteredDocuments.map((doc: any) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            const isRecent = new Date().getTime() - new Date(doc.uploadDate).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
            
            return (
              <Card
                key={doc.id}
                className={cn(
                  "p-4 hover:shadow-lg transition-all cursor-pointer touch-manipulation min-h-[140px] relative border-2",
                  selectedDocs.includes(doc.id) 
                    ? "ring-2 ring-blue-500 border-blue-200 bg-blue-50/30" 
                    : "border-gray-100 hover:border-blue-200"
                )}
                onClick={() => {
                  if (selectedDocs.includes(doc.id)) {
                    setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                  } else {
                    setSelectedDocs([...selectedDocs, doc.id])
                  }
                }}
              >
                {/* Selection Indicator */}
                {selectedDocs.includes(doc.id) && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                    <Check className="h-3 w-3" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center space-y-2">
                  {/* Enhanced File Icon with Badges */}
                  <div className="relative">
                    <div className={cn("p-3 rounded-xl shadow-sm", fileConfig.bg)}>
                      <FileIcon className={cn("h-7 w-7", fileConfig.color)} />
                    </div>
                    {isRecent && (
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full px-1 py-0.5">
                        NEW
                      </div>
                    )}
                    {doc.document_type === 'required' && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-1">
                        <AlertCircle className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>

                  {/* File Name with Badges */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-tight">
                      {doc.name}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {doc.document_type === 'required' && (
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                          필수
                        </span>
                      )}
                      {doc.is_public && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                          공유
                        </span>
                      )}
                    </div>
                  </div>

                  {/* File Details */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium">
                      {formatFileSize(doc.size)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(doc.uploadDate), 'MM/dd', { locale: ko })}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 pt-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (doc.url) {
                          window.open(doc.url, '_blank')
                        }
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (doc.url) {
                          const a = document.createElement('a')
                          a.href = doc.url
                          a.download = doc.name
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
      />

      {/* Share Modal */}
      {shareModalOpen && selectedShareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                문서 공유 설정
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShareModalOpen(false)
                  setSelectedShareDoc(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedShareDoc.title}
                </p>
                {selectedShareDoc.fileName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedShareDoc.fileName}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  공유 대상 선택
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      같은 현장 팀원들
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      현장 관리자
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      관리자
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  공유 메모 (선택)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="공유 받는 사람들에게 전달할 메시지를 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShareModalOpen(false)
                  setSelectedShareDoc(null)
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // TODO: Implement actual sharing logic
                  console.log('Sharing document:', selectedShareDoc)
                  alert(`"${selectedShareDoc.title}" 문서가 공유되었습니다.`)
                  setShareModalOpen(false)
                  setSelectedShareDoc(null)
                }}
              >
                공유하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}