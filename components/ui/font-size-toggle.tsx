'use client'

import { useFontSize } from '@/contexts/FontSizeContext'

export function FontSizeToggle() {
  const { isLargeFont, toggleFontSize } = useFontSize()

  return (
    <button
      onClick={toggleFontSize}
      className={`
        relative inline-flex items-center justify-center rounded-lg p-2 min-w-[40px] min-h-[40px]
        text-toss-gray-500 dark:text-toss-gray-400 
        hover:text-toss-gray-700 dark:hover:text-toss-gray-300
        hover:bg-toss-gray-100 dark:hover:bg-toss-gray-700
        focus-visible:ring-2 focus-visible:ring-toss-blue-500 focus-visible:ring-offset-1
        transition-colors font-semibold touch-manipulation
        ${isLargeFont ? 'bg-toss-blue-50 dark:bg-toss-blue-900/20 text-toss-blue-600 dark:text-toss-blue-400' : ''}
      `}
      title={isLargeFont ? '일반 글꼴로 변경 (현재: 큰 글꼴)' : '큰 글꼴로 변경 (현재: 일반 글꼴)'}
      aria-label={isLargeFont ? '일반 글꼴로 변경' : '큰 글꼴로 변경'}
    >
      <span
        className={`transition-all duration-200 ${isLargeFont ? 'text-sm scale-110' : 'text-xs'}`}
        aria-hidden="true"
      >
        Aa
      </span>
      {isLargeFont && (
        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 bg-toss-blue-500 rounded-full"></span>
      )}
    </button>
  )
}
