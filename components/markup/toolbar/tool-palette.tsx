'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ToolType } from '@/types/markup'
import { getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'
import {
  MousePointer,
  Square,
  Type,
  Pencil,
  Undo2,
  Redo2,
  Trash2,
  Move,
  ZoomIn,
  ZoomOut
} from 'lucide-react'

interface ToolPaletteProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  canUndo: boolean
  canRedo: boolean
  hasSelection: boolean
  isMobile: boolean
  isLargeFont?: boolean
  touchMode?: string
}

export function ToolPalette({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  isMobile,
  isLargeFont = false,
  touchMode = 'normal'
}: ToolPaletteProps) {
  // 모바일에서는 필수 도구만 표시
  const tools = isMobile ? [
    { id: 'select' as ToolType, icon: MousePointer, label: '선택', color: 'text-blue-600 dark:text-blue-400', bgColor: '' },
    { id: 'box-gray' as ToolType, icon: Square, label: '자재구간', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-500 dark:bg-gray-500' },
    { id: 'box-red' as ToolType, icon: Square, label: '작업진행', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500 dark:bg-red-500' },
    { id: 'box-blue' as ToolType, icon: Square, label: '작업완료', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500 dark:bg-blue-500' },
    { id: 'text' as ToolType, icon: Type, label: '텍스트', color: 'text-indigo-600 dark:text-indigo-400', bgColor: '' },
    { id: 'pen' as ToolType, icon: Pencil, label: '펜', color: 'text-pink-600 dark:text-pink-400', bgColor: '' },
  ] : [
    { id: 'select' as ToolType, icon: MousePointer, label: '선택', color: 'text-blue-600 dark:text-blue-400', bgColor: '' },
    { id: 'box-gray' as ToolType, icon: Square, label: '자재구간', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-500 dark:bg-gray-500' },
    { id: 'box-red' as ToolType, icon: Square, label: '작업진행', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500 dark:bg-red-500' },
    { id: 'box-blue' as ToolType, icon: Square, label: '작업완료', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500 dark:bg-blue-500' },
    { id: 'text' as ToolType, icon: Type, label: '텍스트', color: 'text-indigo-600 dark:text-indigo-400', bgColor: '' },
    { id: 'pen' as ToolType, icon: Pencil, label: '펜', color: 'text-pink-600 dark:text-pink-400', bgColor: '' },
  ]

  const actions = [
    { id: 'undo', icon: Undo2, label: '되돌리기', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: Redo2, label: '다시실행', onClick: onRedo, disabled: !canRedo },
    { id: 'delete', icon: Trash2, label: '삭제', onClick: onDelete, disabled: !hasSelection },
  ]

  const viewTools = [
    { id: 'pan' as ToolType, icon: Move, label: '이동', color: 'text-purple-600 dark:text-purple-400' },
    { id: 'zoom-in' as ToolType, icon: ZoomIn, label: '확대', color: 'text-green-600 dark:text-green-400' },
    { id: 'zoom-out' as ToolType, icon: ZoomOut, label: '축소', color: 'text-green-600 dark:text-green-400' },
  ]

  if (isMobile) {
    // 모바일 2행 레이아웃 - 더 예쁘고 선명한 디자인
    return (
      <div className="flex flex-col w-full px-2 py-2 gap-2 bg-white dark:bg-gray-800">
        {/* 첫 번째 행: 주요 도구들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tools.slice(0, 3).map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'primary' : 'ghost'}
                size="compact"
                onClick={() => {
                  console.log('Tool clicked:', tool.id, tool.label)
                  onToolChange(tool.id)
                }}
                className={cn(
                  "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                  "active:scale-95 transition-all duration-200 touch-manipulation",
                  activeTool === tool.id 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 shadow-lg shadow-blue-500/30" 
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600"
                )}
                title={tool.label}
              >
                {tool.id.startsWith('box-') && tool.bgColor ? (
                  <div className={cn("w-7 h-7 rounded", tool.bgColor, "shadow-inner")} />
                ) : (
                  <tool.icon className={cn("h-6 w-6", activeTool === tool.id ? "text-white" : tool.color)} strokeWidth={2.5} />
                )}
              </Button>
            ))}
          </div>
          
          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="compact"
              onClick={() => {
                console.log('Undo clicked')
                onUndo()
              }}
              disabled={!canUndo}
              className={cn(
                "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                "active:scale-95 transition-all duration-200 touch-manipulation",
                !canUndo 
                  ? "opacity-40 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700" 
                  : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 border-2 border-gray-300 dark:border-gray-500"
              )}
              title="되돌리기"
            >
              <Undo2 className={cn("h-6 w-6", !canUndo ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-200")} strokeWidth={2.5} />
            </Button>
            
            <Button
              variant="ghost"
              size="compact"
              onClick={() => {
                console.log('Redo clicked')
                onRedo()
              }}
              disabled={!canRedo}
              className={cn(
                "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                "active:scale-95 transition-all duration-200 touch-manipulation",
                !canRedo 
                  ? "opacity-40 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700" 
                  : "bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 border-2 border-gray-300 dark:border-gray-500"
              )}
              title="다시실행"
            >
              <Redo2 className={cn("h-6 w-6", !canRedo ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-200")} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
        
        {/* 두 번째 행: 나머지 도구들 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tools.slice(3).map(tool => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? 'primary' : 'ghost'}
                size="compact"
                onClick={() => {
                  console.log('Tool clicked:', tool.id, tool.label)
                  onToolChange(tool.id)
                }}
                className={cn(
                  "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                  "active:scale-95 transition-all duration-200 touch-manipulation",
                  activeTool === tool.id 
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 active:from-blue-700 active:to-blue-800 shadow-lg shadow-blue-500/30" 
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-200 dark:border-gray-600"
                )}
                title={tool.label}
              >
                {tool.id.startsWith('box-') && tool.bgColor ? (
                  <div className={cn("w-7 h-7 rounded", tool.bgColor, "shadow-inner")} />
                ) : (
                  <tool.icon className={cn("h-6 w-6", activeTool === tool.id ? "text-white" : tool.color)} strokeWidth={2.5} />
                )}
              </Button>
            ))}
            
            {/* 확대/축소 버튼들 */}
            {viewTools.map(tool => (
              <Button
                key={tool.id}
                variant="ghost"
                size="compact"
                onClick={() => {
                  console.log('View tool clicked (mobile):', tool.id, tool.label)
                  onToolChange(tool.id)
                }}
                className={cn(
                  "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                  "active:scale-95 transition-all duration-200 touch-manipulation",
                  tool.id === 'pan' 
                    ? "bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 border-2 border-purple-200 dark:border-purple-700"
                    : "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 border-2 border-green-200 dark:border-green-700"
                )}
                title={tool.label}
              >
                <tool.icon className={cn("h-6 w-6", tool.color || "text-green-600 dark:text-green-400")} strokeWidth={2.5} />
              </Button>
            ))}
          </div>
          
          {/* 삭제 버튼 */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="compact"
              onClick={() => {
                console.log('Delete clicked')
                onDelete()
              }}
              disabled={!hasSelection}
              className={cn(
                "min-w-[48px] min-h-[48px] p-2 rounded-xl",
                "active:scale-95 transition-all duration-200 touch-manipulation",
                !hasSelection 
                  ? "opacity-40 bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700" 
                  : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30 border-2 border-red-200 dark:border-red-700"
              )}
              title="삭제"
            >
              <Trash2 className={cn("h-6 w-6", !hasSelection ? "text-gray-400 dark:text-gray-600" : "text-red-500 dark:text-red-400")} strokeWidth={2.5} />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 데스크톱 세로 레이아웃 - 스크롤 가능하도록 수정
  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col gap-1 p-1">
        {/* 도구 그룹 */}
        {tools.map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size="compact"
            onClick={() => {
              console.log('Tool clicked (desktop):', tool.id, tool.label) // 디버깅용
              onToolChange(tool.id)
            }}
            className={cn(
              "w-full flex items-center justify-center gap-1",
              "p-1.5 min-h-[44px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              activeTool === tool.id ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            )}
            title={tool.label}
          >
            {tool.id.startsWith('box-') && tool.bgColor ? (
              <div className={cn("w-6 h-6 rounded-sm flex-shrink-0", tool.bgColor)} />
            ) : (
              <tool.icon className={cn("h-5 w-5 flex-shrink-0", tool.color, activeTool === tool.id && "text-white")} strokeWidth={2.5} />
            )}
            {(!touchMode || touchMode === 'normal') && (
              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium truncate`}>{tool.label}</span>
            )}
          </Button>
        ))}

        {/* 구분선 */}
        <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

        {/* 액션 그룹 */}
        {actions.map(action => (
          <Button
            key={action.id}
            variant="ghost"
            size="compact"
            onClick={() => {
              console.log('Action clicked (desktop):', action.id, action.label) // 디버깅용
              action.onClick()
            }}
            disabled={action.disabled}
            className={cn(
              "w-full flex items-center justify-center gap-1",
              "p-1.5 min-h-[44px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              action.disabled ? "opacity-40 bg-gray-100 dark:bg-gray-800" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            )}
            title={action.label}
          >
            <action.icon className={cn("h-5 w-5 flex-shrink-0", action.disabled ? "text-gray-400 dark:text-gray-600" : "text-gray-900 dark:text-gray-100")} strokeWidth={2.5} />
            {(!touchMode || touchMode === 'normal') && (
              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium truncate`}>{action.label}</span>
            )}
          </Button>
        ))}

        {/* 구분선 */}
        <div className="h-px bg-gray-200 dark:bg-gray-600 my-1" />

        {/* 뷰 도구 그룹 */}
        {viewTools.map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size="compact"
            onClick={() => {
              console.log('View tool clicked:', tool.id, tool.label) // 디버깅용
              onToolChange(tool.id)
            }}
            className={cn(
              "w-full flex items-center justify-center gap-1",
              "p-1.5 min-h-[44px]",
              "active:scale-95 transition-all duration-200 touch-manipulation",
              "focus-visible:ring-4 focus-visible:ring-blue-500/50",
              activeTool === tool.id ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg" : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
            )}
            title={tool.label}
          >
            <tool.icon className={cn("h-5 w-5 flex-shrink-0", tool.color || "text-gray-900 dark:text-gray-100", activeTool === tool.id && "text-white")} strokeWidth={2.5} />
            {(!touchMode || touchMode === 'normal') && (
              <span className={`${getFullTypographyClass('caption', 'xs', isLargeFont)} font-medium truncate`}>{tool.label}</span>
            )}
          </Button>
        ))}
      </div>
    </div>
  )
}