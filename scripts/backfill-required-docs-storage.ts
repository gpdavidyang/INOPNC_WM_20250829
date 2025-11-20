#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  )
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type DocRow = {
  id: string
  file_url?: string | null
  storage_bucket?: string | null
  storage_path?: string | null
  metadata?: any
}

function parseMetadata(meta: unknown): Record<string, any> {
  if (!meta) return {}
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta)
    } catch {
      return {}
    }
  }
  if (typeof meta === 'object') return meta as Record<string, any>
  return {}
}

function parseFromUrl(url?: string | null): { bucket: string; path: string } | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const idx = parsed.pathname.indexOf('/storage/v1/object/')
    if (idx === -1) return null
    const tail = parsed.pathname.slice(idx + '/storage/v1/object/'.length)
    const [scope, ...rest] = tail.split('/')
    if (!scope || rest.length < 1) return null
    const bucket = rest.shift()
    if (!bucket) return null
    let objectPath = rest.join('/')
    objectPath = decodeURIComponent(objectPath)
    const tokenIdx = objectPath.indexOf('?')
    if (tokenIdx >= 0) objectPath = objectPath.slice(0, tokenIdx)
    return { bucket, path: objectPath }
  } catch {
    return null
  }
}

async function main() {
  console.log('🔍 Backfill required docs storage metadata')

  while (true) {
    const { data, error } = await supabase
      .from('unified_document_system')
      .select('id,file_url,metadata,storage_bucket,storage_path')
      .or('storage_bucket.is.null,storage_path.is.null')
      .in('category_type', ['required', 'required_user_docs'])
      .limit(200)

    if (error) throw error
    if (!data || data.length === 0) break

    const updates: Array<{
      id: string
      storage_bucket: string
      storage_path: string
      metadata: any
    }> = []

    for (const row of data as DocRow[]) {
      const meta = parseMetadata(row.metadata)
      const metaBucket = meta.storage_bucket || meta.bucket
      const metaPath = meta.storage_path || meta.path || meta.object_path

      let bucket = row.storage_bucket || metaBucket
      let path = row.storage_path || metaPath

      if (!bucket || !path) {
        const parsed = parseFromUrl(row.file_url)
        if (parsed) {
          bucket = bucket || parsed.bucket
          path = path || parsed.path
        }
      }

      if (bucket && path) {
        updates.push({
          id: row.id,
          storage_bucket: bucket,
          storage_path: path,
          metadata: { ...meta, storage_bucket: bucket, storage_path: path },
        })
      }
    }

    if (updates.length === 0) break

    const { error: updateError } = await supabase
      .from('unified_document_system')
      .upsert(updates, { onConflict: 'id' })
    if (updateError) throw updateError

    console.log(`✅ Updated ${updates.length} rows`)
    if ((data as DocRow[]).length < 200) break
  }

  console.log('🎉 Backfill complete')
}

main().catch(error => {
  console.error('❌ Backfill failed:', error)
  process.exit(1)
})
