'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  Calendar,
  Download,
  File as FileIconBase,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { openFileRecordInNewTab } from '@/lib/files/preview'

interface DocumentListItem {
  id: string
  title: string
  file_name: string
  file_size?: number
  document_type?: string
  created_at: string
  file_url?: string | null
  url?: string | null
  file_path?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  folder_path?: string | null
  original_filename?: string | null
}

interface DocumentsListProps {
  documents: DocumentListItem[]
}

const getFileIcon = (fileName: string) => {
  const ext = fileName?.split('.').pop()?.toLowerCase()

  switch (ext) {
    case 'pdf':
      return FileText
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return FileImage
    case 'xls':
    case 'xlsx':
    case 'csv':
      return FileSpreadsheet
    case 'zip':
    case 'rar':
      return FileArchive
    default:
      return FileIconBase
  }
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')

  const filteredDocuments = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase()
    return documents.filter(doc => {
      const matchesSearch =
        normalizedTerm.length === 0 ||
        (doc.title || '').toLowerCase().includes(normalizedTerm) ||
        (doc.file_name || '').toLowerCase().includes(normalizedTerm)
      const matchesType = selectedType === 'all' || doc.document_type === selectedType
      return matchesSearch && matchesType
    })
  }, [documents, searchTerm, selectedType])

  const handleOpenDocument = useCallback(async (doc: DocumentListItem) => {
    const fallbackUrl = doc.file_url || doc.file_path || doc.url
    if (!fallbackUrl) return
    try {
      await openFileRecordInNewTab({
        file_url: fallbackUrl,
        storage_bucket: doc.storage_bucket || undefined,
        storage_path: doc.storage_path || doc.folder_path || undefined,
        file_name: doc.file_name || doc.original_filename || doc.title,
        title: doc.title,
      })
    } catch (error) {
      console.error('문서를 열 수 없습니다.', error)
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia?.('(display-mode: standalone)').matches ||
          (navigator as any)?.standalone === true)
      if (isStandalone) window.location.assign(fallbackUrl)
      else window.open(fallbackUrl, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const formatFileSize = (bytes: number = 0) => {
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="문서 검색..."
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={selectedType}
          onChange={event => setSelectedType(event.target.value)}
          className="w-full px-3 py-1.5 text-sm font-medium border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        >
          <option value="all">모든 문서</option>
          <option value="personal">개인 문서</option>
          <option value="shared">공유 문서</option>
          <option value="certificate">증명서</option>
          <option value="report">보고서</option>
        </select>
      </div>

      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map(document => {
            const FileIcon = getFileIcon(document.file_name || '')

            return (
              <Card key={document.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                        {document.title || document.file_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(document.file_size)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {document.created_at
                      ? new Date(document.created_at).toLocaleDateString('ko-KR')
                      : '-'}
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {document.document_type || '미지정'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="compact"
                    className="flex-1"
                    onClick={() => handleOpenDocument(document)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    다운로드
                  </Button>
                  <Button variant="ghost" size="compact" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedType !== 'all'
              ? '검색 결과가 없습니다'
              : '아직 업로드된 문서가 없습니다'}
          </p>
        </Card>
      )}
    </div>
  )
}
