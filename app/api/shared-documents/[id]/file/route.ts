import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First try to find in documents table (for site documents including blueprint/PTW)
    let document: any = null
    let storageBucket = 'user-documents'
    let filePath = ''
    
    // Try documents table first (for site documents)
    const { data: siteDoc, error: siteDocError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (siteDoc && !siteDocError) {
      // Found in documents table
      document = siteDoc
      storageBucket = 'documents' // site documents use 'documents' bucket
      
      // Check if file_url is a full URL or storage path
      if (siteDoc.file_url) {
        if (siteDoc.file_url.startsWith('http')) {
          // It's a full URL, redirect to it
          return NextResponse.redirect(siteDoc.file_url)
        } else if (siteDoc.file_url.startsWith('/')) {
          // It's a local path like /docs/PTW.pdf - serve it as a static file
          const staticUrl = `${request.nextUrl.origin}${siteDoc.file_url}`
          return NextResponse.redirect(staticUrl)
        }
      }
      filePath = siteDoc.file_url || siteDoc.file_path || ''
    } else {
      // Try shared documents system
      const { data: sharedDoc, error: sharedDocError } = await supabase
        .from('v_shared_documents_with_permissions')
        .select('*')
        .eq('id', params.id)
        .eq('is_deleted', false)
        .single()

      if (sharedDocError || !sharedDoc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      // Check permissions for shared documents
      const hasPermission = await supabase.rpc('check_document_permission', {
        p_document_id: params.id,
        p_user_id: user.id,
        p_permission_type: 'view'
      } as any)

      if (!hasPermission.data) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }
      
      document = sharedDoc
      storageBucket = 'user-documents'
      filePath = sharedDoc.file_path
    }

    // Supabase Storage에서 파일 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(storageBucket)
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError)
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    // MIME 타입 결정
    const filename = document.file_name || document.filename || filePath.split('/').pop() || ''
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'dwg': 'application/dwg',
      'dxf': 'application/dxf',
      'txt': 'text/plain'
    }
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 액세스 로그 남기기
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: user.id,
      action: 'view_file'
    })

    // 응답 생성
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
      }
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}