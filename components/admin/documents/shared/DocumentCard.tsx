'use client'

import { SharedDocument, FILE_TYPE_ICONS, formatFileSize } from '@/types/shared-documents'
import { 
  Eye, Download, Edit, Share2, Trash2, MoreVertical,
  Calendar, User, Building2, Tag, CheckCircle
} from 'lucide-react'
import { useState } from 'react'

interface DocumentCardProps {
  document: SharedDocument
  isSelected: boolean
  onSelect: (selected: boolean) => void
  onView: () => void
  onEdit: () => void
  onShare: () => void
  onDownload: () => void
  onDelete: () => void
}

export default function DocumentCard({
  document,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onShare,
  onDownload,
  onDelete
}: DocumentCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const getFileIcon = () => {
    return FILE_TYPE_ICONS[document.file_type] || FILE_TYPE_ICONS.default
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
    <div className={`
      relative bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all
      ${isSelected ? 'ring-2 ring-blue-500' : ''}
    `}>
      {/* Selection Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Card Content */}
      <div 
        className="p-6 cursor-pointer"
        onClick={onView}
      >
        {/* File Icon and Title */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl flex-shrink-0">{getFileIcon()}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={document.title}>
              {document.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {document.file_name}
            </p>
          </div>
          
          {/* More Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(false)
                  }}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                    수정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onShare()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                    공유 설정
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDownload()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    다운로드
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                      setShowMenu(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {document.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {document.description}
          </p>
        )}

        {/* Category and Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {document.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor()}`}>
              {document.category}
            </span>
          )}
          {document.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
          {document.tags && document.tags.length > 2 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{document.tags.length - 2}
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-1">
          {document.site_name && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Building2 className="h-3 w-3" />
              {document.site_name}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <User className="h-3 w-3" />
            {document.uploaded_by_name || '알 수 없음'}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            {new Date(document.created_at).toLocaleDateString('ko-KR')}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatFileSize(document.file_size)}
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {document.view_count > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {document.view_count}
              </span>
            )}
            {document.download_count > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {document.download_count}
              </span>
            )}
            {document.permission_count > 0 && (
              <span className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                {document.permission_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions (Hover) */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onView()
            }}
            className="p-1.5 bg-white dark:bg-gray-700 rounded shadow hover:shadow-md transition-shadow"
            title="미리보기"
          >
            <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDownload()
            }}
            className="p-1.5 bg-white dark:bg-gray-700 rounded shadow hover:shadow-md transition-shadow"
            title="다운로드"
          >
            <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}