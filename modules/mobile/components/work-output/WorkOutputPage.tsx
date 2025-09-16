'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Filter, Download, Printer, Moon, Sun, Type } from 'lucide-react'
import WorkOutputTabs from './WorkOutputTabs'
import OutputStatusTab from './OutputStatusTab'
import SalaryStatusTab from './SalaryStatusTab'
import './styles/work-output.css'

export default function WorkOutputPage() {
  const [activeTab, setActiveTab] = useState<'work' | 'pay'>('work')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [fontSize, setFontSize] = useState<'fs-100' | 'fs-150'>('fs-100')

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const savedFontSize = localStorage.getItem('fontSize') as 'fs-100' | 'fs-150'

    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }

    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.documentElement.className = savedFontSize
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : '')
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  const toggleFontSize = () => {
    const newSize = fontSize === 'fs-100' ? 'fs-150' : 'fs-100'
    setFontSize(newSize)
    document.documentElement.className = newSize
    localStorage.setItem('fontSize', newSize)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header with theme controls */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">작업 출력 관리</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleFontSize}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle font size"
              >
                <Type className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          {/* Tab navigation */}
          <WorkOutputTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab content */}
          <div className="p-4">
            {activeTab === 'work' ? <OutputStatusTab /> : <SalaryStatusTab />}
          </div>
        </div>
      </div>
    </div>
  )
}
