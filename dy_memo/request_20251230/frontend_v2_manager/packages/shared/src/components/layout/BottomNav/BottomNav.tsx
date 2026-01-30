import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Calculator, ClipboardList, Map as MapIcon, Folder } from 'lucide-react'

interface BottomNavProps {
  currentApp?: string
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentApp }) => {
  const navigate = useNavigate()

  const navItems = [
    {
      id: 'main',
      label: '홈',
      icon: Home,
      path: '/',
    },
    {
      id: 'money',
      label: '출력현황',
      icon: Calculator,
      path: '/money',
    },
    {
      id: 'worklog',
      label: '작업일지',
      icon: ClipboardList,
      path: '/worklog',
    },
    {
      id: 'site',
      label: '현장정보',
      icon: MapIcon,
      path: '/site',
    },
    {
      id: 'doc',
      label: '문서함',
      icon: Folder,
      path: '/doc',
    },
  ]

  // Determine current app based on pathname
  const getCurrentAppId = () => {
    if (currentApp) return currentApp

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
    if (pathname === '/') return 'main'
    if (pathname.startsWith('/money')) return 'money'
    if (pathname.startsWith('/worklog')) return 'worklog'
    if (pathname.startsWith('/site')) return 'site'
    if (pathname.startsWith('/doc')) return 'doc'
    return 'main'
  }

  const currentAppId = getCurrentAppId()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] pt-3 pb-[env(safe-area-inset-bottom)] transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex justify-around items-center h-[60px] max-w-[600px] mx-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = currentAppId === item.id

          const handleItemClick = (path: string) => {
            navigate(path)
          }

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path)}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200 bg-transparent border-none cursor-pointer font-medium ${
                isActive ? 'scale-105' : ''
              }`}
              style={{
                color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 'bold' : 'medium',
              }}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[13px] font-bold tracking-[-0.2px]">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
