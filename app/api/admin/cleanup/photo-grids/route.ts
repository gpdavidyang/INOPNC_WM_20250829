import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

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
    const deleteFiles = url.searchParams.get('delete_files') === '1'

    const supabase = await createClient()
    const service = createServiceClient()

    // Load target grids
    let q = supabase
      .from('photo_grids')
      .select('id, site_id, site:sites(organization_id)')
      .order('created_at', { ascending: false })
    if (siteId) q = q.eq('site_id', siteId)
    const { data: grids, error } = await q
    if (error) {
      console.error('Cleanup load photo_grids error:', error)
      return NextResponse.json({ error: 'Failed to query photo_grids' }, { status: 500 })
    }
    const list = (grids || []).filter(g =>
      auth.isRestricted ? (g as any).site?.organization_id === auth.restrictedOrgId : true
    )
    const ids = list.map(g => g.id)

    // Load images for deletion plan
    const { data: images } = await supabase
      .from('photo_grid_images')
      .select('photo_grid_id, photo_url')
      .in('photo_grid_id', ids)

    const filePaths: string[] = []
    if (deleteFiles) {
      for (const img of images || []) {
        const urlStr = String((img as any).photo_url || '')
        // Expect public URL like .../object/public/documents/<path>
        const marker = '/object/public/documents/'
        const idx = urlStr.indexOf(marker)
        if (idx >= 0) {
          const path = urlStr.slice(idx + marker.length)
          if (path) filePaths.push(path)
        }
      }
    }

    if (dryRun) {
      return NextResponse.json({ success: true, targets: list.length, files: filePaths.length })
    }

    // Delete DB rows
    if (ids.length) {
      await supabase.from('photo_grid_images').delete().in('photo_grid_id', ids)
      await supabase.from('photo_grids').delete().in('id', ids)
    }

    // Delete storage objects
    if (deleteFiles && filePaths.length) {
      const { error: remErr } = await service.storage.from('documents').remove(filePaths)
      if (remErr) console.error('Storage remove error:', remErr)
    }

    return NextResponse.json({
      success: true,
      deleted: ids.length,
      files: deleteFiles ? filePaths.length : 0,
    })
  } catch (e) {
    console.error('POST /api/admin/cleanup/photo-grids error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
