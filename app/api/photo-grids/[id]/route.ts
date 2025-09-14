import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

// Handle GET request for a specific photo grid
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
    
    const { data: photoGrid, error } = await supabase
      .from('photo_grids')
      .select(`
        *,
        site:sites(id, name, address),
        creator:profiles(id, full_name)
      `)
      .eq('id', params.id)
      .single()

    if (error || !photoGrid) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Fetch associated images
    const { data: images } = await supabase
      .from('photo_grid_images')
      .select('*')
      .eq('photo_grid_id', params.id)
      .order('photo_type', { ascending: true })
      .order('photo_order', { ascending: true })

    return NextResponse.json({
      success: true,
      data: {
        ...photoGrid,
        images: images || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/photo-grids/[id]:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

// Handle PUT request for updating a photo grid
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
    
    // Try to create service client for storage operations
    let serviceClient
    try {
      serviceClient = createServiceClient()
    } catch (serviceError) {
      serviceClient = supabase
    }

    // Extract form data
    const site_id = formData.get('site_id') as string
    const component_name = formData.get('component_name') as string
    const work_process = formData.get('work_process') as string
    const work_section = formData.get('work_section') as string
    const work_date = formData.get('work_date') as string
    
    // Get new photos
    const beforePhotos = formData.getAll('before_photos') as File[]
    const afterPhotos = formData.getAll('after_photos') as File[]
    const beforePhotoOrders = formData.getAll('before_photo_orders').map(Number)
    const afterPhotoOrders = formData.getAll('after_photo_orders').map(Number)
    
    // Get existing photos that should be kept
    const existingBeforeStr = formData.get('existing_before_photos') as string
    const existingAfterStr = formData.get('existing_after_photos') as string
    const existingBefore = existingBeforeStr ? JSON.parse(existingBeforeStr) : []
    const existingAfter = existingAfterStr ? JSON.parse(existingAfterStr) : []

    // Validate photo limits
    const totalBefore = beforePhotos.length + existingBefore.length
    const totalAfter = afterPhotos.length + existingAfter.length
    
    if (totalBefore > 3 || totalAfter > 3) {
      return NextResponse.json({ 
        error: '각 타입별 최대 3장까지 업로드 가능합니다.' 
      }, { status: 400 })
    }

    // Helper function to sanitize filename
    const sanitizeFilename = (filename: string): string => {
      const ext = filename.split('.').pop() || 'jpg'
      const sanitized = filename
        .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII chars
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '')
      
      if (!sanitized || sanitized === `.${ext}`) {
        return `photo.${ext}`
      }
      
      return sanitized
    }

    // Upload new photos
    const uploadedPhotos: { type: 'before' | 'after', url: string, order: number }[] = []

    // Upload new before photos
    for (let i = 0; i < beforePhotos.length; i++) {
      const file = beforePhotos[i]
      const order = beforePhotoOrders[i] || i
      
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const sanitizedName = sanitizeFilename(file.name)
      const fileName = `photo-grids/${Date.now()}_before_${order}_${sanitizedName}`

      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Failed to upload before photo: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = serviceClient.storage
        .from('documents')
        .getPublicUrl(fileName)

      uploadedPhotos.push({ type: 'before', url: publicUrl, order })
    }

    // Upload new after photos
    for (let i = 0; i < afterPhotos.length; i++) {
      const file = afterPhotos[i]
      const order = afterPhotoOrders[i] || i
      
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const sanitizedName = sanitizeFilename(file.name)
      const fileName = `photo-grids/${Date.now()}_after_${order}_${sanitizedName}`

      const { data: uploadData, error: uploadError } = await serviceClient.storage
        .from('documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw new Error(`Failed to upload after photo: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = serviceClient.storage
        .from('documents')
        .getPublicUrl(fileName)

      uploadedPhotos.push({ type: 'after', url: publicUrl, order })
    }

    // Update photo grid record
    const { data: photoGrid, error: updateError } = await supabase
      .from('photo_grids')
      .update({
        site_id,
        component_name,
        work_process,
        work_section,
        work_date,
        updated_at: new Date().toISOString(),
        // Update backward compatibility fields with first photos
        before_photo_url: uploadedPhotos.find(p => p.type === 'before' && p.order === 0)?.url || 
                         existingBefore.find((p: unknown) => p.order === 0)?.url || null,
        after_photo_url: uploadedPhotos.find(p => p.type === 'after' && p.order === 0)?.url || 
                        existingAfter.find((p: unknown) => p.order === 0)?.url || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating photo grid:', updateError)
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    // Delete existing images from photo_grid_images table
    await supabase
      .from('photo_grid_images')
      .delete()
      .eq('photo_grid_id', params.id)

    // Insert all photos (both new and existing) into photo_grid_images table
    const allPhotos = [
      ...uploadedPhotos,
      ...existingBefore.map((p: unknown) => ({ type: 'before' as const, url: p.url, order: p.order })),
      ...existingAfter.map((p: unknown) => ({ type: 'after' as const, url: p.url, order: p.order }))
    ]

    if (allPhotos.length > 0) {
      const photoImages = allPhotos.map(photo => ({
        photo_grid_id: params.id,
        photo_type: photo.type,
        photo_url: photo.url,
        photo_order: photo.order
      }))

      const { error: imagesError } = await supabase
        .from('photo_grid_images')
        .insert(photoImages)

      if (imagesError) {
        console.error('Error inserting photo grid images:', imagesError)
      }
    }

    return NextResponse.json({
      success: true,
      data: photoGrid
    })
  } catch (error) {
    console.error('Error in PUT /api/photo-grids/[id]:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update document'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
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
