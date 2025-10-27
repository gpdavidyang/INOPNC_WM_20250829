import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_INVOICE_DOC_TYPES } from '@/lib/invoice/doc-types'

export const dynamic = 'force-dynamic'

// GET: 문서유형 목록 (테이블 없으면 기본값 반환)
export async function GET() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('invoice_document_types')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    const rows = Array.isArray(data) ? data : []
    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: DEFAULT_INVOICE_DOC_TYPES })
    }
    // normalize
    const normalized = rows.map((r: any) => ({
      code: r.code,
      label: r.label,
      required: {
        start: !!r.is_required_start,
        progress: !!r.is_required_progress,
        completion: !!r.is_required_completion,
      },
      allowMultipleVersions: r.allow_multiple_versions !== false,
      sortOrder: Number(r.sort_order || 0),
      isActive: r.is_active !== false,
    }))
    return NextResponse.json({ success: true, data: normalized })
  } catch (e: any) {
    // relation does not exist 등
    return NextResponse.json({
      success: true,
      data: DEFAULT_INVOICE_DOC_TYPES.map(t => ({ ...t })),
    })
  }
}

// POST/PATCH/DELETE는 테이블 없을 경우 501 반환(추후 마이그레이션 후 사용)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  let payload: any = {}
  try {
    payload = await request.json()
    const insert = {
      code: payload.code,
      label: payload.label,
      is_required_start: !!payload?.stageRequired?.start,
      is_required_progress: !!payload?.stageRequired?.progress,
      is_required_completion: !!payload?.stageRequired?.completion,
      allow_multiple_versions: payload.allowMultipleVersions !== false,
      allowed_mime_types: payload.allowedMimeTypes || null,
      sort_order: Number(payload.sortOrder || 0),
      is_active: payload.isActive !== false,
    }
    const { data, error } = await supabase
      .from('invoice_document_types')
      .insert(insert)
      .select('id')
      .single()
    if (error) throw error
    return NextResponse.json({ success: true, id: data?.id })
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Types registry not available (provision needed)' },
      { status: 501 }
    )
  }
}
