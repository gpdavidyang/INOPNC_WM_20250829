import React from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calculator, ClipboardList, Map as MapIcon, Folder } from 'lucide-react'

export const BottomNav: React.FC = () => {
  const navItems = [
    { id: 'main', label: '홈', icon: Home, path: '/main' },
    { id: 'money', label: '출력현황', icon: Calculator, path: '/money' },
    { id: 'worklog', label: '작업일지', icon: ClipboardList, path: '/worklog' },
    { id: 'site', label: '현장정보', icon: MapIcon, path: '/site' },
    { id: 'doc', label: '문서함', icon: Folder, path: '/doc' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg-surface)] border-t border-[var(--border)] pt-2 pb-[env(safe-area-inset-bottom)] transition-colors duration-300 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-[65px] max-w-[600px] mx-auto px-1">
        {navItems.map(item => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `group flex flex-col items-center justify-center gap-0.5 flex-1 h-full mx-0.5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 ${
                  isActive ? 'text-header-navy font-bold' : 'text-slate-400 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`transition-colors duration-200 group-hover:text-header-navy ${isActive ? 'scale-110' : 'scale-105'}`}
                  >
                    <Icon size={26} strokeWidth={2.5} />
                  </div>
                  <span className="text-[12px] tracking-tight group-hover:text-header-navy transition-colors duration-200 leading-none">
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
