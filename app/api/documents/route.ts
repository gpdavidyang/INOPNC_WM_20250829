import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 정적 생성 오류 해결을 위한 dynamic 설정
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
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
  console.log('📤 Document upload API called')
  try {
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ User authenticated:', user.id)

    // Get user's site information
    const { data: profile } = await supabase
      .from('profiles')
      .select('site_id')
      .eq('id', user.id)
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
      requirementId
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // 파일을 Buffer로 변환
    console.log('🔄 Converting file to buffer...')
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('✅ File converted to buffer, size:', buffer.length)

    // Supabase Storage에 파일 업로드
    let fileName = `${Date.now()}-${file.name}`
    let filePath = `documents/${user.id}/${fileName}`
    console.log('📁 Uploading to path:', filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Supabase Storage upload error:', {
        error: uploadError,
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        filePath: filePath,
        fileSize: buffer.length,
        fileType: file.type
      })
      
      // Check if it's a duplicate file error
      if (uploadError.message?.includes('already exists')) {
        // Try with a different filename
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
        const uniqueFilePath = `documents/${user.id}/${uniqueFileName}`
        
        console.log('🔄 Retrying with unique filename:', uniqueFilePath)
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('documents')
          .upload(uniqueFilePath, buffer, {
            contentType: file.type,
            upsert: false
          })
        
        if (retryError) {
          console.error('❌ Retry upload also failed:', retryError)
          return NextResponse.json({ 
            error: 'Failed to upload file to storage', 
            details: retryError.message || retryError 
          }, { status: 500 })
        }
        
        // Update filePath for database insert
        Object.assign(uploadData || {}, retryData)
        filePath = uniqueFilePath
        fileName = uniqueFileName
      } else {
        return NextResponse.json({ 
          error: 'Failed to upload file to storage', 
          details: uploadError.message || uploadError 
        }, { status: 500 })
      }
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
          site_id: profile?.site_id || null,
          is_public: false,
          description: `업로드된 파일: ${file.name}`
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database error when saving document:', {
        error: dbError,
        message: dbError.message,
        code: dbError.code,
        details: dbError.details,
        hint: dbError.hint
      })
      console.error('❌ Document data that failed to insert:', {
        title: file.name,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        document_type: documentType || 'general',
        folder_path: filePath,
        owner_id: user.id,
        site_id: profile?.site_id || null,
        is_public: false,
        description: `업로드된 파일: ${file.name}`
      })
      // 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ 
        error: 'Failed to save document info', 
        details: dbError.message || dbError,
        dbError: dbError
      }, { status: 500 })
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
        const { error: unifiedError } = await supabase
          .from('unified_document_system')
          .insert([
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
              uploaded_by: user.id,
              site_id: profile?.site_id || null,
              status: 'uploaded'
            }
          ])

        if (unifiedError) {
          console.error('❌ Failed to save to unified_document_system:', {
            error: unifiedError,
            message: unifiedError.message,
            code: unifiedError.code,
            details: unifiedError.details,
            hint: unifiedError.hint
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