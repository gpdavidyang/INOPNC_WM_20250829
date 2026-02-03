'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckSquare, Download, LayoutGrid, List, Trash2, XSquare } from 'lucide-react'

interface RegistryBulkActionsProps {
  viewMode: 'preview' | 'list'
  setViewMode: (v: 'preview' | 'list') => void
  totalCount: number
  selectedCount: number
  beforeCount: number
  afterCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onDelete: () => void
  onDownload: () => void
  loading: boolean
}

export function RegistryBulkActions({
  viewMode,
  setViewMode,
  totalCount,
  selectedCount,
  beforeCount,
  afterCount,
  onSelectAll,
  onClearSelection,
  onDelete,
  onDownload,
  loading,
}: RegistryBulkActionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
            작업 현장 사진대지
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white text-[10px] font-black h-6">
              전체 {totalCount}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-100 text-[10px] font-black h-6"
            >
              보수 전 {beforeCount}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black h-6"
            >
              보수 후 {afterCount}
            </Badge>
          </div>
        </div>

        <div className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
          <button
            onClick={() => setViewMode('preview')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="그리드 보기"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title="리스트 보기"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Selected Action Bar */}
      <div
        className={cn(
          'flex flex-wrap items-center justify-between p-3 rounded-2xl transition-all duration-300',
          selectedCount > 0
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-100'
            : 'bg-gray-100 text-gray-400 scale-95 opacity-50 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-4 px-3">
          <span className="text-[11px] font-black italic tracking-widest uppercase">
            {selectedCount > 0 ? `${selectedCount} Photos Selected` : 'Select photos to act'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="h-9 px-4 rounded-xl text-white hover:bg-white/10 font-bold gap-2 whitespace-nowrap"
          >
            <CheckSquare className="w-4 h-4" /> 전체 선택
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-9 px-4 rounded-xl text-white hover:bg-white/10 font-bold gap-2 whitespace-nowrap"
          >
            <XSquare className="w-4 h-4" /> 해제
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button
            variant="secondary"
            size="sm"
            onClick={onDownload}
            className="h-9 px-4 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 gap-2 whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> 다운로드
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={loading}
            className="h-9 px-4 rounded-xl font-bold gap-2 border-2 border-white/20 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" /> 일괄 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
