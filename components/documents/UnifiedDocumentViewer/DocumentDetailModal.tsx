'use client'

import React, { useState } from 'react'
import type { UnifiedDocument } from '@/hooks/use-unified-documents'

interface DocumentDetailModalProps {
  document: UnifiedDocument
  isOpen: boolean
  onClose: () => void
  onUpdate: (document: UnifiedDocument) => void
  onDelete: () => void
  isAdmin: boolean
  profile: Profile
}

export default function DocumentDetailModal({
  document,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isAdmin,
  profile
}: DocumentDetailModalProps) {
  const [loading, setLoading] = useState(false)
  
  if (!isOpen) return null
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const getCategoryLabel = (categoryType: string) => {
    const categories = {
      shared: '공유문서',
      markup: '도면마킹',
      photo_grid: '사진대지',
      required: '필수제출',
      invoice: '기성청구'
    }
    return categories[categoryType as keyof typeof categories] || categoryType
  }
  
  const getStatusBadge = (status: string) => {
    const configs = {
      active: { label: '활성', className: 'bg-green-100 text-green-800' },
      draft: { label: '임시저장', className: 'bg-gray-100 text-gray-800' },
      pending: { label: '검토중', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: '승인됨', className: 'bg-blue-100 text-blue-800' },
      rejected: { label: '반려됨', className: 'bg-red-100 text-red-800' },
      archived: { label: '보관됨', className: 'bg-purple-100 text-purple-800' }
    }
    
    const config = configs[status as keyof typeof configs] || configs.draft
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }
  
  const handleDownload = () => {
    if (document.file_url) {
      const link = document.createElement('a')
      link.href = document.file_url
      link.download = document.file_name || document.title
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
  
  const handlePreview = () => {
    if (document.file_url) {
      window.open(document.file_url, '_blank')
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('정말로 이 문서를 삭제하시겠습니까?')) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/unified-documents/v2/${document.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        onDelete()
      } else {
        alert('문서 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('문서 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }
  
  const canEdit = isAdmin || document.uploaded_by === profile.id
  const canDelete = isAdmin || document.uploaded_by === profile.id

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {document.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(document.status)}
              <Badge variant="outline">
                {getCategoryLabel(document.category_type)}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {document.file_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(document.file_size || 0)} • {document.file_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePreview}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" />
                미리보기
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                다운로드
              </button>
            </div>
          </div>
          
          {/* Description */}
          {document.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                설명
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {document.description}
              </p>
            </div>
          )}
          
          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                태그
              </h3>
              <div className="flex flex-wrap gap-1">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <hr className="border-gray-200 dark:border-gray-700" />
          
          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">업로더:</span>
                <span className="text-gray-900 dark:text-white">
                  {document.uploader?.full_name || '알 수 없음'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">업로드:</span>
                <span className="text-gray-900 dark:text-white">
                  {formatDate(document.created_at)}
                </span>
              </div>
              
              {document.updated_at !== document.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">수정:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatDate(document.updated_at)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {document.site && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">현장:</span>
                  <span className="text-gray-900 dark:text-white">
                    {document.site.name}
                  </span>
                </div>
              )}
              
              {document.customer_company && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">회사:</span>
                  <span className="text-gray-900 dark:text-white">
                    {document.customer_company.name}
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">버전:</span>
                <span className="text-gray-900 dark:text-white">
                  v{document.version || 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {document.is_public && (
              <Badge variant="outline">
                <Share2 className="h-3 w-3 mr-1" />
                공개
              </Badge>
            )}
            {document.is_archived && (
              <Badge variant="outline">
                <Archive className="h-3 w-3 mr-1" />
                보관됨
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                편집
              </button>
            )}
            
            {canDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </button>
            )}
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}