import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

type RawOrganization = Record<string, any> & {
  contact_phone?: string | null
  contact_email?: string | null
  phone?: string | null
  email?: string | null
}

const normalizeOrganization = (org: RawOrganization) => ({
  ...org,
  contact_phone: org.contact_phone ?? org.phone ?? null,
  contact_email: org.contact_email ?? org.email ?? null,
})

const extractMissingColumn = (error: any): string | null => {
  const message = typeof error?.message === 'string' ? error.message : ''
  const match = message.match(/Could not find the '([^']+)' column/i)
  return match ? match[1] : null
}

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
      ...normalizeOrganization(organization as RawOrganization),
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
    const allowedFields = (({ name, address, contact_email, contact_phone, description }) => {
      const updates: Record<string, unknown> = {}
      if (typeof name === 'string' && name.trim().length > 0) updates.name = name.trim()
      if (address !== undefined) {
        updates.address =
          typeof address === 'string' && address.trim().length > 0 ? address.trim() : null
      }
      if (description !== undefined) {
        updates.description =
          typeof description === 'string' && description.trim().length > 0
            ? description.trim()
            : null
      }
      if (contact_phone !== undefined) {
        const sanitizedPhone =
          typeof contact_phone === 'string' && contact_phone.trim().length > 0
            ? contact_phone.trim()
            : null
        updates.contact_phone = sanitizedPhone
        updates.phone = sanitizedPhone
      }
      if (contact_email !== undefined) {
        const sanitizedEmail =
          typeof contact_email === 'string' && contact_email.trim().length > 0
            ? contact_email.trim()
            : null
        updates.contact_email = sanitizedEmail
        updates.email = sanitizedEmail
      }
      return updates
    })(body as Record<string, string | undefined>)

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
    }

    let currentUpdates = { ...allowedFields }
    const attemptUpdate = (payload: Record<string, unknown>) =>
      supabase.from('organizations').update(payload).eq('id', params.id).select().maybeSingle()

    let updatedOrganization: RawOrganization | null = null
    let updateError: any = null

    while (true) {
      if (Object.keys(currentUpdates).length === 0) {
        updateError = null
        break
      }
      const { data, error: attemptError } = await attemptUpdate(currentUpdates)
      if (!attemptError) {
        updatedOrganization = data as RawOrganization
        updateError = null
        break
      }
      const missingColumn = extractMissingColumn(attemptError)
      if (!missingColumn || !(missingColumn in currentUpdates)) {
        updateError = attemptError
        break
      }
      console.warn(
        `[organizations:PATCH] ${missingColumn} column missing in organizations table, retrying without it.`
      )
      delete currentUpdates[missingColumn]
    }

    if (!updatedOrganization && updateError == null) {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', params.id)
        .maybeSingle()
      updatedOrganization = (data as RawOrganization) ?? null
    }

    if (updateError) {
      throw updateError
    }

    if (!updatedOrganization) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization: normalizeOrganization(updatedOrganization),
    })
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
