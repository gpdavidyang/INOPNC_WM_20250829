'use client'

import { Sun, SunMedium } from 'lucide-react'
import { useSunlightMode } from '@/contexts/SunlightModeContext'

export function SunlightToggle() {
  const { isSunlightMode, toggleSunlightMode, isAutoDetection } = useSunlightMode()

  return (
    <button
      onClick={toggleSunlightMode}
      className={`
        relative inline-flex items-center justify-center rounded-md p-2
        transition-colors duration-200
        ${isSunlightMode 
          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        dark:${isSunlightMode 
          ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' 
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }
        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        min-h-[44px] min-w-[44px]
      `}
      aria-label={isSunlightMode ? '햇빛 모드 끄기' : '햇빛 모드 켜기'}
      aria-pressed={isSunlightMode}
      title={
        isAutoDetection 
          ? `햇빛 모드 ${isSunlightMode ? '켜짐' : '꺼짐'} (자동)`
          : `햇빛 모드 ${isSunlightMode ? '켜짐' : '꺼짐'} (수동)`
      }
    >
      {isSunlightMode ? (
        <SunMedium className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Sun className="h-5 w-5" aria-hidden="true" />
      )}
      
      {/* Auto detection indicator */}
      {isAutoDetection && (
        <span 
          className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"
          aria-hidden="true"
          title="자동 감지 활성화"
        />
      )}
    </button>
  )
}