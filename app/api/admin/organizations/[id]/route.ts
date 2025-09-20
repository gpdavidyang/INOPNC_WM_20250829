import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_ORGANIZATION_RELATIONS, ADMIN_ORGANIZATIONS_STUB } from '@/lib/admin/stub-data'

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

    return NextResponse.json({
      success: true,
      organization,
      related: ADMIN_ORGANIZATION_RELATIONS[params.id] ?? { members: [], sites: [] },
    })
  } catch (error) {
    console.error('Organization detail API error:', error)
    const fallback = ADMIN_ORGANIZATIONS_STUB.find((org) => org.id === params.id)

    if (!fallback) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization: fallback,
      related: ADMIN_ORGANIZATION_RELATIONS[params.id] ?? { members: [], sites: [] },
      source: 'stub',
    })
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

    let updatedOrganization = null

    if (Object.keys(allowedFields).length > 0) {
      const { data: updateResult, error: updateError } = await supabase
        .from('organizations')
        .update(allowedFields)
        .eq('id', params.id)
        .select()
        .maybeSingle()

      if (updateError) {
        throw updateError
      }

      updatedOrganization = updateResult
    }

    if (!updatedOrganization) {
      return NextResponse.json({
        success: true,
        organization: {
          ...(ADMIN_ORGANIZATIONS_STUB.find((item) => item.id === params.id) ?? { id: params.id }),
          ...allowedFields,
        },
        source: 'stub',
      })
    }

    return NextResponse.json({ success: true, organization: updatedOrganization })
  } catch (error) {
    console.error('Organization update error:', error)

    const fallback = ADMIN_ORGANIZATIONS_STUB.find((item) => item.id === params.id)

    return NextResponse.json({
      success: true,
      organization: {
        ...(fallback ?? { id: params.id }),
        ...body,
      },
      source: 'stub',
    })
  }
}
