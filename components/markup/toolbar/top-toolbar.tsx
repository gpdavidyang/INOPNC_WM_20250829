'use client'

import { Button } from '@/components/ui/button'
import { Home, FolderOpen, Save, Share2, X } from 'lucide-react'
import { getTypographyClass , getFullTypographyClass } from '@/contexts/FontSizeContext'

interface TopToolbarProps {
  fileName: string
  onHome: () => void
  onOpen: () => void
  onSave: () => void
  onShare: () => void
  onClose?: () => void
  isMobile: boolean
  isLargeFont?: boolean
  touchMode?: string
}

export function TopToolbar({
  fileName,
  onHome,
  onOpen,
  onSave,
  onShare,
  onClose,
  isMobile,
  isLargeFont = false,
  touchMode = 'normal'
}: TopToolbarProps) {
  if (isMobile) {
    return (
      <div className={`flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 ${
        touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1' : 'py-2'
      }`}>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onClose || onHome}
          className={`${
            touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
            touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
            'min-w-[48px] min-h-[48px]'
          } p-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <X className="h-5 w-5" />
        </Button>
        <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium truncate flex-1 text-center mx-4 text-gray-900 dark:text-gray-100`}>
          {fileName}
        </span>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onSave}
          className={`${
            touchMode === 'glove' ? 'min-w-[56px] min-h-[56px]' : 
            touchMode === 'precision' ? 'min-w-[44px] min-h-[44px]' : 
            'min-w-[48px] min-h-[48px]'
          } p-3 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <Save className="h-5 w-5" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 ${
      touchMode === 'glove' ? 'py-3' : touchMode === 'precision' ? 'py-1' : 'py-2'
    }`}>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onHome}
          className={`flex items-center gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px]' : 
            touchMode === 'precision' ? 'min-h-[44px]' : 
            'min-h-[48px]'
          } px-3 py-2 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <Home className="h-5 w-5" />
          <span className={`${getFullTypographyClass('button', 'base', isLargeFont)} font-medium`}>홈</span>
        </Button>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onOpen}
          className={`flex items-center gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px]' : 
            touchMode === 'precision' ? 'min-h-[44px]' : 
            'min-h-[48px]'
          } px-3 py-2 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <FolderOpen className="h-5 w-5" />
          <span className={`${getFullTypographyClass('button', 'base', isLargeFont)} font-medium`}>열기</span>
        </Button>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onSave}
          className={`flex items-center gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px]' : 
            touchMode === 'precision' ? 'min-h-[44px]' : 
            'min-h-[48px]'
          } px-3 py-2 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <Save className="h-5 w-5" />
          <span className={`${getFullTypographyClass('button', 'base', isLargeFont)} font-medium`}>저장</span>
        </Button>
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onShare}
          className={`flex items-center gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px]' : 
            touchMode === 'precision' ? 'min-h-[44px]' : 
            'min-h-[48px]'
          } px-3 py-2 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <Share2 className="h-5 w-5" />
          <span className={`${getFullTypographyClass('button', 'base', isLargeFont)} font-medium`}>공유</span>
        </Button>
      </div>
      
      <span className={`${getFullTypographyClass('body', 'sm', isLargeFont)} font-medium text-gray-900 dark:text-gray-100`}>{fileName}</span>
      
      {onClose && (
        <Button
          variant="ghost"
          size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          onClick={onClose}
          className={`flex items-center gap-2 ${
            touchMode === 'glove' ? 'min-h-[56px]' : 
            touchMode === 'precision' ? 'min-h-[44px]' : 
            'min-h-[48px]'
          } px-3 py-2 active:scale-95 transition-all duration-200 touch-manipulation focus-visible:ring-4 focus-visible:ring-blue-500/50`}
        >
          <X className="h-5 w-5" />
          <span className={`${getFullTypographyClass('button', 'base', isLargeFont)} font-medium`}>닫기</span>
        </Button>
      )}
    </div>
  )
}