'use client'

import { useState } from 'react'
import { 
  Edit3, 
  FileImage,
  FolderOpen,
  Plus,
  Grid,
  List,
  Search,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import { MarkupDocumentList } from '@/components/markup/list/markup-document-list'
import type { Profile } from '@/types'
import type { MarkupDocument } from '@/types/markup'

interface AdminMarkupToolProps {
  profile: Profile
}

export default function AdminMarkupTool({ profile }: AdminMarkupToolProps) {
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [selectedDocument, setSelectedDocument] = useState<MarkupDocument | undefined>()

  const handleCreateNew = () => {
    setSelectedDocument(undefined)
    setView('editor')
  }

  const handleOpenDocument = (document: MarkupDocument) => {
    setSelectedDocument(document)
    setView('editor')
  }

  const handleEditDocument = (document: MarkupDocument) => {
    setSelectedDocument(document)
    setView('editor')
  }

  const handleSave = (document: MarkupDocument) => {
    setView('list')
  }

  const handleClose = () => {
    setView('list')
  }

  if (view === 'editor') {
    return (
      <SharedMarkupEditor
        profile={profile}
        mode="admin"
        onSave={handleSave}
        onClose={handleClose}
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
              <Edit3 className="h-6 w-6 mr-2 text-purple-600" />
              도면 마킹 도구
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              도면에 마킹을 추가하고 관리할 수 있습니다
            </p>
          </div>
          
          <Button
            onClick={handleCreateNew}
            className="flex items-center bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 마킹 생성
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <MarkupDocumentList
          onCreateNew={handleCreateNew}
          onOpenDocument={handleOpenDocument}
          onEditDocument={handleEditDocument}
        />
      </div>
    </div>
  )
}