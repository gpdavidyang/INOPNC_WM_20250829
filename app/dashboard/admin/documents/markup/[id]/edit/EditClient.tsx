'use client'

import React from 'react'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'

interface EditClientProps {
  document: any
}

export default function EditClient({ document }: EditClientProps) {
  const onSave = async (payload: any) => {
    const res = await fetch(`/api/markup-documents/${document.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        description: payload.description,
        markup_data: payload.markup_data || [],
        preview_image_url: payload.preview_image_url || null,
      }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j?.error || '저장 실패')
    }
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[520px]">
      <SharedMarkupEditor initialDocument={document} onSave={onSave} />
    </div>
  )
}

