'use client'

import { useRoleBasedUI } from '@/hooks/use-role-based-ui'
import { Monitor, Smartphone, Settings } from 'lucide-react'

/**
 * Debug indicator showing current UI mode
 * Only visible when NEXT_PUBLIC_UI_MODE_DEBUG is true
 */
export function UIDebugIndicator() {
  const { isMobileUI, isDesktopUI, uiMode, setUiModeOverride, isEnabled, userRole } = useRoleBasedUI()
  
  // Only show in debug mode
  if (process.env.NEXT_PUBLIC_UI_MODE_DEBUG !== 'true') {
    return null
  }
  
  // Don't show if feature is disabled
  if (!isEnabled) {
    return null
  }
  
  return (
    <div className="ui-mode-debug fixed top-2 right-2 z-[9999] bg-black/80 text-white p-2 rounded-lg text-xs space-y-1">
      <div className="flex items-center gap-2">
        {isMobileUI ? (
          <Smartphone className="w-3 h-3" />
        ) : isDesktopUI ? (
          <Monitor className="w-3 h-3" />
        ) : (
          <Settings className="w-3 h-3" />
        )}
        <span className="font-semibold">
          UI Mode: {isMobileUI ? 'Mobile' : isDesktopUI ? 'Desktop' : 'Auto'}
        </span>
      </div>
      
      <div className="text-[10px] opacity-80">
        Role: {userRole || 'None'}
      </div>
      
      <div className="text-[10px] opacity-80">
        Override: {uiMode}
      </div>
      
      {/* Quick toggle buttons */}
      <div className="flex gap-1 mt-1 pt-1 border-t border-white/20">
        <button
          onClick={() => setUiModeOverride('auto')}
          className={`px-2 py-0.5 rounded text-[10px] ${
            uiMode === 'auto' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          Auto
        </button>
        <button
          onClick={() => setUiModeOverride('mobile')}
          className={`px-2 py-0.5 rounded text-[10px] ${
            uiMode === 'mobile' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          Mobile
        </button>
        <button
          onClick={() => setUiModeOverride('desktop')}
          className={`px-2 py-0.5 rounded text-[10px] ${
            uiMode === 'desktop' ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          Desktop
        </button>
      </div>
    </div>
  )
}