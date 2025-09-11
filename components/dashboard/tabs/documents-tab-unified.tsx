'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2, Edit3, FileCheck } from 'lucide-react'
import DocumentsTab from './documents-tab'
import SharedDocumentsTabUpdated from './shared-documents-tab-updated'
import { MarkupEditor } from '@/components/markup/markup-editor'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared' | 'markup' | 'required'
  initialSearch?: string
  onTabChange?: (tabId: string) => void
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal', initialSearch, onTabChange }: DocumentsTabUnifiedProps) {
  // If initialSearch is for blueprints, default to shared tab
  const defaultTab = initialSearch === '공도면' ? 'shared' : initialTab
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'markup' | 'required'>(defaultTab)
  const [requiredDocsProgress, setRequiredDocsProgress] = useState({ completed: 0, total: 6 })

  // Update active tab when initialTab prop changes
  useEffect(() => {
    const newTab = initialSearch === '공도면' ? 'shared' : initialTab
    setActiveTab(newTab)
  }, [initialTab, initialSearch])

  return (
    <div className="space-y-4">
      {/* Button Navigation - 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* 내문서함 */}
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-4 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'personal'
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            <span>내문서함</span>
          </div>
        </button>

        {/* 공유문서함 */}
        <button
          onClick={() => setActiveTab('shared')}
          className={`py-4 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'shared'
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Share2 className="h-6 w-6" />
            <span>공유문서함</span>
          </div>
        </button>

        {/* 도면마킹 */}
        <button
          onClick={() => setActiveTab('markup')}
          className={`py-4 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
            activeTab === 'markup'
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Edit3 className="h-6 w-6" />
            <span>도면마킹</span>
          </div>
        </button>

        {/* 필수 제출 서류 */}
        <button
          onClick={() => setActiveTab('required')}
          className={`py-4 px-4 rounded-lg font-medium text-sm transition-all duration-200 relative ${
            activeTab === 'required'
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <FileCheck className="h-6 w-6" />
            <span>필수 제출 서류</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'personal' ? (
          <DocumentsTab 
            profile={profile} 
            hideRequiredDocs={true}
            onRequiredDocsUpdate={(completed, total) => setRequiredDocsProgress({ completed, total })}
          />
        ) : activeTab === 'shared' ? (
          <SharedDocumentsTabUpdated profile={profile} initialSearch={initialSearch} />
        ) : activeTab === 'markup' ? (
          <MarkupEditor profile={profile} />
        ) : (
          <DocumentsTab 
            profile={profile} 
            showOnlyRequiredDocs={true}
            onRequiredDocsUpdate={(completed, total) => setRequiredDocsProgress({ completed, total })}
          />
        )}
      </div>
    </div>
  )
}