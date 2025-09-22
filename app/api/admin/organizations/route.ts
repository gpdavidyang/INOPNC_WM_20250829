import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_ORGANIZATIONS_STUB } from '@/lib/admin/stub-data'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    // Get all organizations
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organizations: organizations || [],
    })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({
      success: true,
      organizations: ADMIN_ORGANIZATIONS_STUB,
      source: 'stub',
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const { name, type, address, contact_email, contact_phone } = body

    // Create new organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name,
        type,
        address,
        contact_email,
        contact_phone
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating organization:', error)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, organization })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
