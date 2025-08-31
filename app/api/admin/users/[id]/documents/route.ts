import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const REQUIRED_DOCUMENTS = [
  'medical_checkup', // 배치전 검진 결과서
  'safety_education', // 기초안전보건교육이수증
  'vehicle_insurance', // 차량 보험증
  'vehicle_registration', // 차량등록증
  'payroll_stub', // 통장 사본
  'id_card', // 신분증 사본
  'senior_documents' // 고령자 서류
]

const DOCUMENT_LABELS = {
  'medical_checkup': '배치전 검진 결과서',
  'safety_education': '기초안전보건교육이수증',
  'vehicle_insurance': '차량 보험증',
  'vehicle_registration': '차량등록증',
  'payroll_stub': '통장 사본',
  'id_card': '신분증 사본',
  'senior_documents': '고령자 서류'
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = params.id

    // Get user documents
    const { data: documents, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching user documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Create a map of document status
    const documentStatus = REQUIRED_DOCUMENTS.reduce((acc, docType) => {
      const doc = documents?.find(d => d.document_type === docType)
      acc[docType] = {
        label: DOCUMENT_LABELS[docType],
        uploaded: !!doc,
        document: doc || null
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      success: true,
      documents: documentStatus,
      allDocuments: documents || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = params.id
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string

    if (!file || !documentType) {
      return NextResponse.json({ error: 'File and document type are required' }, { status: 400 })
    }

    if (!REQUIRED_DOCUMENTS.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    // Create service client for file operations
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique file name
    const fileExtension = file.name.split('.').pop()
    const fileName = `${userId}/${documentType}/${Date.now()}.${fileExtension}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from('user-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get user info for unified_documents
    const { data: userInfo } = await serviceClient
      .from('profiles')
      .select('full_name, organization:organizations(name)')
      .eq('id', userId)
      .single()

    // Delete existing document of same type
    const { data: existingDoc } = await serviceClient
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .single()

    if (existingDoc) {
      // Delete old file from storage
      await serviceClient.storage
        .from('user-documents')
        .remove([existingDoc.file_path])

      // Delete old record
      await serviceClient
        .from('user_documents')
        .delete()
        .eq('id', existingDoc.id)
    }

    // Save document record
    const { data: docRecord, error: docError } = await serviceClient
      .from('user_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        original_filename: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id
      })
      .select()
      .single()

    if (docError) {
      console.error('Document record error:', docError)
      // Clean up uploaded file
      await serviceClient.storage
        .from('user-documents')
        .remove([fileName])
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 })
    }

    // Also save to unified_documents for document management system
    const { error: unifiedError } = await serviceClient
      .from('unified_documents')
      .upsert({
        site_id: null, // User documents are not site-specific
        user_id: userId,
        original_filename: file.name,
        stored_filename: fileName,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        document_type: DOCUMENT_LABELS[documentType],
        category_type: 'required_user_docs',
        title: `${userInfo?.full_name || 'Unknown'} - ${DOCUMENT_LABELS[documentType]}`,
        description: `${userInfo?.organization?.name || ''} 소속 ${userInfo?.full_name || 'Unknown'}의 ${DOCUMENT_LABELS[documentType]}`,
        uploaded_by: user.id,
        tags: [documentType, 'required_document', 'user_document'],
        is_active: true
      }, {
        onConflict: 'user_id,document_type'
      })

    if (unifiedError) {
      console.error('Unified documents error:', unifiedError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 업로드되었습니다.',
      document: docRecord
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication and admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = params.id
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')

    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Create service client
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get document record
    const { data: document, error: fetchError } = await serviceClient
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from storage
    const { error: storageError } = await serviceClient.storage
      .from('user-documents')
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete document record
    const { error: deleteError } = await serviceClient
      .from('user_documents')
      .delete()
      .eq('id', document.id)

    if (deleteError) {
      console.error('Document deletion error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    // Delete from unified_documents as well
    await serviceClient
      .from('unified_documents')
      .delete()
      .eq('user_id', userId)
      .eq('tags', 'cs', `{${documentType}}`)

    return NextResponse.json({
      success: true,
      message: '문서가 성공적으로 삭제되었습니다.'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}