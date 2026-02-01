'use client'

import type { ToolType } from '@/types/markup'
import {
  Hand,
  MousePointer,
  Pencil,
  Redo2,
  Save,
  Square,
  Stamp,
  Trash2,
  Type,
  Undo2,
} from 'lucide-react'
import { IconToggle } from './ui-atoms'

interface ToolSidebarProps {
  activeTool: ToolType
  setTool: (t: ToolType) => void
  hasSelection: boolean
  deleteSelected: () => void
  undo: () => void
  canUndo: boolean
  redo: () => void
  canRedo: boolean
  onSave: () => void
  isSaving: boolean
}

export function ToolSidebar({
  activeTool,
  setTool,
  hasSelection,
  deleteSelected,
  undo,
  canUndo,
  redo,
  canRedo,
  onSave,
  isSaving,
}: ToolSidebarProps) {
  return (
    <div className="z-30 flex w-[58px] shrink-0 flex-col items-center gap-2 border-r bg-white py-4 shadow-[2px_0_8px_rgba(0,0,0,0.05)]">
      <div className="flex flex-col gap-2.5">
        <IconToggle
          active={activeTool === 'select'}
          label="선택"
          onClick={() => setTool('select')}
          className="h-10 w-10"
        >
          <MousePointer className="h-5 w-5" />
        </IconToggle>
        <IconToggle
          active={activeTool === 'pan'}
          label="이동"
          onClick={() => setTool('pan')}
          className="h-10 w-10"
        >
          <Hand className="h-5 w-5" />
        </IconToggle>
        <IconToggle
          active={activeTool.startsWith('box-')}
          label="박스"
          onClick={() => setTool('box-gray')}
          className="h-10 w-10"
        >
          <Square className="h-5 w-5" />
        </IconToggle>
        <IconToggle
          active={activeTool === 'text'}
          label="텍스트"
          onClick={() => setTool('text')}
          className="h-10 w-10"
        >
          <Type className="h-5 w-5" />
        </IconToggle>
        <IconToggle
          active={activeTool === 'pen'}
          label="펜"
          onClick={() => setTool('pen')}
          className="h-10 w-10"
        >
          <Pencil className="h-5 w-5" />
        </IconToggle>
        <IconToggle
          active={activeTool === 'stamp'}
          label="스탬프"
          onClick={() => setTool('stamp')}
          className="h-10 w-10"
        >
          <Stamp className="h-5 w-5" />
        </IconToggle>

        {hasSelection && (
          <button
            type="button"
            onClick={deleteSelected}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 active:bg-red-100 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2.5 pb-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 active:bg-gray-100 disabled:opacity-20 transition-all"
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 active:bg-gray-100 disabled:opacity-20 transition-all"
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo2 className="h-5 w-5" />
        </button>
        <div className="my-1 h-px bg-gray-100 mx-2" />
        <button
          type="button"
          className="flex h-11 w-11 flex-col items-center justify-center rounded-xl bg-blue-500 text-white shadow-md active:scale-95 disabled:opacity-50 transition-all"
          onClick={onSave}
          disabled={isSaving}
        >
          <Save className="h-5 w-5" />
          <span className="text-[9px] font-bold">저장</span>
        </button>
      </div>
    </div>
  )
}
