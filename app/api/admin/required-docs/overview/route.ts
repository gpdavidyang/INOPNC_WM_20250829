import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const { role } = auth
    if (!role) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (role === 'customer_manager') {
      return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
    }

    const supabase = createClient()
    const db = ['admin', 'system_admin'].includes(role) ? createServiceClient() : supabase

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') // YYYY-MM-DD
    const to = searchParams.get('to') // YYYY-MM-DD
    const docType = searchParams.get('document_type')
    const submittedBy = searchParams.get('submitted_by')

    let base = db
      .from('unified_document_system')
      .select('id', { count: 'exact', head: true })
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)

    if (from) base = base.gte('created_at', new Date(from).toISOString())
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      base = base.lte('created_at', end.toISOString())
    }
    if (docType) base = base.eq('sub_category', docType)
    if (submittedBy) base = base.eq('uploaded_by', submittedBy)

    const total = await base
    const approved = await base.eq('status', 'approved')
    const rejected = await base.eq('status', 'rejected')
    // "pending"에는 업로드 직후 상태(uploaded) 포함
    const pending1 = await base.eq('status', 'pending')
    const pending2 = await base.eq('status', 'uploaded')

    const counts = {
      total: total.count || 0,
      approved: approved.count || 0,
      pending: (pending1.count || 0) + (pending2.count || 0),
      rejected: rejected.count || 0,
    }

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error('overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
