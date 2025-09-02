import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/types/shared-documents'

// Configure API route
export const runtime = 'nodejs'
export const maxDuration = 30
import { 
  validateFile, 
  generateSecurityMetadata,
  sanitizeFilename,
  DEFAULT_FILE_VALIDATION_OPTIONS,
  type FileValidationOptions
} from '@/lib/file-validation'

// GET /api/shared-documents - 문서 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const site_id = searchParams.get('site_id')
    const category = searchParams.get('category')
    const file_type = searchParams.get('file_type')
    const uploaded_by = searchParams.get('uploaded_by')
    const organization_id = searchParams.get('organization_id')
    const search = searchParams.get('search')
    const sort_field = searchParams.get('sort_field') || 'created_at'
    const sort_direction = searchParams.get('sort_direction') || 'desc'
    const date_from = searchParams.get('date_from')
    const date_to = searchParams.get('date_to')

    const offset = (page - 1) * limit

    let query = supabase
      .from('photo_grids')
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (site_id) query = query.eq('site_id', site_id)
    if (category) query = query.eq('category', category)
    if (file_type) query = query.eq('file_type', file_type)
    if (uploaded_by) query = query.eq('uploaded_by', uploaded_by)
    if (organization_id) query = query.eq('organization_id', organization_id)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,file_name.ilike.%${search}%`)
    }
    if (date_from) query = query.gte('created_at', date_from)
    if (date_to) query = query.lte('created_at', date_to)

    // Apply sorting
    const ascending = sort_direction === 'asc'
    query = query.order(sort_field, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: documents, error, count } = await query

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({
      documents: documents || [],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/shared-documents - 문서 업로드
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const site_id = formData.get('site_id') as string
    const organization_id = formData.get('organization_id') as string
    const category = formData.get('category') as string
    const tags = formData.get('tags') as string

    // Validate required fields
    if (!file || !title) {
      return NextResponse.json({ 
        error: 'File and title are required' 
      }, { status: 400 })
    }

    // Enhanced file validation with security checks
    const validationOptions: FileValidationOptions = {
      ...DEFAULT_FILE_VALIDATION_OPTIONS,
      maxFileSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_MIME_TYPES
    }

    const validationResult = await validateFile(file, validationOptions)
    
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ')
      return NextResponse.json({ 
        error: `File validation failed: ${errorMessages}`,
        validationErrors: validationResult.errors,
        validationWarnings: validationResult.warnings
      }, { status: 400 })
    }

    // Log security warnings if any
    if (validationResult.warnings.length > 0) {
      console.warn('File validation warnings:', {
        filename: file.name,
        warnings: validationResult.warnings,
        securityFlags: validationResult.securityFlags
      })
    }

    // Block suspicious files even if they pass basic validation
    if (validationResult.securityFlags.isSuspicious && !validationResult.securityFlags.passedSecurityScan) {
      return NextResponse.json({ 
        error: 'File blocked due to security concerns',
        securityFlags: validationResult.securityFlags
      }, { status: 403 })
    }

    // Generate secure file path with sanitized filename
    const sanitizedName = sanitizeFilename(file.name)
    const fileExt = sanitizedName.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const filePath = `shared-documents/${user.id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 })
    }

    // Get file URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Generate security metadata
    const securityMetadata = generateSecurityMetadata(file, validationResult)

    // Create document record with security metadata
    const documentData = {
      title,
      description: description || null,
      file_url: urlData.publicUrl,
      file_name: file.name,
      file_type: fileExt?.toLowerCase() || 'unknown',
      file_size: file.size,
      mime_type: file.type,
      site_id: site_id || null,
      organization_id: organization_id || null,
      category: category || null,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      uploaded_by: user.id,
      security_metadata: securityMetadata,
      is_secure: validationResult.securityFlags.passedSecurityScan && 
                 validationResult.securityFlags.hasValidSignature &&
                 !validationResult.securityFlags.isSuspicious
    }

    const { data: document, error: docError } = await supabase
      .from('photo_grids')
      .insert({
        title,
        description: description || null,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: fileExt?.toLowerCase() || 'unknown',
        file_size: file.size,
        mime_type: file.type,
        site_id: site_id || null,
        organization_id: organization_id || null,
        category: category || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        uploaded_by: user.id,
        is_active: true,
        grid_data: null,
        metadata: {
          security: securityMetadata,
          is_secure: validationResult.securityFlags.passedSecurityScan && 
                     validationResult.securityFlags.hasValidSignature &&
                     !validationResult.securityFlags.isSuspicious
        }
      })
      .select()
      .single()

    if (docError) {
      console.error('Document creation error:', docError)
      
      // Clean up uploaded file if document creation fails
      await supabase.storage.from('documents').remove([filePath])
      
      return NextResponse.json({ 
        error: 'Failed to create document record' 
      }, { status: 500 })
    }

    // Log upload action (commented out - table doesn't exist)
    // await supabase.from('document_access_logs').insert({
    //   document_id: document.id,
    //   user_id: user.id,
    //   action: 'upload',
    //   details: {
    //     file_name: file.name,
    //     file_size: file.size,
    //     file_type: file.type
    //   }
    // })

    return NextResponse.json({ 
      document,
      message: 'Document uploaded successfully' 
    }, { status: 201 })

  } catch (error) {
    console.error('Upload API Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}