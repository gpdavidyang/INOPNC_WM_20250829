
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('type')

    // Verify that the user's partner company is associated with this site
    const { data: sitePartner } = await supabase
      .from('site_partners')
      .select('id')
      .eq('site_id', siteId)
      .eq('partner_company_id', profile.organization_id || '')
      .single()

    if (!sitePartner && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied to this site' }, { status: 403 })
    }

    // Get documents for this site that are relevant to partners
    let query = supabase
      .from('unified_documents')
      .select(`
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
      `)
      .eq('site_id', siteId)

    // Filter by document types that are typically relevant to partners
    const partnerRelevantTypes = [
      'invoice',      // 기성청구서
      'contract',     // 계약서
      'estimate',     // 견적서
      'drawing',      // 도면
      'specification', // 시방서
      'progress_report', // 진도 보고서
      'safety_document', // 안전 관련 문서
      'quality_document' // 품질 관련 문서
    ]

    if (documentType && documentType !== 'all') {
      query = query.eq('category_type', documentType)
    } else {
      query = query.in('category_type', partnerRelevantTypes)
    }

    query = query.order('created_at', { ascending: false }).limit(100)

    const { data: documents, error } = await query

    if (error) {
      console.error('Documents query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Transform documents for frontend
    const transformedDocuments = (documents || []).map((doc: unknown) => ({
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
      icon: getDocumentIcon(doc.category_type, doc.sub_type)
    }))

    // Group documents by type for statistics
    const documentStats = transformedDocuments.reduce((acc: unknown, doc: unknown) => {
      const type = doc.categoryType || 'other'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        documents: transformedDocuments
      },
      statistics: {
        total_documents: transformedDocuments.length,
        by_type: documentStats
      },
      site_id: siteId,
      filters: {
        type: documentType
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

// Helper functions
function mapDocumentType(categoryType: string, subType: string | null): string {
  const typeMap: { [key: string]: string } = {
    'invoice': '기성청구서',
    'contract': '계약서',
    'estimate': '견적서',
    'drawing': '도면',
    'specification': '시방서',
    'progress_report': '진도보고서',
    'safety_document': '안전관리문서',
    'quality_document': '품질관리문서',
    'photo_document': '사진대지문서',
    'completion': '작업완료확인서',
    'blueprint': '진행도면'
  }
  
  return typeMap[categoryType] || subType || categoryType || '문서'
}

function getDocumentIcon(categoryType: string, subType: string | null): string {
  const iconMap: { [key: string]: string } = {
    'invoice': 'DollarSign',
    'contract': 'FileSignature', 
    'estimate': 'Calculator',
    'drawing': 'Map',
    'specification': 'FileText',
    'progress_report': 'BarChart3',
    'safety_document': 'Shield',
    'quality_document': 'CheckSquare',
    'photo_document': 'Camera',
    'completion': 'CheckCircle',
    'blueprint': 'Map'
  }
  
  return iconMap[categoryType] || 'FileText'
}