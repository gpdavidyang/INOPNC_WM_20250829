'use client'

import type { ReactNode } from 'react'
import { useNavigation } from './navigation-context'
import { Button } from '@/components/ui/button'

interface ConstructionNavItem {
  id: string
  label: string
  href: string
  icon?: ReactNode
}

interface ConstructionNavBarProps {
  items: ConstructionNavItem[]
  className?: string
}

export function ConstructionNavBar({ items, className }: ConstructionNavBarProps) {
  const { activeTab, setActiveTab } = useNavigation()

  return (
    <nav className={`flex items-center justify-around border-t bg-white p-3 ${className ?? ''}`.trim()}>
      {items.map((item) => (
        <Button
          key={item.id}
          variant={activeTab === item.id ? 'primary' : 'ghost'}
          size="compact"
          onClick={() => setActiveTab(item.id)}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-xs font-medium">{item.label}</span>
        </Button>
      ))}
    </nav>
  )
}
