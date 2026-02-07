import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus } from '@/lib/documents/status'
import { resolveStorageReference } from '@/lib/storage/paths'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

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
    const rawStatus = (searchParams.get('status') || 'all').trim()
    const status = rawStatus === 'missing' ? 'not_submitted' : (rawStatus as string)
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

    const rows = (data || []).map((doc: any) => {
      let metadata: Record<string, any> = {}
      if (doc?.metadata) {
        if (typeof doc.metadata === 'string') {
          try {
            metadata = JSON.parse(doc.metadata)
          } catch {
            metadata = {}
          }
        } else if (typeof doc.metadata === 'object') {
          metadata = doc.metadata as Record<string, any>
        }
      }
      const storageBucket =
        doc?.storage_bucket ||
        metadata?.storage_bucket ||
        metadata?.bucket ||
        metadata?.storage?.bucket ||
        null
      const storagePath =
        doc?.storage_path ||
        metadata?.storage_path ||
        metadata?.path ||
        metadata?.object_path ||
        metadata?.key ||
        null
      const requirementId =
        metadata?.requirement_id ||
        metadata?.requirement?.id ||
        metadata?.requirementId ||
        doc.requirement_id ||
        null
      const requirementCode =
        metadata?.requirement?.code ||
        metadata?.requirement_code ||
        (typeof requirementId === 'string' ? requirementId : null) ||
        doc.sub_category ||
        null
      const displayName =
        metadata?.requirement?.name_ko ||
        metadata?.requirement_name ||
        metadata?.name_ko ||
        doc.title
      const uniqueKey = `${doc.uploaded_by || ''}::${requirementCode || requirementId || doc.id}`

      const canonicalStatus = normalizeRequiredDocStatus(
        doc.status === 'uploaded' ? 'pending' : doc.status
      )

      return {
        id: doc.id,
        title: displayName || doc.title,
        description: doc.description,
        document_type_code: doc.sub_category || null,
        document_type: displayName || doc.sub_category || 'unknown',
        requirement_id: requirementId || requirementCode || null,
        document_code: requirementCode,
        document_id: metadata?.document_id || doc.document_id || null,
        file_name: doc.file_name,
        file_url: doc.file_url,
        file_size: doc.file_size,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        status: canonicalStatus,
        submission_date: doc.created_at,
        submitted_by: {
          id: doc.uploaded_by,
          full_name: doc.uploader?.full_name || 'Unknown',
          email: doc.uploader?.email || '',
          role: doc.uploader?.role || 'worker',
        },
        site: doc.site || null,
        submission_id: metadata?.submission_id || null,
        _key: uniqueKey,
        is_placeholder: false,
      }
    })

    const fallbackRows: any[] = []
    const existingKeys = new Set(rows.map(r => r._key).filter(Boolean))

    const shouldIncludeStatus = (value: string) => {
      if (status === 'all') return true
      if (status === 'pending') return value === 'pending'
      if (status === 'not_submitted') return value === 'not_submitted'
      return value === status
    }

    const normalizeStatus = (value?: string | null) => normalizeRequiredDocStatus(value)

    const { data: submissionFallback, error: submissionFallbackError } = await db
      .from('user_document_submissions')
      .select(
        'id, submission_status, submitted_at, requirement_id, document_id, user_id, file_url, file_name'
      )
      .neq('submission_status', 'not_submitted')

    if (submissionFallbackError) {
      console.error('fallback submissions error:', submissionFallbackError)
    } else if (submissionFallback && submissionFallback.length > 0) {
      const requirementIds = Array.from(
        new Set(submissionFallback.map(sub => sub.requirement_id).filter(Boolean) as string[])
      )
      const documentIds = Array.from(
        new Set(submissionFallback.map(sub => sub.document_id).filter(Boolean) as string[])
      )
      const userIds = Array.from(
        new Set(submissionFallback.map(sub => sub.user_id).filter(Boolean) as string[])
      )

      const [requirementsRes, documentsRes, profilesRes] = await Promise.all([
        requirementIds.length
          ? db
              .from('required_document_types')
              .select('id, code, name_ko, name_en')
              .in('id', requirementIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        documentIds.length
          ? db
              .from('documents')
              .select(
                'id, title, description, file_name, file_url, file_size, mime_type, created_at'
              )
              .in('id', documentIds)
          : Promise.resolve({ data: [] as any[], error: null }),
        userIds.length
          ? db.from('profiles').select('id, full_name, email, role').in('id', userIds)
          : Promise.resolve({ data: [] as any[], error: null }),
      ])

      const requirementMap = new Map((requirementsRes.data || []).map((req: any) => [req.id, req]))
      const documentMap = new Map((documentsRes.data || []).map((doc: any) => [doc.id, doc]))
      const profileMap = new Map((profilesRes.data || []).map((user: any) => [user.id, user]))

      const fromDate = from ? new Date(from) : null
      const toDate = to
        ? (() => {
            const end = new Date(to)
            end.setHours(23, 59, 59, 999)
            return end
          })()
        : null

      submissionFallback.forEach(sub => {
        const fallbackStatus = normalizeStatus(sub?.submission_status)
        if (!shouldIncludeStatus(fallbackStatus)) return
        if (submittedBy && sub?.user_id !== submittedBy) return

        const requirement = sub?.requirement_id ? requirementMap.get(sub.requirement_id) : null
        const document = sub?.document_id ? documentMap.get(sub.document_id) : null
        const profile = sub?.user_id ? profileMap.get(sub.user_id) : null
        const requirementCode = requirement?.code || sub?.requirement_id || null
        if (docType !== 'all' && docType && requirementCode !== docType) return

        const submissionDate = sub?.submitted_at
          ? new Date(sub.submitted_at)
          : document?.created_at
            ? new Date(document.created_at)
            : null
        if (fromDate && submissionDate && submissionDate < fromDate) return
        if (toDate && submissionDate && submissionDate > toDate) return

        if (q) {
          const search = q.toLowerCase()
          const title = requirement?.name_ko || requirement?.name_en || document?.title || ''
          const fileName = document?.file_name || ''
          const submitter = profile?.full_name || profile?.email || ''
          if (
            !title.toLowerCase().includes(search) &&
            !fileName.toLowerCase().includes(search) &&
            !submitter.toLowerCase().includes(search)
          ) {
            return
          }
        }

        const key = `${sub?.user_id || ''}::${requirementCode || sub?.id}`
        if (existingKeys.has(key)) return
        existingKeys.add(key)

        const finalFileUrl = sub?.file_url || document?.file_url || ''
        const finalFileName = sub?.file_name || document?.file_name || ''

        const storageRef = resolveStorageReference({
          url: finalFileUrl || undefined,
          path: document?.storage_path || document?.folder_path || undefined,
          bucket: document?.storage_bucket || undefined,
        })
        fallbackRows.push({
          id: `fallback-${sub.id}`,
          title: requirement?.name_ko || requirement?.name_en || document?.title || '제출 문서',
          description: document?.description || '',
          document_type:
            requirement?.name_ko || requirement?.name_en || requirementCode || 'unknown',
          document_type_code: requirementCode,
          requirement_id: sub?.requirement_id || requirementCode,
          document_code: requirementCode,
          document_id: sub?.document_id || null,
          file_name: finalFileName,
          file_url: finalFileUrl,
          file_size: document?.file_size || null,
          storage_bucket: document?.storage_bucket || storageRef?.bucket || null,
          storage_path: document?.storage_path || storageRef?.objectPath || null,
          status: fallbackStatus,
          submission_date: sub?.submitted_at || document?.created_at || new Date().toISOString(),
          submitted_by: {
            id: profile?.id,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            role: profile?.role || 'worker',
          },
          site: null,
          submission_id: sub?.id || null,
          _key: key,
          is_placeholder: !finalFileUrl,
        })
      })
    }

    const combinedRows = [...rows, ...fallbackRows].sort((a, b) => {
      const aTime = a?.submission_date ? new Date(a.submission_date).getTime() : 0
      const bTime = b?.submission_date ? new Date(b.submission_date).getTime() : 0
      return bTime - aTime
    })

    const sanitizedRows = combinedRows.map(({ _key, ...rest }) => rest)
    const totalCount = (count || 0) + fallbackRows.length

    return NextResponse.json({
      success: true,
      data: sanitizedRows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
    })
  } catch (error) {
    console.error('submissions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
