import React from 'react'
import { Home, Calculator, ClipboardList, Map as MapIcon, Folder } from 'lucide-react'

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-[var(--bg-surface)] border-t border-[var(--border)] pt-3 pb-[env(safe-area-inset-bottom)] transition-colors duration-300 shadow-[var(--shadow-soft)]">
      <div className="flex justify-around items-center h-[60px] max-w-[600px] mx-auto px-2">
        <NavItem icon={<Home size={24} />} label="홈" />
        <NavItem icon={<Calculator size={24} />} label="출력현황" />
        <NavItem icon={<ClipboardList size={24} />} label="작업일지" />
        <NavItem icon={<MapIcon size={24} />} label="현장정보" />
        <NavItem icon={<Folder size={24} />} label="문서함" />
      </div>
    </nav>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active }) => {
  return (
    <a
      href="#"
      className={`group flex flex-col items-center justify-center gap-1 flex-1 h-full mx-1 rounded-2xl transition-all duration-200 
        hover:-translate-y-1
        ${active ? 'text-[var(--header-navy)] font-bold' : 'text-[var(--text-placeholder)] font-medium'}`}
    >
      <div
        className={`transition-colors duration-200 group-hover:text-[var(--header-navy)] ${active ? 'scale-105' : ''}`}
      >
        {icon}
      </div>
      <span className="text-[11px] tracking-tight group-hover:text-[var(--header-navy)] transition-colors duration-200">
        {label}
      </span>
    </a>
  )
}
