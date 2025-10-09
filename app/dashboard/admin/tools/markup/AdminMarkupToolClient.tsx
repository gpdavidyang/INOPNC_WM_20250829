'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'

type AnyDoc = {
  id?: string
  title?: string
  description?: string
  original_blueprint_url?: string
  original_blueprint_filename?: string
  markup_data?: any[]
}

interface AdminMarkupToolClientProps {
  initialDocument: AnyDoc
  onClose?: () => void
}

export default function AdminMarkupToolClient({
  initialDocument,
  onClose,
}: AdminMarkupToolClientProps) {
  const router = useRouter()
  const params = useSearchParams()

  const onSave = async (payload: AnyDoc) => {
    // If blueprint url is a local blob, upload it to obtain a persistent URL
    let blueprintUrl = payload.original_blueprint_url || ''
    let blueprintFileName = payload.original_blueprint_filename || 'blueprint.png'
    if (blueprintUrl.startsWith('blob:')) {
      try {
        const resp = await fetch(blueprintUrl)
        const blob = await resp.blob()
        const fd = new FormData()
        fd.append('file', new File([blob], blueprintFileName, { type: blob.type || 'image/png' }))
        const up = await fetch('/api/uploads/preview', { method: 'POST', body: fd })
        const uj = await up.json().catch(() => ({}))
        if (up.ok && uj?.url) {
          blueprintUrl = uj.url as string
        }
      } catch {
        // ignore upload failures and fallback to blob url (not ideal but non-blocking)
      }
    }
    let res: Response
    if (payload?.id) {
      res = await fetch(`/api/markup-documents/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          markup_data: payload.markup_data || [],
          preview_image_url: null,
        }),
      })
    } else {
      res = await fetch(`/api/markup-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title || '무제 도면',
          description: payload.description || '',
          original_blueprint_url: blueprintUrl,
          original_blueprint_filename: blueprintFileName,
          markup_data: payload.markup_data || [],
          preview_image_url: null,
        }),
      })
    }
    const j = await res.json().catch(() => ({}))
    if (!res.ok || j?.error) throw new Error(j?.error || '저장 실패')

    // 저장 후 목록/상세로 이동
    try {
      const id = (j?.data?.id || payload?.id) as string | undefined
      if (id) router.push(`/dashboard/admin/documents/markup/${id}`)
      else router.push('/dashboard/admin/documents/markup')
    } catch {
      router.push('/dashboard/admin/documents/markup')
    }
  }

  const handleClose = () => {
    if (onClose) return onClose()
    // fallback: route back to launcher
    router.push('/dashboard/admin/tools/markup')
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[560px]">
      <SharedMarkupEditor
        mode="admin"
        initialDocument={initialDocument}
        onSave={onSave}
        onClose={handleClose}
      />
    </div>
  )
}
