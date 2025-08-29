'use client'

import { useState } from 'react'
import { Trash2, Edit, Archive, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react'

interface BulkAction {
  id: string
  label: string
  icon: any
  variant?: 'default' | 'destructive' | 'secondary'
  onClick: (selectedIds: string[]) => void | Promise<void>
  confirmMessage?: string
}

interface BulkActionBarProps {
  selectedIds: string[]
  totalCount: number
  actions: BulkAction[]
  onClearSelection: () => void
  isLoading?: boolean
}

export default function BulkActionBar({
  selectedIds,
  totalCount,
  actions,
  onClearSelection,
  isLoading = false
}: BulkActionBarProps) {
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  if (selectedIds.length === 0) {
    return null
  }

  const handleAction = async (action: BulkAction) => {
    if (action.confirmMessage) {
      const confirmed = window.confirm(
        `${action.confirmMessage}\n\n선택된 ${selectedIds.length}개 항목에 대해 실행됩니다.`
      )
      if (!confirmed) return
    }

    setProcessingAction(action.id)
    try {
      await action.onClick(selectedIds)
    } catch (error) {
      console.error(`Bulk action ${action.id} failed:`, error)
    } finally {
      setProcessingAction(null)
    }
  }

  const getVariantClasses = (variant: BulkAction['variant'] = 'default') => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white'
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-4">
          {/* Selection info */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
            <span>{selectedIds.length}/{totalCount} 선택됨</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {actions.map((action) => {
              const Icon = action.icon
              const isProcessing = processingAction === action.id
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleAction(action)}
                  disabled={isLoading || isProcessing}
                  className={`
                    inline-flex items-center px-3 py-2 text-sm font-medium rounded-md
                    transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${getVariantClasses(action.variant)}
                  `}
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </button>
              )
            })}
          </div>

          {/* Clear selection */}
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="선택 해제"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Common bulk actions
export const commonBulkActions = {
  delete: (onDelete: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'delete',
    label: '삭제',
    icon: Trash2,
    variant: 'destructive' as const,
    onClick: onDelete,
    confirmMessage: '선택된 항목들을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
  }),
  
  archive: (onArchive: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'archive',
    label: '보관',
    icon: Archive,
    variant: 'secondary' as const,
    onClick: onArchive,
    confirmMessage: '선택된 항목들을 보관하시겠습니까?'
  }),
  
  activate: (onActivate: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'activate',
    label: '활성화',
    icon: CheckCircle,
    onClick: onActivate
  }),
  
  deactivate: (onDeactivate: (ids: string[]) => Promise<void>): BulkAction => ({
    id: 'deactivate',
    label: '비활성화',
    icon: XCircle,
    variant: 'secondary' as const,
    onClick: onDeactivate,
    confirmMessage: '선택된 항목들을 비활성화하시겠습니까?'
  })
}