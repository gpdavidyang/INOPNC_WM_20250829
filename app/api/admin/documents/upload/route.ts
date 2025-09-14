import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // FormData 파싱
    const formData = await request.formData()
    const file = formData.get('file') as File
    const siteId = formData.get('siteId') as string
    const documentType = formData.get('documentType') as string
    const categoryType = formData.get('categoryType') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file || !siteId || !documentType) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // 파일 업로드 경로 생성
    const timestamp = Date.now()
    const fileName = `${documentType}/${siteId}/${timestamp}_${file.name}`
    
    // Supabase Storage에 파일 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 })
    }

    // 파일 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)

    // 문서 정보를 통합 문서 테이블에 저장
    const { data: document, error: dbError } = await supabase
      .from('unified_documents')
      .insert({
        site_id: siteId,
        document_type: documentType,
        category_type: categoryType || 'shared',
        title: title || file.name,
        description: description || '',
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // 실패 시 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([fileName])
      return NextResponse.json({ error: '문서 정보 저장 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        file_url: publicUrl,
        document_type: documentType,
        title: document.title
      }
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json({ 
      error: '문서 업로드 중 오류가 발생했습니다',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
