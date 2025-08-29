'use client'

import React, { useState } from 'react'
import { Share2, Edit3, FileCheck, FileText } from 'lucide-react'
import { useFontSize, getFullTypographyClass } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'

// 각 탭의 컴포넌트들을 임시로 import (기존 컴포넌트들 활용)
import SharedDocumentsManagement from './SharedDocumentsManagement'
import MarkupDocumentsManagement from './MarkupDocumentsManagement' 
import RequiredDocumentsManagement from './RequiredDocumentsManagement'
import InvoiceDocumentsManagement from './InvoiceDocumentsManagement'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<any>
  count?: number
}

const tabs: Tab[] = [
  {
    id: 'shared',
    label: '공유문서함',
    icon: Share2,
    component: SharedDocumentsManagement
  },
  {
    id: 'markup',
    label: '도면마킹문서함',
    icon: Edit3,
    component: MarkupDocumentsManagement
  },
  {
    id: 'required',
    label: '필수제출서류함',
    icon: FileCheck,
    component: RequiredDocumentsManagement
  },
  {
    id: 'invoice',
    label: '기성청구문서함',
    icon: FileText,
    component: InvoiceDocumentsManagement
  }
]

// Helper function to get typography class
function getTypographyClass(type: string, size: string = 'base', isLargeFont: boolean = false): string {
  return getFullTypographyClass(type, size, isLargeFont)
}

export default function UnifiedDocumentManagement() {
  const [activeTab, setActiveTab] = useState('shared')
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  const activeTabData = tabs.find(tab => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-5 sm:px-6">
          <h1 className={`${getTypographyClass('heading', 'lg', isLargeFont)} font-bold text-gray-900`}>
            문서함 관리
          </h1>
          <p className={`${getTypographyClass('body', 'sm', isLargeFont)} mt-1 text-gray-500`}>
            모든 현장의 문서함을 통합 관리합니다.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4 sm:px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center ${
                    touchMode === 'glove' ? 'py-6 px-2' : touchMode === 'precision' ? 'py-3 px-1' : 'py-4 px-1'
                  } border-b-2 ${getTypographyClass('body', 'sm', isLargeFont)} font-medium ${
                    isActive
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } transition-colors whitespace-nowrap`}
                >
                  <Icon
                    className={`${
                      touchMode === 'glove' ? 'h-6 w-6 mr-3' : touchMode === 'precision' ? 'h-4 w-4 mr-2' : 'h-5 w-5 mr-2'
                    } ${
                      isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-2 ${
                        touchMode === 'glove' ? 'px-3 py-1' : touchMode === 'precision' ? 'px-1.5 py-0.5' : 'px-2.5 py-0.5'
                      } rounded-full ${getTypographyClass('caption', 'xs', isLargeFont)} font-medium ${
                        isActive
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow-sm rounded-lg">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  )
}