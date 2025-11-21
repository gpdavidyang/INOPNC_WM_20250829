import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { COMPANY_DOC_SLUG_REGEX } from '@/lib/documents/company-types'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // 사용자 프로필 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, customer_company_id, full_name')
      .eq('id', authResult.userId)
      .single()

    let resolvedProfile = profile
    if (!resolvedProfile) {
      console.warn('[documents/upload] profile not found, using minimal fallback profile')
      resolvedProfile = {
        id: authResult.userId,
        role: authResult.role || 'admin',
        customer_company_id: null,
        full_name: authResult.email,
      } as typeof profile
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // 파일 크기 제한 (50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 })
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
      'text/plain',
    ]

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // 파일 이름에서 확장자 추출
    const fileName = file.name
    const fileExtension = fileName.split('.').pop()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')

    // 고유한 파일명 생성
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    const storagePath = `documents/${authResult.userId}/${uniqueFileName}`

    // 파일을 Supabase Storage에 업로드
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // 공용 URL 생성
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath)

    // 문서 메타데이터 추출
    const title = formData.get('title')?.toString() || fileName
    const description = formData.get('description')?.toString() || ''
    const categoryType = formData.get('categoryType')?.toString()
    const siteId = formData.get('siteId')?.toString() || null
    const tags = formData.get('tags')?.toString() || ''
    const rawCompanySlug = formData.get('companyDocSlug')?.toString().trim().toLowerCase()
    const companyDocSlug =
      rawCompanySlug && COMPANY_DOC_SLUG_REGEX.test(rawCompanySlug) ? rawCompanySlug : null
    const companyDocTypeId = formData.get('companyDocTypeId')?.toString() || null
    const tagList = tags
      ? tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      : []
    if (companyDocSlug) {
      const marker = `company_slug:${companyDocSlug}`
      if (!tagList.some(t => t === marker)) {
        tagList.push(marker)
      }
    }
    const documentMetadata: Record<string, any> = {
      storage_bucket: 'documents',
      storage_path: storagePath,
    }
    if (companyDocSlug) documentMetadata.company_slug = companyDocSlug
    if (companyDocTypeId) documentMetadata.company_doc_type_id = companyDocTypeId

    // unified_documents 테이블에 문서 정보 저장
    const documentData = {
      title,
      description,
      file_name: fileName,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.publicUrl,
      category_type: categoryType || 'shared',
      document_type: getDocumentType(file.type),
      site_id: siteId,
      customer_company_id:
        resolvedProfile.role === 'customer_manager' ? resolvedProfile.customer_company_id : null,
      uploaded_by: authResult.userId,
      profile_id: resolvedProfile.id,
      status: 'uploaded',
      workflow_status: 'draft',
      // 회사서류함(shared)은 전역 열람 가능해야 하므로 공개 처리
      is_public: (categoryType || 'shared') === 'shared',
      is_archived: false,
      access_level: 'role',
      tags: tagList,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: Object.keys(documentMetadata).length ? documentMetadata : null,
    }

    const insertDocument = async (
      payload: Record<string, any>,
      withRelations: boolean,
      fields?: string[]
    ) => {
      if (withRelations) {
        return supabase
          .from('unified_documents')
          .insert(payload)
          .select(
            `
          id,
          title,
          description,
          file_name,
          file_url,
          storage_path,
          category_type,
          document_type,
          site_id,
          customer_company_id,
          uploaded_by,
          status,
          created_at,
          updated_at,
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
        `
          )
          .single()
      }
      const selectFields = fields?.length
        ? fields.join(',')
        : 'id,title,description,file_name,file_url,category_type,document_type,site_id,customer_company_id,uploaded_by,status,created_at,updated_at'
      return supabase.from('unified_documents').insert(payload).select(selectFields).single()
    }

    const attemptInsert = async () => {
      const { data, error } = await insertDocument(documentData, true)
      if (!error) return { data }
      if (
        (error as any)?.code === 'PGRST204' ||
        String((error as any)?.message || '').includes('schema cache')
      ) {
        console.warn('[documents/upload] schema mismatch, retrying with fallback fields')
        const fallbackKeys: Array<keyof typeof documentData> = [
          'title',
          'description',
          'file_name',
          'file_url',
          'category_type',
          'document_type',
          'site_id',
          'customer_company_id',
          'uploaded_by',
          'profile_id',
          'tags',
          'is_public',
          'is_archived',
          'access_level',
          'workflow_status',
          'status',
          'created_at',
          'updated_at',
        ] as const
        const fallbackData = fallbackKeys.reduce(
          (acc, key) => {
            if (documentData[key] !== undefined) acc[key] = documentData[key]
            return acc
          },
          {} as Record<string, any>
        )
        const retry = await insertDocument(fallbackData, false, [
          'id',
          'title',
          'description',
          'file_name',
          'file_url',
          'category_type',
          'document_type',
          'site_id',
          'customer_company_id',
          'uploaded_by',
          'status',
          'created_at',
          'updated_at',
        ])
        if (!retry.error) return { data: retry.data }
        return { error: retry.error }
      }
      return { error }
    }

    const { data: document, error: dbError } = await attemptInsert()

    if (dbError) {
      console.error('Database insert error:', dbError)

      // 실패 시 업로드된 파일 삭제
      await supabase.storage.from('documents').remove([storagePath])

      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 })
    }

    // 문서 이력 기록
    await supabase.from('document_history').insert({
      document_id: document.id,
      action: 'uploaded',
      changed_by: authResult.userId,
      changes: { file_name: fileName, file_size: file.size },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      success: true,
      data: document,
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 파일 타입에 따른 문서 타입 결정
function getDocumentType(mimeType: string): string {
  if (mimeType.startsWith('image/')) {
    return 'drawing'
  }
  if (mimeType === 'application/pdf') {
    return 'report'
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'report'
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'report'
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'report'
  }
  return 'other'
}
