import { getAuthenticatedUser } from "@/lib/auth/server"
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
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
