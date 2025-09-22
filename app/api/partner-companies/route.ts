export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Use the server client for proper cookie handling
  const supabase = createClient()

  try {
    // Partner companies are public data, no auth required for GET
    // Get active partner companies
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
      .eq('status', 'active')
      .order('company_name', { ascending: true })

    if (error) {
      console.error('Error fetching partner companies:', error)
      return NextResponse.json({ error: 'Failed to fetch partner companies' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: partnerCompanies || [],
      count: partnerCompanies?.length || 0,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
