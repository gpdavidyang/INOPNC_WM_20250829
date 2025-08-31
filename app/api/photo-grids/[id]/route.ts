import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

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
    
    const { data, error } = await supabase
      .from('photo_grids')
      .select(`
        *,
        site:sites(id, name),
        creator:profiles(id, full_name)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching photo grid:', error)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/photo-grids/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const supabase = await createClient()

    // Extract form data
    const site_id = formData.get('site_id') as string
    const component_name = formData.get('component_name') as string
    const work_process = formData.get('work_process') as string
    const work_section = formData.get('work_section') as string
    const work_date = formData.get('work_date') as string
    const beforePhoto = formData.get('before_photo') as File | null
    const afterPhoto = formData.get('after_photo') as File | null

    // Prepare update data
    const updateData: any = {
      site_id,
      component_name,
      work_process,
      work_section,
      work_date,
      updated_at: new Date().toISOString(),
    }

    // Upload new photos if provided
    if (beforePhoto && beforePhoto.size > 0) {
      const beforePhotoName = `${Date.now()}-before-${beforePhoto.name}`
      const { data: beforeUpload, error: beforeError } = await supabase.storage
        .from('photo-grids')
        .upload(beforePhotoName, beforePhoto)

      if (!beforeError) {
        const { data: { publicUrl } } = supabase.storage
          .from('photo-grids')
          .getPublicUrl(beforePhotoName)
        
        updateData.before_photo_url = publicUrl
      }
    }

    if (afterPhoto && afterPhoto.size > 0) {
      const afterPhotoName = `${Date.now()}-after-${afterPhoto.name}`
      const { data: afterUpload, error: afterError } = await supabase.storage
        .from('photo-grids')
        .upload(afterPhotoName, afterPhoto)

      if (!afterError) {
        const { data: { publicUrl } } = supabase.storage
          .from('photo-grids')
          .getPublicUrl(afterPhotoName)
        
        updateData.after_photo_url = publicUrl
      }
    }

    // Update photo grid record
    const { data, error } = await supabase
      .from('photo_grids')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating photo grid:', error)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/photo-grids/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get the photo grid first to delete associated files
    const { data: photoGrid } = await supabase
      .from('photo_grids')
      .select('before_photo_url, after_photo_url')
      .eq('id', params.id)
      .single()

    // Delete from database
    const { error } = await supabase
      .from('photo_grids')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting photo grid:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // TODO: Delete associated files from storage if needed

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/photo-grids/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}