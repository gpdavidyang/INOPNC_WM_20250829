
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 사용자 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id, full_name')
      .eq('id', user.id)
      .single()
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    
    // 파일 크기 제한 (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }
    
    // 허용된 파일 타입 확인
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain'
    ]
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }
    
    // 파일 이름에서 확장자 추출
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    
    // 고유한 파일명 생성
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    const storagePath = `documents/${user.id}/${uniqueFileName}`
    
    // 파일을 Supabase Storage에 업로드
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }
    
    // 공용 URL 생성
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(storagePath)
    
    // 문서 메타데이터 추출
    const title = formData.get('title')?.toString() || fileName
    const description = formData.get('description')?.toString() || ''
    const categoryType = formData.get('categoryType')?.toString()
    const siteId = formData.get('siteId')?.toString() || null
    const tags = formData.get('tags')?.toString() || ''
    
    // unified_documents 테이블에 문서 정보 저장
    const documentData = {
      title,
      description,
      file_name: fileName,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      category_type: categoryType || 'shared',
      document_type: getDocumentType(file.type),
      site_id: siteId,
      customer_company_id: profile.role === 'customer_manager' ? profile.customer_company_id : null,
      uploaded_by: user.id,
      status: 'active',
      workflow_status: 'draft',
      is_public: false,
      is_archived: false,
      access_level: 'role',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: document, error: dbError } = await supabase
      .from('unified_documents')
      .insert(documentData)
      .select(`
        *,
        uploader:uploaded_by (
          id,
          full_name,
          email,
          role
        ),
        site:site_id (
          id,
          name
        ),
        customer_company:customer_company_id (
          id,
          name
        )
      `)
      .single()
    
    if (dbError) {
      console.error('Database insert error:', dbError)
      
      // 실패 시 업로드된 파일 삭제
      await supabase.storage
        .from('documents')
        .remove([storagePath])
      
      return NextResponse.json(
        { error: 'Failed to save document metadata' },
        { status: 500 }
      )
    }
    
    // 문서 이력 기록
    await supabase
      .from('document_history')
      .insert({
        document_id: document.id,
        action: 'uploaded',
        changed_by: user.id,
        changes: { file_name: fileName, file_size: file.size },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      })
    
    return NextResponse.json({
      success: true,
      data: document,
      message: 'File uploaded successfully'
    })
    
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 파일 타입에 따른 문서 타입 결정
function getDocumentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'image'
  }
  if (mimeType === 'application/pdf') {
    return 'pdf'
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'document'
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'spreadsheet'
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation'
  }
  return 'other'
}