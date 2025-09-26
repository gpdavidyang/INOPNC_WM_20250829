import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const role = profile.role || authResult.role || ''

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('type')

    // Verify that the user's partner company is associated with this site
    const { data: sitePartner } = await supabase
      .from('partner_site_mappings')
      .select('id')
      .eq('site_id', siteId)
      .eq('partner_company_id', profile.organization_id || '')
      .eq('is_active', true)
      .single()

    if (!sitePartner && !['admin', 'system_admin'].includes(role)) {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
    }

    // Get documents for this site that are relevant to partners
    // Check unified_documents, legacy documents, and site_documents(blueprint)
    let unifiedDocuments = []
    let legacyDocuments = []
    let siteDocuments = []

    // Query unified_documents table
    const unifiedQuery = supabase
      .from('unified_documents')
      .select(
        `
        id,
        document_type,
        sub_type,
        category_type,
        file_name,
        file_url,
        title,
        description,
        created_at,
        uploaded_by,
        file_size,
        mime_type,
        profiles!unified_documents_uploaded_by_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq('site_id', siteId)

    // Query legacy documents table for blueprints
    const legacyQuery = supabase
      .from('documents')
      .select(
        `
        id,
        title,
        description,
        file_url,
        file_name,
        file_size,
        mime_type,
        document_type,
        created_at,
        owner_id,
        profiles!documents_owner_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq('site_id', siteId)

    // Filter by document types that are typically relevant to partners
    const partnerRelevantTypes = [
      'invoice', // 기성청구서
      'contract', // 계약서
      'estimate', // 견적서
      'drawing', // 도면
      'specification', // 시방서
      'progress_report', // 진도 보고서
      'safety_document', // 안전 관련 문서
      'quality_document', // 품질 관련 문서
    ]

    // Apply filters to unified_documents
    let finalUnifiedQuery = unifiedQuery
    if (documentType && documentType !== 'all') {
      finalUnifiedQuery = finalUnifiedQuery.eq('category_type', documentType)
    } else {
      finalUnifiedQuery = finalUnifiedQuery.in('category_type', partnerRelevantTypes)
    }
    finalUnifiedQuery = finalUnifiedQuery.order('created_at', { ascending: false }).limit(50)

    // Apply filters to documents table - especially for drawing/blueprint
    let finalLegacyQuery = legacyQuery
    if (documentType && documentType === 'drawing') {
      // Include blueprints and drawings from legacy documents table
      finalLegacyQuery = finalLegacyQuery.in('document_type', ['blueprint', 'drawing'])
    } else if (documentType && documentType !== 'all') {
      finalLegacyQuery = finalLegacyQuery.eq('document_type', documentType)
    }
    finalLegacyQuery = finalLegacyQuery.order('created_at', { ascending: false }).limit(50)

    // Site documents (blueprint only)
    const siteDocsQuery = supabase
      .from('site_documents')
      .select(
        'id, file_name, file_url, file_size, mime_type, document_type, created_at, is_primary_blueprint, site_id'
      )
      .eq('site_id', siteId)
      .eq('document_type', 'blueprint')
      .order('created_at', { ascending: false })
      .limit(50)

    // Execute queries
    const [unifiedResult, legacyResult, siteDocsResult] = await Promise.all([
      finalUnifiedQuery,
      finalLegacyQuery,
      siteDocsQuery,
    ])

    if (unifiedResult.error && legacyResult.error) {
      console.error('Documents query error:', unifiedResult.error, legacyResult.error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    unifiedDocuments = unifiedResult.data || []
    legacyDocuments = legacyResult.data || []
    siteDocuments = siteDocsResult.error ? [] : siteDocsResult.data || []

    // Transform both unified and legacy documents for frontend
    const transformedUnified = (unifiedDocuments || []).map((doc: any) => ({
      id: doc.id,
      type: mapDocumentType(doc.category_type, doc.sub_type),
      name: doc.file_name,
      title: doc.title,
      description: doc.description,
      uploadDate: new Date(doc.created_at).toLocaleDateString('ko-KR'),
      uploader: doc.profiles?.full_name || '알 수 없음',
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      fileUrl: doc.file_url,
      categoryType: doc.category_type,
      subType: doc.sub_type,
      icon: getDocumentIcon(doc.category_type, doc.sub_type),
      is_primary_blueprint: doc.metadata?.is_primary === true,
    }))

    const transformedLegacy = (legacyDocuments || []).map((doc: any) => ({
      id: doc.id,
      type: mapDocumentType(
        doc.document_type === 'blueprint' ? 'drawing' : doc.document_type || 'drawing',
        null
      ),
      name: doc.file_name,
      title: doc.title,
      description: doc.description,
      uploadDate: new Date(doc.created_at).toLocaleDateString('ko-KR'),
      uploader: doc.profiles?.full_name || '알 수 없음',
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      fileUrl: doc.file_url,
      categoryType: doc.document_type === 'blueprint' ? 'drawing' : doc.document_type || 'drawing',
      subType: doc.document_type === 'blueprint' ? 'blueprint' : null,
      icon: getDocumentIcon(
        doc.document_type === 'blueprint' ? 'drawing' : doc.document_type || 'drawing',
        null
      ),
      is_primary_blueprint: false,
    }))

    const transformedSiteDocs = (siteDocuments || []).map((doc: any) => ({
      id: doc.id,
      type: mapDocumentType('drawing', 'blueprint'),
      name: doc.file_name,
      title: doc.file_name,
      description: '현장 문서(blueprint)',
      uploadDate: new Date(doc.created_at).toLocaleDateString('ko-KR'),
      uploader: '관리자',
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      fileUrl: doc.file_url,
      categoryType: 'drawing',
      subType: 'blueprint',
      icon: getDocumentIcon('drawing', 'blueprint'),
      is_primary_blueprint: !!doc.is_primary_blueprint,
    }))

    // Combine and sort all documents
    const transformedDocuments = [
      ...transformedUnified,
      ...transformedLegacy,
      ...transformedSiteDocs,
    ].sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())

    // Group documents by type for statistics
    const documentStats = transformedDocuments.reduce(
      (acc: Record<string, number>, doc: any) => {
        const type = doc.categoryType || 'other'
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return NextResponse.json({
      success: true,
      data: {
        documents: transformedDocuments,
      },
      statistics: {
        total_documents: transformedDocuments.length,
        by_type: documentStats,
      },
      site_id: siteId,
      filters: {
        type: documentType,
      },
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions
function mapDocumentType(categoryType: string, subType: string | null): string {
  const typeMap: { [key: string]: string } = {
    invoice: '기성청구서',
    contract: '계약서',
    estimate: '견적서',
    drawing: '도면',
    specification: '시방서',
    progress_report: '진도보고서',
    safety_document: '안전관리문서',
    quality_document: '품질관리문서',
    photo_document: '사진대지문서',
    completion: '작업완료확인서',
    blueprint: '진행도면',
  }

  return typeMap[categoryType] || subType || categoryType || '문서'
}

function getDocumentIcon(categoryType: string, _subType: string | null): string {
  const iconMap: { [key: string]: string } = {
    invoice: 'DollarSign',
    contract: 'FileSignature',
    estimate: 'Calculator',
    drawing: 'Map',
    specification: 'FileText',
    progress_report: 'BarChart3',
    safety_document: 'Shield',
    quality_document: 'CheckSquare',
    photo_document: 'Camera',
    completion: 'CheckCircle',
    blueprint: 'Map',
  }

  return iconMap[categoryType] || 'FileText'
}
