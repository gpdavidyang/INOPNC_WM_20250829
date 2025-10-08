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
    const q = (searchParams.get('q') || '').trim()
    const status = (searchParams.get('status') || 'all').trim()
    const docType = (searchParams.get('document_type') || 'all').trim()
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const submittedBy = (searchParams.get('submitted_by') || '').trim()
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    let query = db
      .from('unified_document_system')
      .select(
        `
        *,
        uploader:profiles!unified_document_system_uploaded_by_fkey(id,full_name,email,role),
        site:sites(id,name)
      `,
        { count: 'exact' }
      )
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)

    if (status !== 'all') {
      if (status === 'pending') {
        query = query.in('status', ['pending', 'uploaded'])
      } else {
        query = query.eq('status', status)
      }
    }
    if (docType !== 'all') query = query.eq('sub_category', docType)
    if (from) query = query.gte('created_at', new Date(from).toISOString())
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      query = query.lte('created_at', end.toISOString())
    }
    if (submittedBy) query = query.eq('uploaded_by', submittedBy)
    if (q) {
      // uploader.full_name/email에는 직접 ilike를 걸 수 없어 title/file_name 중심 검색
      query = query.or(`title.ilike.%${q}%,file_name.ilike.%${q}%`)
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    const { data, count, error } = await query

    if (error) {
      console.error('submissions list error:', error)
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
    }

    const rows = (data || []).map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      document_type: doc.sub_category || 'unknown',
      file_name: doc.file_name,
      file_url: doc.file_url,
      file_size: doc.file_size,
      status: doc.status === 'uploaded' ? 'pending' : doc.status,
      submission_date: doc.created_at,
      submitted_by: {
        id: doc.uploaded_by,
        full_name: doc.uploader?.full_name || 'Unknown',
        email: doc.uploader?.email || '',
        role: doc.uploader?.role || 'worker',
      },
      site: doc.site || null,
    }))

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / limit)),
      },
    })
  } catch (error) {
    console.error('submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
