import React, { useState, useEffect } from 'react'
import { navigationService } from '../../../services/navigationService'
import type { AppInfo, NavigationState } from '../../../types'
import { ChevronDown, ExternalLink, Clock } from 'lucide-react'

interface AppSwitcherProps {
  currentApp: string
  apps: AppInfo[]
}

export const AppSwitcher: React.FC<AppSwitcherProps> = ({ currentApp, apps }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [navState, setNavState] = useState<NavigationState | null>(null)
  const [lastVisited, setLastVisited] = useState<Record<string, string>>({})

  useEffect(() => {
    // Subscribe to navigation state changes
    const unsubId = `appswitcher-${currentApp}`
    navigationService.subscribe(unsubId, state => {
      setNavState(state)

      // Extract last visited paths
      const visits: Record<string, string> = {}
      Object.entries(state.lastVisited).forEach(([appId, data]) => {
        if (appId !== currentApp && data.path !== '/') {
          visits[appId] = data.path
        }
      })
      setLastVisited(visits)
    })

    return () => {
      navigationService.unsubscribe(unsubId)
    }
  }, [currentApp])

  const handleAppClick = (app: AppInfo) => {
    const lastPath = lastVisited[app.id]
    navigationService.navigateToApp(app.id, lastPath)
    setIsOpen(false)
  }

  const currentAppInfo = apps.find(app => app.id === currentApp)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#f8fafc] dark:bg-[#334155] rounded-lg hover:bg-[#e2e8f0] dark:hover:bg-[#475569] transition-colors"
      >
        {currentAppInfo?.icon && (
          <img src={currentAppInfo.icon} alt={currentAppInfo.name} className="w-5 h-5" />
        )}
        <span className="text-sm font-medium text-[#1a254f] dark:text-white">
          {currentAppInfo?.name || currentApp}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-[#1e293b] rounded-lg shadow-lg border border-[#e2e8f0] dark:border-[#334155] z-20">
            <div className="p-2">
              {apps.map(app => {
                const isCurrent = app.id === currentApp
                const hasLastVisited = lastVisited[app.id]

                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-[#f1f5f9] dark:bg-[#334155] text-[#64748b] dark:text-[#94a3b8] cursor-not-allowed'
                        : 'hover:bg-[#f8fafc] dark:hover:bg-[#334155] text-[#1a254f] dark:text-white'
                    }`}
                  >
                    {app.icon && <img src={app.icon} alt={app.name} className="w-5 h-5" />}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{app.name}</span>
                        {isCurrent && (
                          <span className="text-xs px-2 py-0.5 bg-[#3b82f6] text-white rounded">
                            현재
                          </span>
                        )}
                      </div>
                      {hasLastVisited && !isCurrent && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock size={12} className="text-[#94a3b8]" />
                          <span className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                            마지막: {hasLastVisited}
                          </span>
                        </div>
                      )}
                    </div>
                    {!isCurrent && <ExternalLink size={14} className="text-[#64748b]" />}
                  </button>
                )
              })}
            </div>

            {navState?.transition && (
              <div className="px-3 py-2 border-t border-[#e2e8f0] dark:border-[#334155]">
                <div className="text-xs text-[#64748b] dark:text-[#94a3b8]">
                  최근 이동: {navState.transition.fromApp} → {navState.transition.toApp}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
