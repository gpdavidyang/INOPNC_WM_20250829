export interface LinkUnifiedDocumentOptions {
  unifiedDocumentId?: string | null
  markupDocumentId?: string | null
  extraMetadata?: Record<string, any>
}

export interface SyncMarkupToUnifiedDocumentOptions {
  unifiedDocumentId?: string | null
  markupDocumentId?: string | null
  markupData?: any[]
  markupCount?: number
  title?: string | null
  description?: string | null
  siteId?: string | null
  linkedWorklogId?: string | null
  linkedWorklogIds?: string[]
  originalBlueprintUrl?: string | null
  originalBlueprintFilename?: string | null
}

/**
 * Link an existing unified_document_system row to a markup document so that
 * the shared document list knows it is managed through the markup tool.
 * This is a best-effort client helper; failures are logged to the console.
 */
export async function linkUnifiedDocumentToMarkupDoc({
  unifiedDocumentId,
  markupDocumentId,
  extraMetadata,
}: LinkUnifiedDocumentOptions): Promise<void> {
  if (!unifiedDocumentId || !markupDocumentId) return
  try {
    const res = await fetch(`/api/unified-documents/${unifiedDocumentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: {
          source_table: 'markup_documents',
          markup_document_id: markupDocumentId,
          ...extraMetadata,
        },
      }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      console.warn('Failed to sync unified document metadata', payload?.error || res.statusText)
    }
  } catch (error) {
    console.warn('Unified document sync error:', error)
  }
}

/**
 * Push the latest markup payload back into the shared unified_document_system row
 * so 현장 공유함과 모바일 클라이언트가 같은 마킹 데이터를 볼 수 있다.
 */
export async function syncMarkupUpdateToUnifiedDocument({
  unifiedDocumentId,
  markupDocumentId,
  markupData,
  markupCount,
  title,
  description,
  siteId,
  linkedWorklogId,
  linkedWorklogIds,
  originalBlueprintUrl,
  originalBlueprintFilename,
}: SyncMarkupToUnifiedDocumentOptions): Promise<void> {
  if (!unifiedDocumentId || !markupDocumentId) return
  const payloadMarkup = Array.isArray(markupData) ? markupData : []
  const normalizedIds =
    Array.isArray(linkedWorklogIds) && linkedWorklogIds.length > 0
      ? Array.from(
          new Set(
            linkedWorklogIds.map(id => (typeof id === 'string' ? id.trim() : '')).filter(Boolean)
          )
        )
      : []
  try {
    const res = await fetch(`/api/unified-documents/${unifiedDocumentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title || undefined,
        description: description || undefined,
        markup_data: payloadMarkup,
        site_id: siteId || undefined,
        metadata: {
          source_table: 'markup_documents',
          markup_document_id: markupDocumentId,
          markup_count: typeof markupCount === 'number' ? markupCount : payloadMarkup.length,
          original_blueprint_url: originalBlueprintUrl,
          original_blueprint_filename: originalBlueprintFilename,
          linked_worklog_id: linkedWorklogId ?? normalizedIds[0] ?? null,
          linked_worklog_ids: normalizedIds,
          site_id: siteId ?? null,
          last_markup_synced_at: new Date().toISOString(),
        },
      }),
    })
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}))
      console.warn(
        'Failed to sync markup payload to unified document',
        payload?.error || res.status
      )
    }
  } catch (error) {
    console.warn('Unified document markup sync error:', error)
  }
}

export type SharedSubcategory =
  | 'ptw'
  | 'construction_drawing'
  | 'progress_drawing'
  | 'shared_other'
  | 'safety_document'
  | 'plan'
  | 'blueprint'

const DOCUMENT_TYPE_TO_SUBCATEGORY: Record<string, SharedSubcategory> = {
  ptw: 'ptw',
  blueprint: 'construction_drawing',
  construction_drawing: 'construction_drawing',
  plan: 'construction_drawing',
  progress_drawing: 'progress_drawing',
  progress: 'progress_drawing',
  safety_document: 'safety_document',
}

export function mapDocumentTypeToSharedSubcategory(
  documentType?: string | null
): SharedSubcategory {
  if (!documentType) return 'shared_other'
  const key = documentType.trim().toLowerCase()
  return DOCUMENT_TYPE_TO_SUBCATEGORY[key] || 'shared_other'
}

const SUBCATEGORY_TO_CATEGORY: Record<string, 'plan' | 'progress' | 'other' | 'ptw'> = {
  construction_drawing: 'plan',
  blueprint: 'plan',
  plan: 'plan',
  progress_drawing: 'progress',
  progress: 'progress',
  ptw: 'ptw',
}

export function mapSharedSubcategoryToCategory(
  subCategory?: string | null
): 'plan' | 'progress' | 'other' | 'ptw' {
  if (!subCategory) return 'other'
  const key = subCategory.trim().toLowerCase()
  return SUBCATEGORY_TO_CATEGORY[key] || 'other'
}
