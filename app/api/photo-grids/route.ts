import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAuthenticatedUser } from '@/lib/auth/session'

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
    
    const user = await getAuthenticatedUser()
    if (!user) {
      console.log('POST /api/photo-grids - Unauthorized user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile lookup error:', profileError)
      console.log('User ID:', user.id)
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

    console.log('Form data:', { 
      site_id, 
      component_name, 
      work_process, 
      work_section, 
      work_date,
      hasBeforePhoto: !!beforePhoto,
      hasAfterPhoto: !!afterPhoto
    })

    // Helper function to sanitize filename for Supabase storage
    const sanitizeFilename = (filename: string): string => {
      // Get file extension
      const ext = filename.split('.').pop() || 'jpg'
      // Remove all non-ASCII characters and spaces, keep only alphanumeric and basic punctuation
      const sanitized = filename
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, '') // Keep only safe characters
      
      // If filename becomes empty after sanitization, use a default
      if (!sanitized || sanitized === `.${ext}`) {
        return `photo.${ext}`
      }
      
      return sanitized
    }

    // Upload photos to storage
    let beforePhotoUrl = null
    let afterPhotoUrl = null

    if (beforePhoto && beforePhoto.size > 0) {
      const sanitizedName = sanitizeFilename(beforePhoto.name)
      const beforePhotoName = `${Date.now()}-before-${sanitizedName}`
      console.log('Uploading before photo:', beforePhotoName, 'Size:', beforePhoto.size)
      
      // Use service client for storage operations
      const { data: beforeUpload, error: beforeError } = await serviceClient.storage
        .from('photo-grids')
        .upload(beforePhotoName, beforePhoto)

      if (beforeError) {
        console.error('Error uploading before photo:', {
          error: beforeError,
          filename: beforePhotoName,
          size: beforePhoto.size,
          type: beforePhoto.type
        })
        return NextResponse.json({ 
          error: 'Failed to upload before photo',
          details: beforeError.message || beforeError
        }, { status: 500 })
      }

      const { data: { publicUrl } } = serviceClient.storage
        .from('photo-grids')
        .getPublicUrl(beforePhotoName)
      
      beforePhotoUrl = publicUrl
    }

    if (afterPhoto && afterPhoto.size > 0) {
      const sanitizedName = sanitizeFilename(afterPhoto.name)
      const afterPhotoName = `${Date.now()}-after-${sanitizedName}`
      console.log('Uploading after photo:', afterPhotoName, 'Size:', afterPhoto.size)
      
      // Use service client for storage operations
      const { data: afterUpload, error: afterError } = await serviceClient.storage
        .from('photo-grids')
        .upload(afterPhotoName, afterPhoto)

      if (afterError) {
        console.error('Error uploading after photo:', {
          error: afterError,
          filename: afterPhotoName,
          size: afterPhoto.size,
          type: afterPhoto.type
        })
        return NextResponse.json({ 
          error: 'Failed to upload after photo',
          details: afterError.message || afterError
        }, { status: 500 })
      }

      const { data: { publicUrl } } = serviceClient.storage
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

    console.log('Photo grid created successfully:', data.id)

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
      } else {
        console.log('Document created successfully:', documentData.id)
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

// Explicitly export all HTTP methods this route handles
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

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}