import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { id } = params

    const role = authResult.role || ''

    // 문서 조회
    const { data: document, error: docError } = await supabase
      .from('unified_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      console.error('Document not found:', docError)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 권한 확인 - 공개 문서이거나 관리자이거나 소유자인 경우
    if (!document.is_public && role !== 'admin' && document.uploaded_by !== authResult.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // 스토리지에서 파일 다운로드
    const { data: fileData, error: fileError } = await supabase.storage
      .from('documents')
      .download(document.file_url)

    if (fileError) {
      console.error('File download error:', fileError)
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

    // 파일을 응답으로 반환
    const response = new NextResponse(fileData)
    
    // Content-Type 설정
    if (document.mime_type) {
      response.headers.set('Content-Type', document.mime_type)
    }
    
    // 파일명 설정 (다운로드용)
    if (document.file_name) {
      response.headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(document.file_name)}"`)
    }

    // 캐시 설정
    response.headers.set('Cache-Control', 'public, max-age=3600')

    return response

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
