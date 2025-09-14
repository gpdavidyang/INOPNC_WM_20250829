'use client'

import { MarkupEditor } from './markup-editor'
import type { MarkupDocument } from '@/types/markup'
import type { Profile } from '@/types'

interface SharedMarkupEditorProps {
  profile: Profile
  mode?: 'worker' | 'manager' | 'admin'
  siteId?: string
  onSave?: (document: MarkupDocument) => void
  onClose?: () => void
}

export function SharedMarkupEditor({ 
  profile, 
  mode = 'worker',
  siteId,
  onSave,
  onClose 
}: SharedMarkupEditorProps) {
  const [initialDocument, setInitialDocument] = useState<MarkupDocument | undefined>()

  const handleSave = async (document: MarkupDocument) => {
    try {
      const saveData = {
        ...document,
        site_id: siteId,
        created_by: profile.id,
        created_by_name: profile.full_name || profile.email,
        creator_email: profile.email,
        mode: mode
      }

      const response = await fetch('/api/markup-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      if (!response.ok) {
        throw new Error('저장 실패')
      }

      const savedDoc = await response.json()
      
      if (onSave) {
        onSave(savedDoc)
      }
    } catch (error) {
      console.error('Save error:', error)
      throw error
    }
  }

  return (
    <MarkupEditor
      initialFile={initialDocument}
      onSave={handleSave}
      onClose={onClose}
      profile={profile}
    />
  )
}

export default SharedMarkupEditor