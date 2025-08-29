'use client'

import { useState, useEffect } from 'react'
import { SharedDocument, FILE_TYPE_ICONS, formatFileSize } from '@/types/shared-documents'
import { 
  X, Download, Share2, Eye, Calendar, User, Building2, 
  Tag, ExternalLink, FileText
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DocumentPreviewModalProps {
  document: SharedDocument
  onClose: () => void
}

export default function DocumentPreviewModal({
  document,
  onClose
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  // 조회 로그 기록
  useEffect(() => {
    const logView = async () => {
      try {
        await supabase.from('document_access_logs').insert({
          document_id: document.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          action: 'view'
        })
      } catch (error) {
        console.error('Failed to log document view:', error)
      }
    }

    logView()
  }, [document.id, supabase])

  const handleDownload = async () => {
    try {
      setLoading(true)
      
      // 다운로드 로그 기록
      await supabase.from('document_access_logs').insert({
        document_id: document.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'download'
      })

      // 파일 다운로드
      const link = window.document.createElement('a')
      link.href = document.file_url
      link.download = document.file_name
      link.click()
    } catch (error) {
      console.error('Failed to download document:', error)
    } finally {
      setLoading(false)
    }
  }

  const openInNewTab = () => {
    window.open(document.file_url, '_blank')
  }

  const getCategoryColor = () => {
    switch (document.category) {
      case '도면': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case '계약서': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case '보고서': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case '사진': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{FILE_TYPE_ICONS[document.file_type] || FILE_TYPE_ICONS.default}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {document.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {document.file_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openInNewTab}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="새 탭에서 열기"
            >
              <ExternalLink className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              title="다운로드"
            >
              <Download className="h-5 w-5 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Document Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">문서 정보</h3>
              
              {document.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">설명</p>
                  <p className="text-sm text-gray-900 dark:text-white">{document.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600 dark:text-gray-400">크기:</span>
                <span className="text-gray-900 dark:text-white">{formatFileSize(document.file_size)}</span>
              </div>

              {document.category && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">카테고리:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor()}`}>
                    {document.category}
                  </span>
                </div>
              )}

              {document.tags && document.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">태그</p>
                  <div className="flex flex-wrap gap-1">
                    {document.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">업로드 정보</h3>
              
              {document.site_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">현장:</span>
                  <span className="text-gray-900 dark:text-white">{document.site_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">등록자:</span>
                <span className="text-gray-900 dark:text-white">
                  {document.uploaded_by_name || '알 수 없음'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">등록일:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(document.created_at).toLocaleString('ko-KR')}
                </span>
              </div>

              {document.updated_at !== document.created_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">수정일:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(document.updated_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              )}

              {/* Stats */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {document.view_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">조회</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {document.download_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">다운로드</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {document.permission_count || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">권한</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Area */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                미리보기 기능 구현 예정
              </h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Phase 3에서 PDF, 이미지 등 파일별 미리보기 기능이 추가됩니다.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  다운로드
                </button>
                <button
                  onClick={openInNewTab}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  새 탭에서 열기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}