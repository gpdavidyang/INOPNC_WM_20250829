import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const auth = authResult

    const { data: photoGrid, error: gridError } = await supabase
      .from('photo_grids')
      .select('site:sites(organization_id)')
      .eq('id', params.id)
      .single()

    if (gridError || !photoGrid) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (auth.isRestricted && !(await canAccessData(auth, photoGrid.site?.organization_id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get images for the photo grid
    const { data: images, error } = await supabase
      .from('photo_grid_images')
      .select('*')
      .eq('photo_grid_id', params.id)
      .order('photo_type', { ascending: true })
      .order('photo_order', { ascending: true })

    if (error) {
      console.error('Error fetching photo grid images:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    return NextResponse.json(images || [])
  } catch (error) {
    console.error('Error in GET /api/photo-grids/[id]/images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}
