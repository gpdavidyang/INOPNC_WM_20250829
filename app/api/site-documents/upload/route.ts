import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const siteId = formData.get('siteId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !siteId || !documentType) {
      return NextResponse.json({ 
        error: '필수 필드가 누락되었습니다.' 
      }, { status: 400 })
    }

    // Validate document type
    if (!['ptw', 'blueprint', 'other'].includes(documentType)) {
      return NextResponse.json({ 
        error: '유효하지 않은 문서 타입입니다.' 
      }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: '파일 크기는 10MB를 초과할 수 없습니다.' 
      }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: '지원되지 않는 파일 형식입니다. PDF, JPG, PNG, GIF, WebP 파일만 업로드 가능합니다.' 
      }, { status: 400 })
    }

    // Verify site exists and user has access
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ 
        error: '현장을 찾을 수 없거나 접근 권한이 없습니다.' 
      }, { status: 403 })
    }

    // Create unique file name (sanitized to avoid Korean characters)
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown'
    const timestamp = Date.now()
    const uniqueId = randomUUID().substring(0, 8)
    const uniqueFileName = `${documentType}_${timestamp}_${uniqueId}.${fileExtension}`
    const storagePath = `site-documents/${siteId}/${documentType}/${uniqueFileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        duplex: 'half'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: '파일 업로드에 실패했습니다.' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path)

    // Create database record
    const { data: documentRecord, error: dbError } = await supabase
      .from('site_documents')
      .insert({
        site_id: siteId,
        document_type: documentType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        is_active: true,
        version: 1,
        notes: `Uploaded via admin interface on ${new Date().toLocaleDateString('ko-KR')}`
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([uploadData.path])
      
      return NextResponse.json({ 
        error: '문서 정보 저장에 실패했습니다.' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 업로드되었습니다.',
      data: {
        id: documentRecord.id,
        fileName: file.name,
        fileUrl: publicUrl,
        documentType,
        siteId
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
