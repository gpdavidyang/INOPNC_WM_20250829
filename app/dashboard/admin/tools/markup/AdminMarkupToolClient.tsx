'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { SharedMarkupEditor } from '@/components/markup/SharedMarkupEditor'
import MarkupMetadataForm, { type SiteOption } from '@/components/admin/markup/MarkupMetadataForm'
import { linkUnifiedDocumentToMarkupDoc } from '@/lib/unified-documents'

type AnyDoc = {
  id?: string
  title?: string
  description?: string
  original_blueprint_url?: string
  original_blueprint_filename?: string
  markup_data?: any[]
  site_id?: string | null
  linked_worklog_id?: string | null
  linked_worklog_ids?: string[] | null
}

interface AdminMarkupToolClientProps {
  initialDocument: AnyDoc
  siteOptions: SiteOption[]
  onClose?: () => void
}

export default function AdminMarkupToolClient({
  initialDocument,
  siteOptions,
  onClose,
}: AdminMarkupToolClientProps) {
  const router = useRouter()
  const [activeDocument, setActiveDocument] = React.useState(initialDocument)

  React.useEffect(() => {
    setActiveDocument(initialDocument)
  }, [initialDocument])

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
          site_id: payload.site_id ?? activeDocument?.site_id ?? null,
          linked_worklog_id: mergedLinkedWorklogId,
          linked_worklog_ids: mergedLinkedIds,
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
          site_id: payload.site_id ?? activeDocument?.site_id ?? null,
          linked_worklog_id: mergedLinkedWorklogId,
          linked_worklog_ids: mergedLinkedIds,
        }),
      })
    }
    const j = await res.json().catch(() => ({}))
    if (!res.ok || j?.error) throw new Error(j?.error || '저장 실패')
    const savedDoc = j?.data
    const unifiedId =
      payload?.unified_document_id ||
      activeDocument?.unified_document_id ||
      initialDocument?.unified_document_id
    if (!payload?.id && unifiedId && savedDoc?.id) {
      await linkUnifiedDocumentToMarkupDoc({
        unifiedDocumentId: unifiedId,
        markupDocumentId: savedDoc.id,
        extraMetadata: {
          linked_worklog_id:
            savedDoc?.linked_worklog_id ??
            mergedLinkedWorklogId ??
            payload?.linked_worklog_id ??
            activeDocument?.linked_worklog_id ??
            null,
          linked_worklog_ids:
            (savedDoc?.linked_worklog_ids ?? mergedLinkedIds.length > 0)
              ? mergedLinkedIds
              : (payload?.linked_worklog_ids ?? activeDocument?.linked_worklog_ids),
          site_id: savedDoc.site_id ?? payload?.site_id ?? activeDocument?.site_id ?? null,
        },
      })
    }

    // 저장 후 목록으로 이동
    router.push('/dashboard/admin/documents/markup')
  }

  const handleClose = () => {
    if (onClose) return onClose()
    // fallback: route back to launcher
    router.push('/dashboard/admin/tools/markup')
  }

  return (
    <div className="space-y-4">
      <MarkupMetadataForm
        document={activeDocument}
        siteOptions={siteOptions}
        onDocumentChange={setActiveDocument}
      />
      <div className="h-[calc(100vh-260px)] min-h-[560px]">
        <SharedMarkupEditor
          mode="admin"
          initialDocument={activeDocument}
          onSave={onSave}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
const extractLinkedIds = (doc?: AnyDoc | null) => {
  if (!doc) return []
  if (Array.isArray(doc.linked_worklog_ids) && doc.linked_worklog_ids.length > 0) {
    return doc.linked_worklog_ids.filter(
      (value): value is string => typeof value === 'string' && value.trim().length > 0
    )
  }
  if (doc.linked_worklog_id) return [doc.linked_worklog_id]
  return []
}
const mergedLinkedIds = (() => {
  const fromActive = extractLinkedIds(activeDocument)
  if (fromActive.length > 0) return fromActive
  const fromPayload = extractLinkedIds(payload)
  if (fromPayload.length > 0) return fromPayload
  return []
})()
const mergedLinkedWorklogId = mergedLinkedIds[0] ?? null
