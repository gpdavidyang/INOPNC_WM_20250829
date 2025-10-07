export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export async function GET(request: NextRequest) {
  // Use the server client for proper cookie handling
  // Use service role to bypass RLS for public listing
  const supabase = createServiceRoleClient()

  try {
    // Query params for optional scoping
    const { searchParams } = new URL(request.url)
    const scope = (searchParams.get('scope') || 'all').toLowerCase() // 'all' | 'construction' | 'suppliers'

    // Helper to shape result
    const respond = (rows: any[] | null) =>
      NextResponse.json({ success: true, data: rows || [], count: rows?.length || 0 })

    // suppliers: prefer view supplier_companies if present; fallback to partner_companies filter
    if (scope === 'suppliers') {
      const { data: viewData, error: viewErr } = await supabase
        .from('supplier_companies')
        .select(`id, company_name, company_type, status, representative_name, contact_person`)
        .order('company_name', { ascending: true })

      if (!viewErr) return respond(viewData)

      // Fallback if view not found or other non-critical error
      const { data: partnerCompanies, error } = await supabase
        .from('partner_companies')
        .select(
          `
          id,
          company_name,
          company_type,
          status,
          representative_name,
          contact_person
        `
        )
        .eq('company_type', 'supplier')
        .order('company_name', { ascending: true })

      if (error) {
        console.error('Error fetching supplier companies:', error)
        return NextResponse.json({ error: 'Failed to fetch supplier companies' }, { status: 500 })
      }
      return respond(partnerCompanies)
    }

    // construction: exclude suppliers
    const { data: partnerCompanies, error } = await supabase
      .from('partner_companies')
      .select(
        `
        id,
        company_name,
        company_type,
        status,
        representative_name,
        contact_person
      `
      )
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Error fetching partner companies:', error)
      return NextResponse.json({ error: 'Failed to fetch partner companies' }, { status: 500 })
    }

    const rows =
      scope === 'construction'
        ? (partnerCompanies || []).filter(
            pc => String(pc.company_type || '').toLowerCase() !== 'supplier'
          )
        : partnerCompanies || []

    return respond(rows)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
