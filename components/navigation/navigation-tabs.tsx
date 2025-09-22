'use client'

import { useNavigation } from './navigation-context'
import { Button } from '@/components/ui/button'

interface NavigationTab {
  id: string
  label: string
}

const DEFAULT_TABS: NavigationTab[] = [
  { id: 'home', label: '홈' },
  { id: 'daily-reports', label: '작업' },
  { id: 'attendance', label: '출퇴근' },
  { id: 'documents', label: '문서' },
]

interface NavigationTabsProps {
  className?: string
  tabs?: NavigationTab[]
}

export function NavigationTabs({ className, tabs = DEFAULT_TABS }: NavigationTabsProps) {
  const { activeTab, setActiveTab } = useNavigation()

  return (
    <div className={`flex gap-2 ${className ?? ''}`.trim()}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant={activeTab === tab.id ? 'primary' : 'ghost'}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
