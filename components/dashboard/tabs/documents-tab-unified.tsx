'use client'

import { useState, useEffect } from 'react'
import { Profile } from '@/types'
import { FolderOpen, Share2, Edit3, FileCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import DocumentsTab from './documents-tab'
import SharedDocumentsTabUpdated from './shared-documents-tab-updated'
import { MarkupEditor } from '@/components/markup/markup-editor'
import { documentDesignTokens } from '@/components/documents/design-tokens'

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

  const handleTabChange = (tab: 'personal' | 'shared' | 'markup' | 'required') => {
    setActiveTab(tab)
    if (onTabChange) {
      onTabChange(tab)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Modern Card Design */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* 내문서함 */}
          <Button
            variant={activeTab === 'personal' ? 'default' : 'outline'}
            onClick={() => handleTabChange('personal')}
            className="h-16 p-4 flex flex-col gap-2 text-sm font-medium"
            size="lg"
          >
            <FolderOpen className="h-5 w-5" />
            <span>내문서함</span>
          </Button>

          {/* 공유문서함 */}
          <Button
            variant={activeTab === 'shared' ? 'default' : 'outline'}
            onClick={() => handleTabChange('shared')}
            className="h-16 p-4 flex flex-col gap-2 text-sm font-medium"
            size="lg"
          >
            <Share2 className="h-5 w-5" />
            <span>공유문서함</span>
          </Button>

          {/* 도면마킹 */}
          <Button
            variant={activeTab === 'markup' ? 'default' : 'outline'}
            onClick={() => handleTabChange('markup')}
            className="h-16 p-4 flex flex-col gap-2 text-sm font-medium"
            size="lg"
          >
            <Edit3 className="h-5 w-5" />
            <span>도면마킹</span>
          </Button>

          {/* 필수 제출 서류 */}
          <Button
            variant={activeTab === 'required' ? 'default' : 'outline'}
            onClick={() => handleTabChange('required')}
            className="h-16 p-4 flex flex-col gap-2 text-sm font-medium relative"
            size="lg"
          >
            <FileCheck className="h-5 w-5" />
            <span>필수 제출 서류</span>
            {requiredDocsProgress.total > 0 && (
              <Badge 
                variant={requiredDocsProgress.completed === requiredDocsProgress.total ? "default" : "secondary"}
                className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full"
              >
                {requiredDocsProgress.completed}
              </Badge>
            )}
          </Button>
        </div>
      </Card>

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