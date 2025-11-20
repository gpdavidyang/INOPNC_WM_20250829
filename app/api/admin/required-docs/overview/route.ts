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
    const docTypeParam = searchParams.get('document_type')
    const submittedBy = searchParams.get('submitted_by')
    const normalizedDocType = docTypeParam && docTypeParam !== 'all' ? docTypeParam : null

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
    if (normalizedDocType) base = base.eq('sub_category', normalizedDocType)
    if (submittedBy) base = base.eq('uploaded_by', submittedBy)

    const total = await base
    const approved = await base.eq('status', 'approved')
    const rejected = await base.eq('status', 'rejected')
    // "pending"에는 업로드 직후 상태(uploaded) 포함
    const pending1 = await base.eq('status', 'pending')
    const pending2 = await base.eq('status', 'uploaded')

    const fallbackCounts = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    }

    const normalizeStatus = (value?: string | null) => normalizeRequiredDocStatus(value)

    const { data: submissionFallback, error: fallbackError } = await db
      .from('user_document_submissions')
      .select('id, submission_status, submitted_at, requirement_id, user_id')
      .neq('submission_status', 'not_submitted')

    if (fallbackError) {
      console.error('overview fallback error:', fallbackError)
    } else if (submissionFallback && submissionFallback.length > 0) {
      let requirementCodeMap: Map<string, string> | null = null
      if (normalizedDocType) {
        const requirementIds = Array.from(
          new Set(
            submissionFallback
              .map(sub => (typeof sub.requirement_id === 'string' ? sub.requirement_id : null))
              .filter(Boolean) as string[]
          )
        )
        if (requirementIds.length > 0) {
          const { data: reqData } = await db
            .from('required_document_types')
            .select('id, code')
            .in('id', requirementIds)
          requirementCodeMap = new Map(
            (reqData || []).map((row: any) => [row.id, row.code || row.id])
          )
        }
      }

      const fromDate = from ? new Date(from) : null
      const toDate = to
        ? (() => {
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)
            return end
          })()
        : null

      submissionFallback.forEach(sub => {
        const normalizedStatus = normalizeStatus(sub?.submission_status)
        const submissionDate = sub?.submitted_at ? new Date(sub.submitted_at) : null
        if (submittedBy && sub?.user_id !== submittedBy) return
        if (fromDate && submissionDate && submissionDate < fromDate) return
        if (toDate && submissionDate && submissionDate > toDate) return
        if (normalizedDocType) {
          const requirementCode =
            (typeof sub?.requirement_id === 'string' &&
              requirementCodeMap?.get(sub.requirement_id)) ||
            (typeof sub?.requirement_id === 'string' ? sub.requirement_id : null)
          if (requirementCode !== normalizedDocType) return
        }
        fallbackCounts.total += 1
        if (normalizedStatus === 'approved') {
          fallbackCounts.approved += 1
        } else if (normalizedStatus === 'rejected') {
          fallbackCounts.rejected += 1
        } else {
          // treat submitted/pending the same for the summary widget
          fallbackCounts.pending += 1
        }
      })
    }

    const counts = {
      total: (total.count || 0) + fallbackCounts.total,
      approved: (approved.count || 0) + fallbackCounts.approved,
      pending: (pending1.count || 0) + (pending2.count || 0) + fallbackCounts.pending,
      rejected: (rejected.count || 0) + fallbackCounts.rejected,
    }

    return NextResponse.json({ success: true, counts })
  } catch (error) {
    console.error('overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
