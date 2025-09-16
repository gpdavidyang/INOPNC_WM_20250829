'use client'

import React from 'react'

interface WorkOutputTabsProps {
  activeTab: 'work' | 'pay'
  onTabChange: (tab: 'work' | 'pay') => void
}

export default function WorkOutputTabs({ activeTab, onTabChange }: WorkOutputTabsProps) {
  return (
    <nav className="flex border-b dark:border-gray-700">
      <button
        className={`flex-1 px-4 py-3 text-center font-medium transition-all ${
          activeTab === 'work'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        onClick={() => onTabChange('work')}
      >
        출력현황
      </button>
      <button
        className={`flex-1 px-4 py-3 text-center font-medium transition-all ${
          activeTab === 'pay'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
        onClick={() => onTabChange('pay')}
      >
        급여현황
      </button>
    </nav>
  )
}
