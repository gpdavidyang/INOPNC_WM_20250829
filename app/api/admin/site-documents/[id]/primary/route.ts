import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // 권한 확인: admin/system_admin만 허용
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', auth.userId)
      .single()

    const role = profile?.role || auth.role || ''
    if (!['admin', 'system_admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { is_primary_blueprint } = body as { is_primary_blueprint?: boolean }

    // 대상 문서 조회
    const { data: doc, error: fetchErr } = await supabase
      .from('site_documents')
      .select('id, site_id, document_type, is_primary_blueprint')
      .eq('id', params.id)
      .single()

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (doc.document_type !== 'blueprint') {
      return NextResponse.json(
        { error: 'Only blueprint documents can be set as primary' },
        { status: 400 }
      )
    }

    // true로 설정 시 동일 현장의 다른 blueprint는 모두 false 처리
    if (is_primary_blueprint === true) {
      await supabase
        .from('site_documents')
        .update({ is_primary_blueprint: false })
        .eq('site_id', doc.site_id)
        .eq('document_type', 'blueprint')
        .neq('id', doc.id)
    }

    const { data: updated, error: updateErr } = await supabase
      .from('site_documents')
      .update({
        is_primary_blueprint: !!is_primary_blueprint,
        updated_at: new Date().toISOString(),
      })
      .eq('id', doc.id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Primary blueprint API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
