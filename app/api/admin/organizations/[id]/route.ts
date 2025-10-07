import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data: organization, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!organization) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    // Related sites
    const [{ data: sitesData }, { data: membersData }] = await Promise.all([
      supabase
        .from('sites')
        .select('id, name, status')
        .eq('organization_id', params.id)
        .order('name', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('organization_id', params.id)
        .order('full_name', { ascending: true }),
    ])

    const related = {
      members: (membersData || []).map((m: any) => ({
        id: m.id,
        name: m.full_name || '-',
        role: m.role || '-',
        email: m.email || '',
      })),
      sites: (sitesData || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        status: s.status || 'inactive',
      })),
    }

    const organizationWithCounts = {
      ...organization,
      member_count: related.members.length,
      site_count: related.sites.length,
    }

    return NextResponse.json({ success: true, organization: organizationWithCounts, related })
  } catch (error) {
    console.error('Organization detail API error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  let body: Record<string, unknown> = {}

  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    body = await request.json()
    const allowedFields = (({ name, address, contact_email, contact_phone, description }) => ({
      ...(name ? { name } : {}),
      ...(address !== undefined ? { address } : {}),
      ...(contact_email !== undefined ? { contact_email } : {}),
      ...(contact_phone !== undefined ? { contact_phone } : {}),
      ...(description !== undefined ? { description } : {}),
    }))(body as Record<string, string | undefined>)

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    const { data: updatedOrganization, error: updateError } = await supabase
      .from('organizations')
      .update(allowedFields)
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (updateError) {
      throw updateError
    }

    if (!updatedOrganization) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, organization: updatedOrganization })
  } catch (error) {
    console.error('Organization update error:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.role || !['admin', 'system_admin'].includes(authResult.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = await createClient()

    const { error: delError } = await supabase.from('organizations').delete().eq('id', params.id)

    if (delError) {
      console.error('Organization delete error:', delError)
      return NextResponse.json({ success: false, error: delError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Organization delete exception:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete organization' },
      { status: 500 }
    )
  }
}
