#!/usr/bin/env ts-node
import 'dotenv/config'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { uploadBufferToDocumentsBucket } from '@/lib/storage/data-url'
import { createPdfFromImageBuffer } from '@/lib/markups/pdf'
import { Buffer } from 'node:buffer'

const BATCH_SIZE = 25

async function main() {
  const client = createServiceRoleClient()
  let offset = 0
  let processed = 0
  let updated = 0

  while (true) {
    const { data, error } = await client
      .from('unified_document_system')
      .select('id, site_id, metadata')
      .eq('category_type', 'markup')
      .is('metadata->>snapshot_pdf_url', null)
      .not('metadata->>preview_image_url', 'is', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1)

    if (error) {
      console.error('[backfill] query failed:', error.message)
      break
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      processed += 1
      const metadata =
        row?.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, any>)
          : {}
      const previewUrl =
        typeof metadata.preview_image_url === 'string' && metadata.preview_image_url.length > 0
          ? metadata.preview_image_url
          : typeof metadata.previewUrl === 'string' && metadata.previewUrl.length > 0
            ? metadata.previewUrl
            : undefined
      if (!previewUrl) {
        console.warn('[backfill] skip doc without preview', row.id)
        continue
      }
      try {
        const response = await fetch(previewUrl)
        if (!response.ok) {
          console.warn('[backfill] failed to fetch preview', row.id, response.status)
          continue
        }
        const arrayBuffer = await response.arrayBuffer()
        const imageBuffer = Buffer.from(arrayBuffer)
        const pdfBuffer = await createPdfFromImageBuffer(imageBuffer)
        if (!pdfBuffer) {
          console.warn('[backfill] pdf generation failed for', row.id)
          continue
        }
        const uploaded = await uploadBufferToDocumentsBucket({
          buffer: pdfBuffer,
          mimeType: 'application/pdf',
          siteId: row.site_id,
          prefix: 'markup-backfill-pdfs',
        })
        if (!uploaded) {
          console.warn('[backfill] upload failed for', row.id)
          continue
        }
        const nextMeta = {
          ...metadata,
          snapshot_pdf_url: uploaded.url,
          snapshot_pdf_path: uploaded.path,
        }
        const { error: updateError } = await client
          .from('unified_document_system')
          .update({ metadata: nextMeta })
          .eq('id', row.id)
        if (updateError) {
          console.warn('[backfill] failed to update metadata', row.id, updateError.message)
          continue
        }
        updated += 1
        console.log('[backfill] added snapshot_pdf_url for', row.id)
      } catch (err) {
        console.warn('[backfill] unexpected error', row.id, err)
      }
    }

    if (data.length < BATCH_SIZE) break
    offset += BATCH_SIZE
  }

  console.log(`[backfill] processed ${processed} docs, updated ${updated}`)
}

main().catch(err => {
  console.error('[backfill] fatal error', err)
  process.exit(1)
})
