import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
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
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photo grids:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/photo-grids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const supabase = await createClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Extract form data
    const site_id = formData.get('site_id') as string
    const component_name = formData.get('component_name') as string
    const work_process = formData.get('work_process') as string
    const work_section = formData.get('work_section') as string
    const work_date = formData.get('work_date') as string
    const beforePhoto = formData.get('before_photo') as File
    const afterPhoto = formData.get('after_photo') as File

    // Upload photos to storage
    let beforePhotoUrl = null
    let afterPhotoUrl = null

    if (beforePhoto) {
      const beforePhotoName = `${Date.now()}-before-${beforePhoto.name}`
      const { data: beforeUpload, error: beforeError } = await supabase.storage
        .from('photo-grids')
        .upload(beforePhotoName, beforePhoto)

      if (beforeError) {
        console.error('Error uploading before photo:', beforeError)
        return NextResponse.json({ error: 'Failed to upload before photo' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photo-grids')
        .getPublicUrl(beforePhotoName)
      
      beforePhotoUrl = publicUrl
    }

    if (afterPhoto) {
      const afterPhotoName = `${Date.now()}-after-${afterPhoto.name}`
      const { data: afterUpload, error: afterError } = await supabase.storage
        .from('photo-grids')
        .upload(afterPhotoName, afterPhoto)

      if (afterError) {
        console.error('Error uploading after photo:', afterError)
        return NextResponse.json({ error: 'Failed to upload after photo' }, { status: 500 })
      }

      const { data: { publicUrl } } = supabase.storage
        .from('photo-grids')
        .getPublicUrl(afterPhotoName)
      
      afterPhotoUrl = publicUrl
    }

    // Create photo grid record
    const { data, error } = await supabase
      .from('photo_grids')
      .insert({
        site_id,
        component_name,
        work_process,
        work_section,
        work_date,
        before_photo_url: beforePhotoUrl,
        after_photo_url: afterPhotoUrl,
        created_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating photo grid:', error)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // Generate PDF document and save to documents table
    try {
      // Create document record in documents table
      const { data: documentData, error: docError } = await supabase
        .from('documents')
        .insert({
          name: `사진대지_${component_name}_${work_process}_${work_date}`,
          type: 'photo_grid',
          content: JSON.stringify({
            photo_grid_id: data.id,
            site_id,
            component_name,
            work_process,
            work_section,
            work_date,
            before_photo_url: beforePhotoUrl,
            after_photo_url: afterPhotoUrl
          }),
          site_id,
          created_by: profile.id,
          status: 'active'
        })
        .select()
        .single()

      if (docError) {
        console.error('Error creating document:', docError)
        // Don't fail the entire operation if document creation fails
      }
    } catch (error) {
      console.error('Error in document creation:', error)
      // Don't fail the entire operation
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/photo-grids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}