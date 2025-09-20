import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

// 정적 생성 오류 해결을 위한 dynamic 설정
export const dynamic = 'force-dynamic'

// Vercel configuration for larger file uploads
export const maxDuration = 30 // Maximum function duration in seconds
export const runtime = 'nodejs' // Use Node.js runtime for better Buffer support

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const documentType = searchParams.get('type') || 'personal'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const siteId = searchParams.get('site_id')

    const offset = (page - 1) * limit

    // 현재 사용자 확인
    let query = supabase.from('documents').select(`
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
      query = query.eq('owner_id', authResult.userId).eq('is_public', false)
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
    let countQuery = supabase.from('documents').select('*', { count: 'exact', head: true })

    if (documentType === 'personal') {
      countQuery = countQuery.eq('owner_id', authResult.userId).eq('is_public', false)
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
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 안전한 파일명 생성 함수 (Storage 호환)
function generateSafeFileName(originalName: string): string {
  // 파일 확장자 분리
  const lastDotIndex = originalName.lastIndexOf('.')
  const extension = lastDotIndex > -1 ? originalName.slice(lastDotIndex) : ''
  const nameWithoutExt = lastDotIndex > -1 ? originalName.slice(0, lastDotIndex) : originalName

  // Supabase Storage는 ASCII 문자만 지원하므로 한글을 제거하고 영문/숫자만 유지
  // 한글은 원본 파일명(title)에 보존됨
  let safeName = nameWithoutExt
    .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, '') // 한글 제거
    .replace(/\s+/g, '_') // 공백을 언더스코어로
    .replace(/[^a-zA-Z0-9._-]/g, '') // 영문, 숫자, 일부 특수문자만 허용
    .replace(/_{2,}/g, '_') // 연속된 언더스코어를 하나로
    .replace(/^[_.-]+|[_.-]+$/g, '') // 시작과 끝의 특수문자 제거

  // 파일명이 비어있으면 기본값 사용
  if (!safeName || safeName.length === 0) {
    safeName = 'document'
  }

  // 파일명 길이 제한 (확장자 제외 50자)
  if (safeName.length > 50) {
    safeName = safeName.substring(0, 50)
  }

  // 타임스탬프와 랜덤 문자열 추가하여 고유성 보장
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 8)

  return `${timestamp}_${randomStr}_${safeName}${extension}`
}

export async function POST(request: NextRequest) {
  console.log('📤 Document upload API called')
  console.log('📤 Environment:', process.env.NODE_ENV)
  console.log('📤 Vercel env:', process.env.VERCEL_ENV)
  console.log('📤 Request headers:', Object.fromEntries(request.headers.entries()))

  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const userId = authResult.userId
    console.log('✅ User authenticated:', userId)

    // Get user's site information
    const { data: profile } = await supabase
      .from('profiles')
      .select('site_id')
      .eq('id', userId)
      .single()

    console.log('📍 User profile site_id:', profile?.site_id)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const uploadedBy = formData.get('uploadedBy') as string
    const documentType = formData.get('documentType') as string
    const isRequired = formData.get('isRequired') === 'true'
    const requirementId = formData.get('requirementId') as string

    console.log('📋 Form data received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      category,
      uploadedBy,
      documentType,
      isRequired,
      requirementId,
    })

    if (!file) {
      console.error('❌ No file provided in request')
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 파일을 Buffer로 변환 - Vercel compatibility fix
    console.log('🔄 Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    // Use Uint8Array directly for better Vercel compatibility
    const buffer = new Uint8Array(bytes)
    console.log('✅ File converted to buffer, size:', buffer.length)

    // 안전한 파일명 생성 (한글 포함)
    let fileName = generateSafeFileName(file.name)
    let filePath = `documents/${userId}/${fileName}`
    console.log('📁 Original filename:', file.name)
    console.log('📁 Safe filename:', fileName)
    console.log('📁 Uploading to path:', filePath)
    console.log('📁 User ID for path:', userId)
    console.log('📁 Buffer type:', buffer.constructor.name)
    console.log('📁 Buffer size:', buffer.byteLength || buffer.length)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        duplex: 'half', // Add duplex mode for better streaming support
      })

    if (uploadError) {
      console.error('❌ Supabase Storage upload error:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: (uploadError as unknown).statusCode,
        filePath: filePath,
        fileSize: buffer.length,
        fileType: file.type,
      })

      // Check if it's a duplicate file error
      if (uploadError.message?.includes('already exists')) {
        // Try with a different filename (regenerate with new timestamp)
        const uniqueFileName = generateSafeFileName(file.name)
        const uniqueFilePath = `documents/${userId}/${uniqueFileName}`

        console.log('🔄 Retrying with unique filename:', uniqueFileName)
        console.log('🔄 Retry path:', uniqueFilePath)

        const { data: retryData, error: retryError } = await supabase.storage
          .from('documents')
          .upload(uniqueFilePath, buffer, {
            contentType: file.type,
            upsert: false,
            duplex: 'half', // Add duplex mode for better streaming support
          })

        if (retryError) {
          console.error('❌ Retry upload also failed:', retryError)
          return NextResponse.json(
            {
              error: 'Failed to upload file to storage',
              details: retryError.message || retryError,
            },
            { status: 500 }
          )
        }

        // Update filePath for database insert
        Object.assign(uploadData || {}, retryData)
        filePath = uniqueFilePath
        fileName = uniqueFileName
      } else {
        return NextResponse.json(
          {
            error: 'Failed to upload file to storage',
            details: uploadError.message || uploadError,
          },
          { status: 500 }
        )
      }
    }

    // 파일 URL 생성
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath)

    // 데이터베이스에 문서 정보 저장
    const { data: documentData, error: dbError } = await supabase
      .from('documents')
      .insert([
        {
          title: file.name, // 원본 파일명 유지 (사용자가 보는 이름)
          file_name: fileName, // 실제 저장된 파일명 (안전한 파일명)
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          document_type: documentType || 'other',
          folder_path: filePath,
          owner_id: userId,
          site_id: profile?.site_id || null,
          is_public: formData.get('isPublic') === 'true' || false,
          description: (formData.get('description') as string) || `업로드된 파일: ${file.name}`,
        },
      ])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error when saving document:', {
        error: dbError,
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint,
      })
      console.error('❌ Document data that failed to insert:', {
        title: file.name,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType || 'other',
        folder_path: filePath,
        owner_id: userId,
        site_id: profile?.site_id || null,
        is_public: formData.get('isPublic') === 'true' || false,
        description: (formData.get('description') as string) || `업로드된 파일: ${file.name}`,
      })
      // 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json(
        {
          error: 'Failed to save document info',
          details: dbError.message || dbError,
          dbError: dbError,
        },
        { status: 500 }
      )
    }

    // If this is a required document, also save to unified_document_system
    if (isRequired && requirementId && documentData) {
      console.log('📝 Saving to unified_document_system for required document')

      // Get requirement details
      const { data: requirement } = await supabase
        .from('document_requirements')
        .select('requirement_name, document_type')
        .eq('id', requirementId)
        .single()

      if (requirement) {
        const { error: unifiedError } = await supabase.from('unified_document_system').insert([
          {
            title: requirement.requirement_name || file.name,
            description: `필수 제출 서류: ${requirement.requirement_name}`,
            file_name: fileName,
            file_size: file.size,
            file_url: urlData.publicUrl,
            mime_type: file.type,
            category_type: 'required_user_docs',
            sub_category: requirement.document_type,
            tags: [requirement.document_type],
            uploaded_by: userId,
            site_id: profile?.site_id || null,
            status: 'uploaded',
          },
        ])

        if (unifiedError) {
          console.error('❌ Failed to save to unified_document_system:', {
            error: unifiedError,
            message: unifiedError.message,
            code: unifiedError.code,
            details: unifiedError.details,
            hint: unifiedError.hint,
          })
          // Don't fail the whole request - just log the error
        } else {
          console.log('✅ Successfully saved to unified_document_system')
        }
      }
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
        isPublic: documentData.is_public,
      },
    })
  } catch (error) {
    console.error('❌ Upload API critical error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
      details: JSON.stringify(error),
    })

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document id is required' }, { status: 400 })
    }

    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_url, owner_id, is_public')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (document.owner_id !== authResult.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase.from('documents').delete().eq('id', documentId)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    if (document.file_url) {
      const parts = document.file_url.split('/storage/v1/object/public/documents/')
      if (parts.length > 1) {
        await supabase.storage.from('documents').remove([parts[1]])
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
