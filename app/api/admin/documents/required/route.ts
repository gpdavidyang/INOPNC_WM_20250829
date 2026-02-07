import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus } from '@/lib/documents/status'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { role, restrictedOrgId } = authResult

    if (!role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (role === 'customer_manager') {
      return NextResponse.json({ error: '필수서류함에 접근할 권한이 없습니다' }, { status: 403 })
    }

    const supabase = createClient()
    const clientToUse = ['admin', 'system_admin'].includes(role) ? createServiceClient() : supabase

    let query = clientToUse
      .from('unified_document_system')
      .select(
        `
        *,
        uploader:profiles!unified_document_system_uploaded_by_fkey(
          id,
          full_name,
          email,
          role
        ),
        site:sites(
          id,
          name,
          address
        ),
        approver:profiles!unified_document_system_approved_by_fkey(
          id,
          full_name,
          role
        )
      `
      )
      .in('category_type', ['required', 'required_user_docs'])
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (!['admin', 'system_admin'].includes(role) && restrictedOrgId) {
      query = query.eq('organization_id', restrictedOrgId)
    }

    const { data: documents, error } = await query

    const documentsWithProfiles = documents || []

    if (error) {
      console.error('Error fetching required documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    console.log('Required documents API - Documents found:', documentsWithProfiles?.length || 0)
    console.log('Required documents API - Sample document:', documentsWithProfiles?.[0])
    console.log(
      'Required documents API - All document titles:',
      documentsWithProfiles?.map((d: unknown) => d.title)
    )

    // Transform data to match the expected format
    const transformedDocuments =
      documentsWithProfiles?.map((doc: unknown) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        document_type:
          doc.tags && doc.tags.length > 0 ? doc.tags[0] : doc.sub_category || 'unknown',
        file_name: doc.file_name,
        file_size: doc.file_size,
        status: normalizeRequiredDocStatus(doc.status === 'uploaded' ? 'pending' : doc.status),
        submission_date: doc.created_at,
        submitted_by: {
          id: doc.uploaded_by,
          full_name: doc.uploader?.full_name || 'Unknown',
          email: doc.uploader?.email || '',
          role: doc.uploader?.role || 'worker',
        },
        organization_name: doc.uploader?.organization_name || '',
        submission_id: (doc as any).metadata?.submission_id || null,
      })) || []

    console.log('Required documents API - Transformed documents:', transformedDocuments.length)
    console.log('Required documents API - Sample transformed:', transformedDocuments[0])

    // 2. Fetch fallbacks from user_document_submissions for docs that might not be in unified_system yet
    const { data: submissionFallback, error: fallbackError } = await clientToUse
      .from('user_document_submissions')
      .select('id, submission_status, submitted_at, requirement_id, user_id, file_url, file_name')
      .neq('submission_status', 'not_submitted')

    let fallbackRows: any[] = []
    if (!fallbackError && submissionFallback) {
      // Get requirement details for fallbacks
      const reqIds = Array.from(
        new Set(submissionFallback.map(s => s.requirement_id).filter(Boolean))
      )
      const userIds = Array.from(new Set(submissionFallback.map(s => s.user_id).filter(Boolean)))

      const [reqs, profiles] = await Promise.all([
        reqIds.length
          ? clientToUse.from('required_document_types').select('id, code, name_ko').in('id', reqIds)
          : Promise.resolve({ data: [] }),
        userIds.length
          ? clientToUse.from('profiles').select('id, full_name, email, role').in('id', userIds)
          : Promise.resolve({ data: [] }),
      ])

      const reqMap = new Map((reqs.data || []).map((r: any) => [r.id, r]))
      const profileMap = new Map((profiles.data || []).map((p: any) => [p.id, p]))

      const existingDocIds = new Set(
        transformedDocuments.map((d: any) => d.submission_id).filter(Boolean)
      )

      fallbackRows = submissionFallback
        .filter(sub => !existingDocIds.has(sub.id))
        .map(sub => {
          const req = reqMap.get(sub.requirement_id)
          const profile = profileMap.get(sub.user_id)
          return {
            id: `fallback-${sub.id}`,
            title: req?.name_ko || '제출 문서',
            description: '',
            document_type: req?.code || req?.name_ko || 'unknown',
            file_name: sub.file_name || '',
            file_size: null,
            status: normalizeRequiredDocStatus(sub.submission_status),
            submission_date: sub.submitted_at || new Date().toISOString(),
            submitted_by: {
              id: sub.user_id,
              full_name: profile?.full_name || 'Unknown',
              email: profile?.email || '',
              role: profile?.role || 'worker',
            },
            organization_name: '',
            submission_id: sub.id,
          }
        })
    }

    const finalDocuments = [...transformedDocuments, ...fallbackRows].sort(
      (a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime()
    )

    return NextResponse.json({
      success: true,
      documents: finalDocuments,
      total: finalDocuments.length,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
