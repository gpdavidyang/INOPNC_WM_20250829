import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, DollarSign, ClipboardList, MapPin, FileText } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navItems = [
    { id: 'main', label: '홈', icon: Home, path: '/main' },
    { id: 'money', label: '정산관리', icon: DollarSign, path: '/money' },
    { id: 'worklog', label: '작업일지', icon: ClipboardList, path: '/worklog' },
    { id: 'site', label: '현장정보', icon: MapPin, path: '/site' },
    { id: 'doc', label: '문서관리', icon: FileText, path: '/doc' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-surface)] border-t border-[var(--border)] pt-3 pb-[env(safe-area-inset-bottom)] transition-colors duration-300 shadow-[var(--shadow-soft)]">
      <div className="flex justify-around items-center h-[60px] max-w-[600px] mx-auto">
        {navItems.map(item => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `group flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                  isActive
                    ? 'text-header-navy font-bold scale-105'
                    : 'text-text-placeholder font-medium hover:scale-110 hover:text-header-navy'
                }`
              }
              style={{ gap: '6px' }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={26} strokeWidth={isActive ? 3 : 2.5} />
                  <span
                    className="font-bold transition-all duration-200 group-hover:text-header-navy"
                    style={{
                      fontSize: '14px',
                      fontWeight: '800',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
