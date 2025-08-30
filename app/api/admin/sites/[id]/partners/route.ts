import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
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

    const siteId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get site partners (partner companies assigned to this site)
    const { data: partners, error: partnersError } = await supabase
      .from('partner_companies')
      .select(`
        id,
        company_name,
        business_number,
        company_type,
        trade_type,
        representative_name,
        contact_person,
        phone,
        email,
        address,
        status,
        created_at,
        site_partners!inner(
          site_id,
          partner_company_id,
          assigned_date,
          contract_status,
          contract_value
        )
      `)
      .eq('site_partners.site_id', siteId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (partnersError) {
      console.error('Partners query error:', partnersError)
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
    }

    // Get invoice documents for this site
    const { data: invoiceDocuments, error: documentsError } = await supabase
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
        updated_by,
        customer_company_id,
        profiles!unified_documents_uploaded_by_fkey(
          full_name,
          role
        )
      `)
      .eq('site_id', siteId)
      .eq('category_type', 'invoice')
      .order('created_at', { ascending: false })
      .limit(50)

    if (documentsError) {
      console.error('Invoice documents query error:', documentsError)
      return NextResponse.json({ error: 'Failed to fetch invoice documents' }, { status: 500 })
    }

    // Calculate statistics
    const totalPartners = partners?.length || 0
    const totalInvoiceDocuments = invoiceDocuments?.length || 0
    
    const documentsByPartner = invoiceDocuments?.reduce((acc, doc) => {
      const partnerId = doc.customer_company_id || 'unassigned'
      const partnerName = partnerId === 'unassigned' ? '미배정' : `Partner ${partnerId.slice(0, 8)}`
      
      if (!acc[partnerId]) {
        acc[partnerId] = {
          id: partnerId,
          name: partnerName,
          count: 0,
          documents: []
        }
      }
      acc[partnerId].count++
      acc[partnerId].documents.push(doc)
      return acc
    }, {} as Record<string, any>) || {}

    const statistics = {
      total_partners: totalPartners,
      total_invoice_documents: totalInvoiceDocuments,
      documents_by_partner: Object.values(documentsByPartner),
      active_partners: partners?.length || 0
    }

    // Get site information for context
    const { data: siteData } = await supabase
      .from('sites')
      .select('id, name')
      .eq('id', siteId)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        partners: partners || [],
        invoice_documents: invoiceDocuments || []
      },
      statistics,
      site: siteData,
      filters: {
        site_id: siteId,
        limit
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