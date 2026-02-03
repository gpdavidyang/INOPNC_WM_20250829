'use client'

import { cn } from '@/lib/utils'

interface DetailTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: { key: string; label: string }[]
}

export const DetailTabs = ({ activeTab, onTabChange, tabs }: DetailTabsProps) => {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <nav className="flex -mb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              'px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
