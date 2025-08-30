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

    // Get site partners (customers associated with this site)
    const { data: partners, error: partnersError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        business_registration_number,
        primary_customer,
        address,
        contact_person,
        contact_email,
        contact_phone,
        created_at,
        site_customers!inner(
          site_id,
          relationship_type,
          contract_amount,
          contract_start_date,
          contract_end_date,
          is_active
        )
      `)
      .eq('site_customers.site_id', siteId)
      .eq('site_customers.is_active', true)
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
        customer_id,
        profiles!unified_documents_uploaded_by_fkey(
          full_name,
          role
        ),
        customers(
          id,
          name
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
    const totalContracts = partners?.reduce((sum, partner) => sum + (partner.site_customers?.[0]?.contract_amount || 0), 0) || 0
    const totalInvoiceDocuments = invoiceDocuments?.length || 0
    
    const documentsByPartner = invoiceDocuments?.reduce((acc, doc) => {
      const partnerId = doc.customer_id || 'unassigned'
      const partnerName = doc.customers?.name || '미배정'
      
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
      total_contract_amount: totalContracts,
      total_invoice_documents: totalInvoiceDocuments,
      documents_by_partner: Object.values(documentsByPartner),
      active_contracts: partners?.filter(p => 
        p.site_customers?.[0]?.contract_end_date ? 
        new Date(p.site_customers[0].contract_end_date) > new Date() : 
        true
      ).length || 0
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