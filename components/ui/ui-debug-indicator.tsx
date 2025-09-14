'use client'


/**
 * Debug indicator showing current UI mode
 * Only visible when NEXT_PUBLIC_UI_MODE_DEBUG is true
 */
export function UIDebugIndicator() {
  const [userRole, setUserRole] = useState<string | undefined>()
  const [uiMode, setUiMode] = useState<'mobile' | 'desktop' | 'auto'>('auto')
  
  useEffect(() => {
    const role = getClientUserRole()
    setUserRole(role)
    
    if (isRoleMobileUI(role)) {
      setUiMode('mobile')
    } else if (isRoleDesktopUI(role)) {
      setUiMode('desktop')
    } else {
      setUiMode('auto')
    }
  }, [])
  
  // Only show in debug mode
  if (process.env.NEXT_PUBLIC_UI_MODE_DEBUG !== 'true') {
    return null
  }
  
  const isMobileUI = uiMode === 'mobile'
  const isDesktopUI = uiMode === 'desktop'
  
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
        Current: {uiMode}
      </div>
    </div>
  )
}