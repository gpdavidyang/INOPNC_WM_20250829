import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

type GridRow = {
  id: string
  site_id: string
  component_name?: string | null
  work_process?: string | null
  work_section?: string | null
  work_date?: string | null
  created_at?: string | null
}

type GridImage = {
  photo_grid_id: string
  photo_type: 'before' | 'after'
  photo_url: string
  photo_order: number
}

function bestFitGrid(n: number): { rows: number; cols: number } {
  if (n <= 0) return { rows: 1, cols: 1 }
  let cols = 2
  let rows = Math.max(1, Math.ceil(n / cols))
  if (n <= 4) {
    cols = 2
    rows = Math.ceil(n / 2)
  } else if (n <= 6) {
    cols = 3
    rows = Math.ceil(n / 3)
  } else if (n <= 9) {
    cols = 3
    rows = 3
  } else {
    cols = Math.min(5, Math.ceil(Math.sqrt(n)))
    rows = Math.ceil(n / cols)
  }
  return { rows, cols }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) return authResult
    const auth = authResult

    if (!auth.role || !['admin', 'system_admin'].includes(auth.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(request.url)
    const siteId = url.searchParams.get('site_id') || undefined
    const dryRun = url.searchParams.get('dry_run') === '1'
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Math.min(1000, Number(limitParam) || 0)) : undefined

    const supabase = await createClient()

    // Fetch grids to migrate
    let gridQuery = supabase
      .from('photo_grids')
      .select(
        'id, site_id, component_name, work_process, work_section, work_date, created_at, site:sites(organization_id)'
      )
      .order('created_at', { ascending: false })

    if (siteId) gridQuery = gridQuery.eq('site_id', siteId)
    if (limit) gridQuery = gridQuery.limit(limit)

    const { data: grids, error: gridsErr } = (await gridQuery) as unknown as {
      data: (GridRow & { site?: { organization_id?: string | null } | null })[] | null
      error: any
    }
    if (gridsErr) {
      console.error('Fetch photo_grids error:', gridsErr)
      return NextResponse.json({ error: 'Failed to load photo_grids' }, { status: 500 })
    }

    const rows = grids || []
    if (rows.length === 0) {
      return NextResponse.json({ success: true, migrated: 0, skipped: 0, details: [] })
    }

    // Scope check for restricted users (should not happen for admins, but keep safety)
    const scoped = auth.isRestricted
      ? rows.filter(r => (r as any).site?.organization_id === auth.restrictedOrgId)
      : rows

    // Fetch all images in batch
    const ids = scoped.map(g => g.id)
    const { data: images, error: imgsErr } = await supabase
      .from('photo_grid_images')
      .select('photo_grid_id, photo_type, photo_url, photo_order')
      .in('photo_grid_id', ids)
      .order('photo_type', { ascending: true })
      .order('photo_order', { ascending: true })
    if (imgsErr) {
      console.error('Fetch photo_grid_images error:', imgsErr)
      return NextResponse.json({ error: 'Failed to load images' }, { status: 500 })
    }

    const byGrid = new Map<string, GridImage[]>()
    for (const img of (images || []) as GridImage[]) {
      const arr = byGrid.get(img.photo_grid_id) || []
      arr.push(img)
      byGrid.set(img.photo_grid_id, arr)
    }

    const results: Array<{
      grid_id: string
      sheet_id?: string
      items: number
      status: 'migrated' | 'skipped' | 'error'
      reason?: string
    }> = []

    for (const g of scoped) {
      try {
        // Optional safety: if a sheet already exists for same site and similar signature, skip
        // Heuristic: find any sheet for site with same title and same item count
        const imgs = byGrid.get(g.id) || []
        const count = imgs.length
        const title = g.component_name || '사진대지'

        const { data: existingSheets } = await supabase
          .from('photo_sheets')
          .select('id')
          .eq('site_id', g.site_id)
          .eq('title', title)
          .limit(1)

        if (!dryRun && existingSheets && existingSheets.length > 0) {
          results.push({
            grid_id: g.id,
            status: 'skipped',
            items: count,
            reason: 'similar sheet exists',
          })
          continue
        }

        const { rows, cols } = bestFitGrid(count)
        if (dryRun) {
          results.push({ grid_id: g.id, status: 'skipped', items: count, reason: 'dry_run' })
          continue
        }

        // Insert sheet
        const { data: sheet, error: sheetErr } = await supabase
          .from('photo_sheets')
          .insert({
            title,
            site_id: g.site_id,
            orientation: 'portrait',
            rows,
            cols,
            status: 'final',
            created_by: auth.userId,
          })
          .select()
          .single()

        if (sheetErr || !sheet) {
          console.error('Insert sheet error:', sheetErr)
          results.push({
            grid_id: g.id,
            status: 'error',
            items: count,
            reason: 'insert sheet failed',
          })
          continue
        }

        // Insert items
        if (count > 0) {
          const itemRows = imgs.map((img, i) => ({
            photosheet_id: sheet.id,
            item_index: i,
            member_name: g.component_name || null,
            process_name: g.work_process || null,
            content: g.work_section || null,
            stage: img.photo_type || null,
            image_url: img.photo_url || null,
            width: null,
            height: null,
            mime: null,
          }))
          const { error: itemErr } = await supabase.from('photo_sheet_items').insert(itemRows)
          if (itemErr) {
            console.error('Insert sheet items error:', itemErr)
            results.push({
              grid_id: g.id,
              sheet_id: sheet.id,
              status: 'error',
              items: count,
              reason: 'insert items failed',
            })
            continue
          }
        }

        results.push({
          grid_id: g.id,
          sheet_id: (sheet as any).id,
          status: 'migrated',
          items: count,
        })
      } catch (e) {
        console.error('Migration error for grid', g.id, e)
        results.push({
          grid_id: g.id,
          status: 'error',
          items: (byGrid.get(g.id) || []).length,
          reason: 'exception',
        })
      }
    }

    const migrated = results.filter(r => r.status === 'migrated').length
    const skipped = results.filter(r => r.status === 'skipped').length

    return NextResponse.json({ success: true, migrated, skipped, details: results })
  } catch (e) {
    console.error('POST /api/admin/migrations/photo-grids-to-photo-sheets error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
