import React from 'react'
import { ClipboardList, PaintBucket, Truck, User } from 'lucide-react'
import { TabType } from '../types'

interface BottomNavProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: 'request', label: '주문요청', icon: ClipboardList },
    { id: 'production', label: '생산정보', icon: PaintBucket },
    { id: 'shipping', label: '출고배송', icon: Truck },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[80px] bg-white border-t border-border flex justify-around items-center px-2 pb-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      {navItems.map(item => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id as TabType)}
            className={`flex flex-col items-center gap-1.5 p-2 min-w-[64px] transition-all duration-200 ${isActive ? 'text-header-navy scale-105' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <item.icon size={26} strokeWidth={isActive ? 2 : 1.5} />
            <span className={`text-[11px] ${isActive ? 'font-extrabold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
      <button className="flex flex-col items-center gap-1.5 p-2 min-w-[64px] text-gray-400 hover:text-gray-600">
        <User size={26} strokeWidth={1.5} />
        <span className="text-[11px] font-medium">내정보</span>
      </button>
    </div>
  )
}
