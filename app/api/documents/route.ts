import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 정적 생성 오류 해결을 위한 dynamic 설정
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const documentType = searchParams.get('type') || 'personal'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const siteId = searchParams.get('site_id')
    
    const offset = (page - 1) * limit

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('documents')
      .select(`
        *,
        owner:owner_id (
          id,
          full_name,
          email,
          role
        ),
        site:site_id (
          id,
          name,
          address,
          status
        )
      `)

    // 문서 타입별 필터링
    if (documentType === 'personal') {
      query = query.eq('owner_id', user.id).eq('is_public', false)
    } else if (documentType === 'shared') {
      query = query.eq('is_public', true)
    }

    // 현장별 필터링
    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    // 검색 기능
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // 정렬 및 페이징
    const { data: documents, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // 전체 카운트 조회
    let countQuery = supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })

    if (documentType === 'personal') {
      countQuery = countQuery.eq('owner_id', user.id).eq('is_public', false)
    } else if (documentType === 'shared') {
      countQuery = countQuery.eq('is_public', true)
    }

    if (siteId) {
      countQuery = countQuery.eq('site_id', siteId)
    }

    if (search) {
      countQuery = countQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count query error:', countError)
    }

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const uploadedBy = formData.get('uploadedBy') as string
    const documentType = formData.get('documentType') as string
    const isRequired = formData.get('isRequired') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 })
    }

    // 파일 타입 검증
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 파일을 Buffer로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Supabase Storage에 파일 업로드
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `documents/${user.id}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // 파일 URL 생성
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // 데이터베이스에 문서 정보 저장
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          title: file.name,
          file_name: fileName,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType || 'general',
          folder_path: filePath,
          owner_id: user.id,
          is_public: false,
          description: `업로드된 파일: ${file.name}`
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Failed to save document info' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: documentData.id,
        name: documentData.title,
        type: documentData.mime_type,
        size: documentData.file_size,
        uploadedAt: documentData.created_at,
        uploadedBy: uploadedBy,
        url: documentData.file_url,
        documentType: documentData.document_type,
        description: documentData.description,
        fileName: documentData.file_name,
        isPublic: documentData.is_public
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}