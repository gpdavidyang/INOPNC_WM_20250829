'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Download, LayoutGrid, List, Trash2 } from 'lucide-react'

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
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-base font-black text-foreground tracking-tight">현장 작업 사진</h3>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-gray-50 text-[11px] font-black tracking-tighter h-6 px-3 border-none"
            >
              전체 {totalCount}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 text-[11px] font-black tracking-tighter h-6 px-3 border-none"
            >
              시공 전 {beforeCount}
            </Badge>
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700 text-[11px] font-black tracking-tighter h-6 px-3 border-none"
            >
              시공 후 {afterCount}
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
          'flex flex-wrap items-center justify-between p-2 rounded-xl transition-all duration-300',
          selectedCount > 0
            ? 'bg-[#1A254F] text-white shadow-lg shadow-black/10 scale-100 translate-y-0'
            : 'bg-gray-50 text-gray-400 scale-[0.98] translate-y-1 opacity-0 pointer-events-none hidden'
        )}
      >
        <div className="flex items-center gap-4 px-3">
          <span className="text-[11px] font-black italic tracking-widest">
            {selectedCount}개 항목 선택됨
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={onSelectAll}
            className="h-8 px-3 rounded-lg text-white hover:bg-white/10 font-medium whitespace-nowrap"
          >
            전체 선택
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearSelection}
            className="h-8 px-3 rounded-lg text-white hover:bg-white/10 font-medium whitespace-nowrap"
          >
            선택 해제
          </Button>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button
            variant="secondary"
            size="xs"
            onClick={onDownload}
            className="h-8 px-4 rounded-lg font-medium bg-white text-blue-600 hover:bg-blue-50 gap-2 whitespace-nowrap border-none shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> 다운로드
          </Button>
          <Button
            variant="destructive"
            size="xs"
            onClick={onDelete}
            disabled={loading}
            className="h-8 px-4 rounded-lg font-medium gap-2 whitespace-nowrap bg-rose-500 hover:bg-rose-600 text-white border-none shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" /> 일괄 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
