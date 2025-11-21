import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { COMPANY_DOC_SLUG_REGEX } from '@/lib/documents/company-types'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = new Set(['admin', 'system_admin'])
const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const assertAdmin = (auth: { role?: string | null }) =>
  ADMIN_ROLES.has(String(auth?.role || '').trim())

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!assertAdmin(auth)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const updates: Record<string, any> = {}
  if ('slug' in payload) {
    const slug = normalizeString((payload as any).slug).toLowerCase()
    if (slug && COMPANY_DOC_SLUG_REGEX.test(slug)) {
      updates.slug = slug
    } else {
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
    }
  }
  if ('name' in payload) {
    const name = normalizeString((payload as any).name)
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    updates.name = name
  }
  if ('description' in payload) {
    const desc = normalizeString((payload as any).description)
    updates.description = desc || null
  }
  if ('display_order' in payload) {
    const order = Number((payload as any).display_order)
    if (!Number.isFinite(order)) {
      return NextResponse.json({ error: 'display_order must be numeric' }, { status: 400 })
    }
    updates.display_order = order
  }
  if ('is_required' in payload) {
    updates.is_required = Boolean((payload as any).is_required)
  }
  if ('is_active' in payload) {
    updates.is_active = Boolean((payload as any).is_active)
  }
  if ('default_visibility' in payload) {
    updates.default_visibility = normalizeString((payload as any).default_visibility) || 'shared'
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('company_document_types')
    .update(updates)
    .eq('id', context.params.id)
    .select('*')
    .single()

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json(
        { error: 'company_document_types table is missing. Please apply the latest migration.' },
        { status: 503 }
      )
    }
    console.error('[company-doc-types] failed to update:', error)
    return NextResponse.json({ error: 'Failed to update document type' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!assertAdmin(auth)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const mode = request.nextUrl.searchParams.get('mode')
  const supabase = createClient()

  if (mode === 'hard') {
    const { error } = await supabase
      .from('company_document_types')
      .delete()
      .eq('id', context.params.id)
    if (error) {
      if ((error as any)?.code === '42P01') {
        return NextResponse.json(
          { error: 'company_document_types table is missing. Please apply the latest migration.' },
          { status: 503 }
        )
      }
      console.error('[company-doc-types] failed hard delete:', error)
      return NextResponse.json({ error: 'Failed to delete document type' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  }

  const { data, error } = await supabase
    .from('company_document_types')
    .update({ is_active: false })
    .eq('id', context.params.id)
    .select('*')
    .single()

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json(
        { error: 'company_document_types table is missing. Please apply the latest migration.' },
        { status: 503 }
      )
    }
    console.error('[company-doc-types] failed to soft delete:', error)
    return NextResponse.json({ error: 'Failed to deactivate document type' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
