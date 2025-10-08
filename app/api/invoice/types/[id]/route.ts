import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, ctx: { params: { id: string } }) {
  const supabase = createClient()
  try {
    const idOrCode = ctx.params.id
    const body = await request.json()
    const update = {
      label: body.label,
      is_required_start: !!body?.stageRequired?.start,
      is_required_progress: !!body?.stageRequired?.progress,
      is_required_completion: !!body?.stageRequired?.completion,
      allow_multiple_versions: body.allowMultipleVersions !== false,
      allowed_mime_types: body.allowedMimeTypes || null,
      sort_order: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
      is_active: body.isActive !== false,
    }
    Object.keys(update).forEach(
      k => update[k as keyof typeof update] === undefined && delete (update as any)[k]
    )

    let q = supabase.from('invoice_document_types').update(update)
    // 지원: id(uuid) 또는 code로 업데이트
    if (/^[0-9a-fA-F-]{36}$/.test(idOrCode)) q = q.eq('id', idOrCode)
    else q = q.eq('code', idOrCode)

    const { error } = await q
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Types registry not available (provision needed)' },
      { status: 501 }
    )
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: { id: string } }) {
  const supabase = createClient()
  try {
    const idOrCode = ctx.params.id
    let q = supabase.from('invoice_document_types').update({ is_active: false })
    if (/^[0-9a-fA-F-]{36}$/.test(idOrCode)) q = q.eq('id', idOrCode)
    else q = q.eq('code', idOrCode)
    const { error } = await q
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: 'Types registry not available (provision needed)' },
      { status: 501 }
    )
  }
}
