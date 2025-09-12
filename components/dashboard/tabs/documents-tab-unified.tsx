'use client'

import { useState, useEffect, useCallback } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2, Edit3, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DocumentsTab from './documents-tab'
import SharedDocumentsTabUpdated from './shared-documents-tab-updated'
import { MarkupEditor } from '@/components/markup/markup-editor'
import { documentDesignTokens } from '@/components/documents/design-tokens'

interface DocumentsTabUnifiedProps {
  profile: Profile
  initialTab?: 'personal' | 'shared' | 'markup' | 'required'
  initialSearch?: string
}

export default function DocumentsTabUnified({ profile, initialTab = 'personal', initialSearch }: DocumentsTabUnifiedProps) {
  // If initialSearch is for blueprints, default to shared tab
  const defaultTab = initialSearch === '공도면' ? 'shared' : initialTab
  const [activeTab, setActiveTab] = useState<'personal' | 'shared' | 'markup' | 'required'>(defaultTab)
  const [requiredDocsProgress, setRequiredDocsProgress] = useState({ completed: 0, total: 6 })
  
  // Use useCallback to memoize the callback function
  const handleRequiredDocsUpdate = useCallback((completed: number, total: number) => {
    setRequiredDocsProgress({ completed, total })
  }, [])

  // Update active tab when initialTab prop changes
  useEffect(() => {
    const newTab = initialSearch === '공도면' ? 'shared' : initialTab
    // Only update if actually different to prevent infinite loops
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [initialTab, initialSearch]) // Intentionally exclude activeTab to prevent loops

  const handleTabChange = (tab: 'personal' | 'shared' | 'markup' | 'required') => {
    setActiveTab(tab)
    // No more onTabChange callback - component manages its own state
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Modern Unified Design */}
      <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 내문서함 */}
            <Button
              variant={activeTab === 'personal' ? 'primary' : 'outline'}
              onClick={() => handleTabChange('personal')}
              className="h-20 p-4 flex flex-col gap-3 text-sm font-semibold transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              <FolderOpen className="h-6 w-6" />
              <span>내문서함</span>
            </Button>

            {/* 공유문서함 */}
            <Button
              variant={activeTab === 'shared' ? 'primary' : 'outline'}
              onClick={() => handleTabChange('shared')}
              className="h-20 p-4 flex flex-col gap-3 text-sm font-semibold transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              <Share2 className="h-6 w-6" />
              <span>공유문서함</span>
            </Button>

            {/* 도면마킹 */}
            <Button
              variant={activeTab === 'markup' ? 'primary' : 'outline'}
              onClick={() => handleTabChange('markup')}
              className="h-20 p-4 flex flex-col gap-3 text-sm font-semibold transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              <Edit3 className="h-6 w-6" />
              <span>도면마킹</span>
            </Button>

            {/* 필수 제출 서류 */}
            <Button
              variant={activeTab === 'required' ? 'primary' : 'outline'}
              onClick={() => handleTabChange('required')}
              className="h-20 p-4 flex flex-col gap-3 text-sm font-semibold relative transition-all duration-200 hover:shadow-md"
              size="lg"
            >
              <FileCheck className="h-6 w-6" />
              <span className="text-center leading-tight">필수서류 제출</span>
              {(requiredDocsProgress.total || 0) > 0 && (
                <Badge 
                  variant={(requiredDocsProgress.completed || 0) === (requiredDocsProgress.total || 0) ? "default" : "destructive"}
                  className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center text-xs rounded-full shadow-sm border-2 border-white dark:border-gray-900"
                >
                  {(requiredDocsProgress.completed || 0)}/{(requiredDocsProgress.total || 0)}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content - Removed fixed height for proper scrolling */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-visible">
        {activeTab === 'personal' ? (
          <DocumentsTab 
            profile={profile} 
            hideRequiredDocs={true}
            onRequiredDocsUpdate={handleRequiredDocsUpdate}
          />
        ) : activeTab === 'shared' ? (
          <SharedDocumentsTabUpdated profile={profile} initialSearch={initialSearch} />
        ) : activeTab === 'markup' ? (
          <MarkupEditor profile={profile} />
        ) : (
          <DocumentsTab 
            profile={profile} 
            showOnlyRequiredDocs={true}
            onRequiredDocsUpdate={handleRequiredDocsUpdate}
          />
        )}
      </div>
    </div>
  )
}