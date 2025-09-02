'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2, Edit3, FileCheck, Camera } from 'lucide-react'
import DocumentsTab from './documents-tab'
import SharedDocumentsTab from './shared-documents-tab'
import { MarkupEditor } from '@/components/markup/markup-editor'
import PhotoGridDocumentsTab from './photo-grid-documents-tab'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared' | 'markup' | 'required' | 'photo-grid'
  initialSearch?: string
  onTabChange?: (tabId: string) => void
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal', initialSearch, onTabChange }: DocumentsTabUnifiedProps) {
  // If initialSearch is for blueprints, default to shared tab
  const defaultTab = initialSearch === '공도면' ? 'shared' : initialTab
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'markup' | 'required' | 'photo-grid'>(defaultTab)
  const [requiredDocsProgress, setRequiredDocsProgress] = useState({ completed: 0, total: 6 })

  // Update active tab when initialTab prop changes
  useEffect(() => {
    const newTab = initialSearch === '공도면' ? 'shared' : initialTab
    setActiveTab(newTab)
  }, [initialTab, initialSearch])

  return (
    <div className="space-y-4">
      {/* Button Navigation - Enhanced with Required Documents Tab */}
      <div className="flex flex-col gap-3">
        {/* First Row: 내문서함, 공유문서함 */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[48px] transition-all duration-200 ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <span>내문서함</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[48px] transition-all duration-200 ${
              activeTab === 'shared'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 className="h-5 w-5" />
              <span>공유문서함</span>
            </div>
          </button>
        </div>
        
        {/* Second Row: 도면마킹, 사진대지 */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('markup')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[48px] transition-all duration-200 ${
              activeTab === 'markup'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Edit3 className="h-5 w-5" />
              <span>도면마킹</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('photo-grid')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm min-h-[48px] transition-all duration-200 ${
              activeTab === 'photo-grid'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Camera className="h-5 w-5" />
              <span>사진대지문서함</span>
            </div>
          </button>
        </div>
        
        {/* Third Row: 필수 제출 서류 */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('required')}
            className={`w-full py-3 px-4 rounded-xl font-medium text-sm min-h-[48px] transition-all duration-200 relative ${
              activeTab === 'required'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileCheck className="h-5 w-5" />
              <span>필수 제출 서류</span>
            </div>
            {/* Progress Indicator Line */}
            {activeTab !== 'required' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-xl overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    requiredDocsProgress.completed === requiredDocsProgress.total
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-orange-500 to-red-500'
                  }`}
                  style={{ width: `${(requiredDocsProgress.completed / requiredDocsProgress.total) * 100}%` }}
                />
              </div>
            )}
          </button>
        </div>
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
          <SharedDocumentsTab profile={profile} initialSearch={initialSearch} />
        ) : activeTab === 'markup' ? (
          <MarkupEditor profile={profile} />
        ) : activeTab === 'photo-grid' ? (
          <PhotoGridDocumentsTab profile={profile} />
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