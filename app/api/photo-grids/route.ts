import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, canAccessData } from '@/lib/auth/ultra-simple'
import { createServiceClient } from '@/lib/supabase/service'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

// Handle POST request for creating new photo grids
export async function POST(request: NextRequest) {
  console.log('POST /api/photo-grids - Request received')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)

  // Strip query parameters from the URL for proper routing
  const url = new URL(request.url)
  console.log('Path:', url.pathname)
  console.log('Query params:', url.search)

  try {
    // Log request headers for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))

    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const auth = authResult

    const formData = await request.formData()
    const supabase = await createClient()

    // Try to create service client for storage operations
    let serviceClient
    try {
      serviceClient = createServiceClient()
      console.log('Service client created successfully')
    } catch (serviceError) {
      console.error('Failed to create service client:', serviceError)
      // Fall back to regular client if service client fails
      serviceClient = supabase
      console.log('Falling back to regular client for storage')
    }

    // Get user profile - profiles.id matches auth.users.id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', auth.userId)
      .single()

    if (profileError || !profile) {
      console.log('Profile lookup error:', profileError)
      console.log('User ID:', auth.userId)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Extract form data
    const site_id = formData.get('site_id') as string
    const component_name = formData.get('component_name') as string
    const work_process = formData.get('work_process') as string
    const work_section = formData.get('work_section') as string
    const work_date = formData.get('work_date') as string

    // Get multiple photos (file uploads)
    const beforePhotos = formData.getAll('before_photos') as File[]
    const afterPhotos = formData.getAll('after_photos') as File[]
    const beforePhotoOrders = formData.getAll('before_photo_orders').map(Number)
    const afterPhotoOrders = formData.getAll('after_photo_orders').map(Number)

    // Alternate input: existing URLs from daily report
    const dailyReportId = (formData.get('daily_report_id') as string) || ''
    const beforePhotoUrls = formData.getAll('before_photo_urls').map(String).filter(Boolean)
    const afterPhotoUrls = formData.getAll('after_photo_urls').map(String).filter(Boolean)

    console.log('Form data:', {
      site_id,
      component_name,
      work_process,
      work_section,
      work_date,
      beforePhotosCount: beforePhotos.length,
      afterPhotosCount: afterPhotos.length,
    })

    if (auth.isRestricted) {
      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('organization_id')
        .eq('id', site_id)
        .single()

      if (siteError || !site) {
        console.error('Site lookup error for restricted user:', siteError)
        return NextResponse.json({ error: 'Invalid site' }, { status: 400 })
      }

      if (!(await canAccessData(auth, site.organization_id))) {
        console.warn('Restricted user attempted to access foreign site', {
          userId: auth.userId,
          siteId: site_id,
          siteOrg: site.organization_id,
          restrictedOrg: auth.restrictedOrgId,
        })

        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Validate photo limits (files or urls)
    if (
      beforePhotos.length > 3 ||
      afterPhotos.length > 3 ||
      beforePhotoUrls.length > 3 ||
      afterPhotoUrls.length > 3
    ) {
      return NextResponse.json(
        {
          error: '각 타입별 최대 3장까지 업로드 가능합니다.',
        },
        { status: 400 }
      )
    }

    // Helper function to sanitize filename for Supabase storage
    const sanitizeFilename = (filename: string): string => {
      // Get file extension
      const ext = filename.split('.').pop() || 'jpg'
      // Remove all non-ASCII characters and spaces, keep only alphanumeric and basic punctuation
      const sanitized = filename
        .replace(/[^\x20-\x7E]/g, '') // Remove non-printable ASCII chars
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Keep only safe characters

      // If filename becomes empty after sanitization, use a default
      if (!sanitized || sanitized === `.${ext}`) {
        return `photo.${ext}`
      }

      return sanitized
    }

    // Collect photo URLs either from uploaded files or provided URLs
    const uploadedPhotos: { type: 'before' | 'after'; url: string; order: number }[] = []

    if (beforePhotoUrls.length || afterPhotoUrls.length) {
      // Use provided URLs directly
      for (let i = 0; i < beforePhotoUrls.length; i++) {
        const url = String(beforePhotoUrls[i])
        if (!url) continue
        uploadedPhotos.push({ type: 'before', url, order: i })
      }
      for (let i = 0; i < afterPhotoUrls.length; i++) {
        const url = String(afterPhotoUrls[i])
        if (!url) continue
        uploadedPhotos.push({ type: 'after', url, order: i })
      }
    } else {
      // Upload files to storage and collect public URLs
      for (let i = 0; i < beforePhotos.length; i++) {
        const file = beforePhotos[i]
        const order = beforePhotoOrders[i] || i
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const sanitizedName = sanitizeFilename(file.name)
        const fileName = `photo-grids/${Date.now()}_before_${order}_${sanitizedName}`

        const { error: uploadError } = await serviceClient.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })
        if (uploadError) {
          throw new Error(`Failed to upload before photo ${i + 1}: ${uploadError.message}`)
        }
        const {
          data: { publicUrl },
        } = serviceClient.storage.from('documents').getPublicUrl(fileName)
        uploadedPhotos.push({ type: 'before', url: publicUrl, order })
      }

      for (let i = 0; i < afterPhotos.length; i++) {
        const file = afterPhotos[i]
        const order = afterPhotoOrders[i] || i
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const sanitizedName = sanitizeFilename(file.name)
        const fileName = `photo-grids/${Date.now()}_after_${order}_${sanitizedName}`
        const { error: uploadError } = await serviceClient.storage
          .from('documents')
          .upload(fileName, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false,
          })
        if (uploadError) {
          throw new Error(`Failed to upload after photo ${i + 1}: ${uploadError.message}`)
        }
        const {
          data: { publicUrl },
        } = serviceClient.storage.from('documents').getPublicUrl(fileName)
        uploadedPhotos.push({ type: 'after', url: publicUrl, order })
      }
    }

    // Create photo grid record in database
    const { data: photoGrid, error: insertError } = await supabase
      .from('photo_grids')
      .insert({
        site_id,
        component_name,
        work_process,
        work_section,
        work_date: work_date || new Date().toISOString().split('T')[0],
        created_by: auth.userId,
        // Keep backward compatibility - store first photos in original columns
        before_photo_url:
          uploadedPhotos.find(p => p.type === 'before' && p.order === 0)?.url || null,
        after_photo_url: uploadedPhotos.find(p => p.type === 'after' && p.order === 0)?.url || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting photo grid:', insertError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // Insert all photos into photo_grid_images table
    if (uploadedPhotos.length > 0) {
      const photoImages = uploadedPhotos.map(photo => ({
        photo_grid_id: photoGrid.id,
        photo_type: photo.type,
        photo_url: photo.url,
        photo_order: photo.order,
      }))

      const { error: imagesError } = await supabase.from('photo_grid_images').insert(photoImages)

      if (imagesError) {
        console.error('Error inserting photo grid images:', imagesError)
        // Don't fail the whole operation, but log the error
      }
    }

    console.log('Photo grid created successfully:', photoGrid.id)

    return NextResponse.json({
      success: true,
      data: photoGrid,
    })
  } catch (error) {
    console.error('Error in POST /api/photo-grids:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create document'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Handle GET request for fetching photo grids
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const auth = authResult

    // Get photo grids with related data
    const { data: photoGrids, error } = await supabase
      .from('photo_grids')
      .select(
        `
        *,
        site:sites(id, name, address, organization_id),
        creator:profiles(id, full_name)
      `
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photo grids:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // For each photo grid, fetch associated images from photo_grid_images table
    const scopedGrids = auth.isRestricted
      ? photoGrids.filter(grid => grid.site?.organization_id === auth.restrictedOrgId)
      : photoGrids

    const photoGridsWithImages = await Promise.all(
      scopedGrids.map(async (grid: any) => {
        const { data: images } = await supabase
          .from('photo_grid_images')
          .select('*')
          .eq('photo_grid_id', grid.id)
          .order('photo_order', { ascending: true })

        return {
          ...grid,
          images: images || [],
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: photoGridsWithImages,
    })
  } catch (error) {
    console.error('Error in GET /api/photo-grids:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}
