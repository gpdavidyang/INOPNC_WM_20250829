import type { SupabaseClient } from '@supabase/supabase-js'

const TABLE_NAME = 'material_production_items'
type GenericSupabaseClient = SupabaseClient<any, 'public', any>

let cachedSupport: boolean | null = null
let lastChecked = 0

export type ProductionMetadataItem = {
  material_id?: string
  produced_quantity?: number | null
  order_quantity?: number | null
  notes?: string | null
  material_snapshot?: {
    name?: string | null
    code?: string | null
    unit?: string | null
  } | null
}

export type ProductionMetadata = {
  memo?: string | null
  fallback_items?: ProductionMetadataItem[]
  [key: string]: unknown
} | null

/**
 * Detects whether the optional material_production_items table exists.
 * Result is cached for a short period to avoid hitting information_schema on every request.
 */
export async function hasProductionItemsTable(
  supabase: Pick<GenericSupabaseClient, 'from'>
): Promise<boolean> {
  if (cachedSupport !== null && Date.now() - lastChecked < 60_000) {
    return cachedSupport
  }

  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', TABLE_NAME)
      .maybeSingle()

    cachedSupport = !error && !!data
  } catch (error) {
    console.error('[materials] Failed to probe material_production_items table', error)
    cachedSupport = false
  }

  lastChecked = Date.now()
  return cachedSupport
}

/**
 * Attempts to parse the structured metadata stored in material_productions.quality_notes.
 * Handles legacy strings that combine text + JSON blobs by parsing only the JSON segment.
 */
export function parseProductionMetadata(raw: unknown): ProductionMetadata {
  if (!raw) return null
  if (typeof raw === 'object') {
    return raw as ProductionMetadata
  }

  const rawText = String(raw).trim()
  if (!rawText) return null

  const candidates = [rawText]
  const lastBrace = rawText.lastIndexOf('{')
  if (lastBrace > 0) {
    candidates.push(rawText.slice(lastBrace))
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') {
        return parsed as ProductionMetadata
      }
    } catch {
      // ignore and try next candidate
    }
  }

  return null
}

/**
 * Resolves a memo string for UI display, preferring structured metadata and
 * falling back to the first line of the raw notes text.
 */
export function extractProductionMemo(raw: unknown, metadata?: ProductionMetadata): string | null {
  if (metadata && typeof metadata.memo === 'string' && metadata.memo.trim()) {
    return metadata.memo.trim()
  }

  const rawText = typeof raw === 'string' ? raw.trim() : ''
  if (!rawText) return null
  return rawText.split('\n')[0] || null
}
