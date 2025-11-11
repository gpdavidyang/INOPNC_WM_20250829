import type { SupabaseClient } from '@supabase/supabase-js'

const TABLE_NAME = 'material_production_items'
type GenericSupabaseClient = SupabaseClient<any, 'public', any>

let cachedSupport: boolean | null = null
let lastChecked = 0
const columnCache = new Map<string, { exists: boolean; checkedAt: number }>()

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

/**
 * Checks whether a specific column exists on material_productions.
 */
export async function hasMaterialProductionColumn(
  supabase: Pick<GenericSupabaseClient, 'from'>,
  columnName: string
): Promise<boolean> {
  const key = columnName.toLowerCase()
  const cached = columnCache.get(key)
  if (cached && Date.now() - cached.checkedAt < 60_000) {
    return cached.exists
  }

  let exists = false
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'material_productions')
      .eq('column_name', columnName)
      .maybeSingle()
    if (!error) {
      exists = !!data
    } else {
      // fall back to probing via select in case information_schema is blocked
      const { error: columnErr } = await supabase
        .from('material_productions')
        .select(columnName, { head: true, count: 'exact' })
        .limit(1)
      exists = !columnErr
    }
  } catch (error) {
    console.error('[materials] Failed to probe material_productions column', columnName, error)
    exists = true
  }

  columnCache.set(key, { exists, checkedAt: Date.now() })
  return exists
}
