'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  FileText, Upload, Download, Search, Filter, Eye, Trash2, MoreVertical,
  Clock, ChevronDown, Grid3x3, List, Check, X, File, FileImage,
  FileSpreadsheet, FileArchive, AlertCircle
} from 'lucide-react'
import { getMyDocuments, uploadDocument, deleteDocument } from '@/app/actions/documents'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface MyDocumentsImprovedProps {
  profile: any
}

// File type configurations
const FILE_TYPES = {
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

export function MyDocumentsImproved({ profile }: MyDocumentsImprovedProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [viewMode, setViewMode] = useState('list')
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadDocuments()
  }, [filterType, sortBy])

  const loadDocuments = async () => {
    setLoading(true)
    try {
      const result = await getMyDocuments({
        category: filterType === 'all' ? undefined : filterType,
        userId: profile.id
      })
      
      if (result.success && result.data) {
        // Sort documents
        const sorted = [...result.data].sort((a, b) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleUploadFiles(files)
  }

  const handleUploadFiles = async (files: File[]) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)
      formData.append('description', file.name)
      formData.append('document_type', 'personal')
      formData.append('folder_path', 'personal')
      formData.append('site_id', profile.site_id || '')
      formData.append('is_public', 'false')
      
      await uploadDocument(formData)
    }
    loadDocuments()
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
      const doc = documents.find(d => d.id === docId)
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

  const getFileTypeConfig = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    return FILE_TYPES[ext as keyof typeof FILE_TYPES] || FILE_TYPES.default
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedDocs.length === filteredDocuments.length) {
      setSelectedDocs([])
    } else {
      setSelectedDocs(filteredDocuments.map(d => d.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact Header with Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          내문서함
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredDocuments.length}개)
          </span>
        </h2>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedDocs.length > 0 ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocs([])}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                선택 해제
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                다운로드 ({selectedDocs.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-1" />
              파일 업로드
            </Button>
          )}
        </div>
      </div>

      {/* Search, Filter, and View Controls */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="파일명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm bg-gray-50 dark:bg-gray-700/50"
          />
        </div>

        {/* Filter Dropdown */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-9 px-3 text-sm border rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="all">전체 현장</option>
          <option value="personal">개인 문서</option>
          <option value="work">작업 문서</option>
          <option value="certificate">증명서</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 px-3 text-sm border rounded-lg bg-white dark:bg-gray-700"
        >
          <option value="date">날짜순</option>
          <option value="name">이름순</option>
          <option value="size">크기순</option>
        </select>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'list'
                ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'grid'
                ? "bg-white dark:bg-gray-600 text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document List or Upload Area */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          문서를 불러오는 중...
        </div>
      ) : filteredDocuments.length === 0 ? (
        /* Compact Upload Area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "rounded-xl border-2 border-dashed transition-all",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          )}
        >
          <div className="py-12 px-4 text-center">
            <Upload className={cn(
              "h-10 w-10 mx-auto mb-3",
              isDragging ? "text-blue-500" : "text-gray-400"
            )} />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              파일을 드래그하여 업로드하거나
            </p>
            <Button
              variant="link"
              className="text-blue-600"
              onClick={() => fileInputRef.current?.click()}
            >
              파일 선택
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              PDF, DOC, XLS, JPG, PNG 파일 지원 (최대 10MB)
            </p>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* List View - Compact Design */
        <div className="bg-white dark:bg-gray-800 rounded-lg border divide-y">
          {/* Select All Header */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center">
            <input
              type="checkbox"
              checked={selectedDocs.length === filteredDocuments.length && filteredDocuments.length > 0}
              onChange={toggleSelectAll}
              className="mr-3 h-4 w-4 rounded"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              전체 선택
            </span>
          </div>

          {/* Document Items */}
          {filteredDocuments.map((doc) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            
            return (
              <div
                key={doc.id}
                className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {/* Checkbox */}
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
                  className="mr-3 h-4 w-4 rounded"
                />

                {/* File Icon with Type-based Color */}
                <div className={cn("mr-3 p-2 rounded-lg", fileConfig.bg)}>
                  <FileIcon className={cn("h-5 w-5", fileConfig.color)} />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-500">
                      {formatFileSize(doc.size)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(doc.uploadDate), 'MM월 dd일', { locale: ko })}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
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
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredDocuments.map((doc) => {
            const fileConfig = getFileTypeConfig(doc.name)
            const FileIcon = fileConfig.icon
            
            return (
              <Card
                key={doc.id}
                className={cn(
                  "p-4 hover:shadow-md transition-all cursor-pointer",
                  selectedDocs.includes(doc.id) && "ring-2 ring-blue-500"
                )}
                onClick={() => {
                  if (selectedDocs.includes(doc.id)) {
                    setSelectedDocs(selectedDocs.filter(id => id !== doc.id))
                  } else {
                    setSelectedDocs([...selectedDocs, doc.id])
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={cn("p-3 rounded-lg mb-3", fileConfig.bg)}>
                    <FileIcon className={cn("h-8 w-8", fileConfig.color)} />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.size)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(doc.uploadDate), 'MM/dd', { locale: ko })}
                  </p>
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

      {/* Required Documents Notice */}
      {filteredDocuments.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                필수 제출 서류
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
                작업일지 첨부를 위해 0/6개 서류가 필요합니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}