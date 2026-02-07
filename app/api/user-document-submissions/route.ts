import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { normalizeRequiredDocStatus, type RequiredDocStatus } from '@/lib/documents/status'
import { resolveStorageReference } from '@/lib/storage/paths'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    console.log('User document submissions API - User ID:', authResult.userId)

    // Get user's document submission status
    const { data: submissions, error } = await supabase
      .from('user_document_submissions')
      .select(
        `
        *,
        requirement:required_document_types(*)
      `
      )
      .eq('user_id', authResult.userId)
      .order('created_at', { ascending: false })

    console.log('User document submissions API - Submissions found:', submissions?.length || 0)
    console.log('User document submissions API - Error:', error)

    if (error) {
      console.error('Error fetching user submissions:', error)
      // Return empty array if table doesn't exist
      return NextResponse.json({
        success: true,
        data: [],
        source: 'fallback',
      })
    }

    // Fetch referenced documents separately (no FK relationship in schema cache)
    const submissionList = submissions || []
    const documentIds = Array.from(
      new Set(
        submissionList
          .map((submission: any) => {
            const value = submission?.document_id
            return typeof value === 'string' && value.length > 0 ? value : null
          })
          .filter(Boolean) as string[]
      )
    )

    let documentsById = new Map<string, any>()
    if (documentIds.length > 0) {
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select(
          'id, title, file_name, file_url, document_type, mime_type, created_at, description, folder_path'
        )
        .in('id', documentIds)

      if (docsError) {
        console.error('User document submissions API - Document fetch error:', docsError)
      } else if (docs) {
        documentsById = new Map(docs.map(doc => [doc.id, doc]))
      }
    }

    const legacyStatusUpdates: Array<{ id: string; submission_status: RequiredDocStatus }> = []

    const enrichedSubmissions = submissionList.map((submission: any) => {
      const docFromLookup = submission?.document
      const docFromJoin = documentsById.get(submission?.document_id)
      let documentPayload = docFromLookup || docFromJoin || null

      if (!documentPayload && submission?.file_url) {
        documentPayload = {
          id: submission.document_id || null,
          title: submission.file_name || '제출 문서',
          file_name: submission.file_name,
          file_url: submission.file_url,
          created_at: submission.submitted_at,
          document_type: submission.document_type || null,
          storage_bucket: null,
          storage_path: null,
        }
      }

      if (documentPayload) {
        const storageRef = resolveStorageReference({
          url: documentPayload.file_url || undefined,
          bucket: (documentPayload as any).storage_bucket || undefined,
          path:
            (documentPayload as any).storage_path ||
            (documentPayload as any).folder_path ||
            undefined,
        })
        if (!(documentPayload as any).storage_bucket && storageRef?.bucket) {
          ;(documentPayload as any).storage_bucket = storageRef.bucket
        }
        if (!(documentPayload as any).storage_path && storageRef?.objectPath) {
          ;(documentPayload as any).storage_path = storageRef.objectPath
        }
      }

      const canonicalStatus = normalizeRequiredDocStatus(submission?.submission_status)
      if (
        submission?.id &&
        canonicalStatus !== submission?.submission_status &&
        typeof submission.id === 'string'
      ) {
        legacyStatusUpdates.push({
          id: submission.id,
          submission_status: canonicalStatus,
        })
      }

      return {
        ...submission,
        submission_status: canonicalStatus,
        document: documentPayload,
      }
    })

    if (legacyStatusUpdates.length > 0) {
      try {
        const updates = legacyStatusUpdates.map(update => ({
          id: update.id,
          submission_status: update.submission_status,
          updated_at: new Date().toISOString(),
        }))
        await supabase.from('user_document_submissions').upsert(updates, {
          onConflict: 'id',
        })
      } catch (statusError) {
        console.warn('Failed to backfill legacy submission statuses:', statusError)
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedSubmissions,
      source: 'database',
    })
  } catch (error) {
    console.error('Error in user document submissions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const body = await request.json()
    const { requirement_id, document_id, file_url, file_name } = body

    if (!requirement_id) {
      return NextResponse.json({ error: 'requirement_id is required' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    // Status is 'pending' if there is a document linked OR a file uploaded
    const status: RequiredDocStatus = document_id || file_url ? 'submitted' : 'not_submitted'

    const payload: Record<string, any> = {
      user_id: authResult.userId,
      requirement_id,
      document_id: document_id || null,
      submission_status: status,
      file_url: file_url || null,
      file_name: file_name || null,
      submitted_at: document_id || file_url ? timestamp : null,
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      reviewed_by: null,
      updated_at: timestamp,
    }

    const { data: existingRows, error: existingError } = await supabase
      .from('user_document_submissions')
      .select('id')
      .eq('user_id', authResult.userId)
      .eq('requirement_id', requirement_id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingError) {
      console.error('Error checking existing submission:', existingError)
      return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
    }

    let data
    let error

    if (existingRows && existingRows.length > 0) {
      const existingId = existingRows[0]?.id
      ;({ data, error } = await supabase
        .from('user_document_submissions')
        .update(payload)
        .eq('id', existingId)
        .select())
    } else {
      ;({ data, error } = await supabase.from('user_document_submissions').insert(payload).select())
    }

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
    })
  } catch (error) {
    console.error('Error in POST user document submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authResult.userId)
      .single()

    const isAdmin = profile?.role && ['admin', 'system_admin'].includes(profile.role)

    const body = await request.json()
    const { submission_id, status, rejection_reason, reviewed_by } = body

    if (!submission_id || !status) {
      return NextResponse.json({ error: 'submission_id and status are required' }, { status: 400 })
    }

    const normalizedStatus = normalizeRequiredDocStatus(status)

    // Only admins can approve/reject submissions
    if (['approved', 'rejected'].includes(normalizedStatus) && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {
      submission_status: normalizedStatus,
      updated_at: new Date().toISOString(),
    }

    if (normalizedStatus === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.rejected_at = null
      updateData.rejection_reason = null
      updateData.reviewed_by = reviewed_by || authResult.userId
    } else if (normalizedStatus === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = rejection_reason
      updateData.approved_at = null
      updateData.reviewed_by = reviewed_by || authResult.userId
    }

    const { data, error } = await supabase
      .from('user_document_submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select()

    if (error) {
      console.error('Error updating submission status:', error)
      return NextResponse.json({ error: 'Failed to update submission status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
    })
  } catch (error) {
    console.error('Error in PUT user document submissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
