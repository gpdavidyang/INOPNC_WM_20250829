import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
// Note: stub fallback removed — real data only

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

type RawOrganization = Record<string, any> & {
  id: string
  contact_phone?: string | null
  contact_email?: string | null
  phone?: string | null
  email?: string | null
}

const normalizeOrganization = (org: RawOrganization) => {
  const contactPhone = org.contact_phone ?? org.phone ?? null
  const contactEmail = org.contact_email ?? org.email ?? null
  return {
    ...org,
    contact_phone: contactPhone,
    contact_email: contactEmail,
  }
}

const extractMissingColumn = (error: any): string | null => {
  const message = typeof error?.message === 'string' ? error.message : ''
  const match = message.match(/Could not find the '([^']+)' column/i)
  return match ? match[1] : null
}

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
      return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
    }

    const orgList = organizations || []
    const orgIds = orgList.map(org => org.id).filter((id): id is string => Boolean(id))

    let siteCountMap = new Map<string, number>()
    let memberCountMap = new Map<string, number>()

    if (orgIds.length > 0) {
      const [{ data: siteRows }, { data: memberRows }] = await Promise.all([
        supabase.from('sites').select('organization_id').in('organization_id', orgIds),
        supabase.from('profiles').select('organization_id').in('organization_id', orgIds),
      ])

      if (Array.isArray(siteRows)) {
        siteCountMap = siteRows.reduce((map, row: any) => {
          const key = row?.organization_id
          if (!key) return map
          map.set(key, (map.get(key) || 0) + 1)
          return map
        }, new Map<string, number>())
      }

      if (Array.isArray(memberRows)) {
        memberCountMap = memberRows.reduce((map, row: any) => {
          const key = row?.organization_id
          if (!key) return map
          map.set(key, (map.get(key) || 0) + 1)
          return map
        }, new Map<string, number>())
      }
    }

    const enriched = orgList.map(org => {
      const normalized = normalizeOrganization(org as RawOrganization)
      return {
        ...normalized,
        site_count: siteCountMap.get(org.id) || 0,
        member_count: memberCountMap.get(org.id) || 0,
      }
    })

    return NextResponse.json({ success: true, organizations: enriched })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    )
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
    const { name, type, address, contact_email, contact_phone, description } = body
    const normalizedType =
      typeof type === 'string' && type.trim().length > 0 ? type.trim() : 'subcontractor'

    // Validate
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const sanitizedAddress =
      typeof address === 'string' && address.trim().length > 0 ? address.trim() : null
    const sanitizedDescription =
      typeof description === 'string' && description.trim().length > 0 ? description.trim() : null
    const sanitizedPhone =
      typeof contact_phone === 'string' && contact_phone.trim().length > 0
        ? contact_phone.trim()
        : null
    const sanitizedEmail =
      typeof contact_email === 'string' && contact_email.trim().length > 0
        ? contact_email.trim()
        : null

    const insertPayload: Record<string, unknown> = { name: trimmedName }
    if (normalizedType) insertPayload.type = normalizedType
    if (sanitizedAddress !== null) insertPayload.address = sanitizedAddress
    if (sanitizedDescription !== null) insertPayload.description = sanitizedDescription
    if (sanitizedPhone !== null) {
      insertPayload.contact_phone = sanitizedPhone
      insertPayload.phone = sanitizedPhone
    }
    if (sanitizedEmail !== null) {
      insertPayload.email = sanitizedEmail
      insertPayload.contact_email = sanitizedEmail
    }

    const attemptInsert = (payload: Record<string, unknown>) =>
      supabase.from('organizations').insert(payload).select().single()

    let currentPayload = { ...insertPayload }
    let organization: RawOrganization | null = null
    let error: any = null

    while (true) {
      if (Object.keys(currentPayload).length === 0) {
        error = new Error('No valid columns available for organization insert.')
        break
      }
      const { data, error: attemptError } = await attemptInsert(currentPayload)
      if (!attemptError) {
        organization = data as RawOrganization
        error = null
        break
      }
      const missingColumn = extractMissingColumn(attemptError)
      if (!missingColumn || !(missingColumn in currentPayload)) {
        error = attemptError
        break
      }
      console.warn(
        `[organizations:POST] ${missingColumn} column missing in organizations table, retrying without it.`
      )
      delete currentPayload[missingColumn]
    }

    if (error) {
      console.error('Error creating organization:', error)
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
    }

    return NextResponse.json({ success: true, organization: normalizeOrganization(organization) })
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
