'use client'

import React from 'react'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import MarkupMetadataForm, {
  type SiteOption,
} from '@/components/admin/markup/MarkupMetadataForm'

interface EditClientProps {
  document: any
  siteOptions: SiteOption[]
}

export default function EditClient({ document, siteOptions }: EditClientProps) {
  const [editorDocument, setEditorDocument] = React.useState(document)
  const onSave = async (payload: any) => {
    const res = await fetch(`/api/markup-documents/${editorDocument.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        markup_data: payload.markup_data || [],
        preview_image_url: payload.preview_image_url || null,
        site_id: editorDocument?.site_id ?? null,
        linked_worklog_id: editorDocument?.linked_worklog_id ?? null,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j?.error || '저장 실패')
    }
  }

  return (
    <div className="space-y-4">
      <MarkupMetadataForm
        document={editorDocument}
        siteOptions={siteOptions}
        onDocumentChange={setEditorDocument}
      />

      <div className="h-[calc(100vh-260px)] min-h-[520px]">
        <SharedMarkupEditor initialDocument={editorDocument} onSave={onSave} />
      </div>
    </div>
  )
}
