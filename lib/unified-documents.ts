export interface LinkUnifiedDocumentOptions {
  unifiedDocumentId?: string | null
  markupDocumentId?: string | null
  extraMetadata?: Record<string, any>
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
