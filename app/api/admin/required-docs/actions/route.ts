import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import { resolveStorageReference } from '@/lib/storage/paths'

const FALLBACK_PREFIX = 'fallback-'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const { role, userId } = auth as any
    if (!['admin', 'system_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Only administrators can update required documents' },
        { status: 403 }
      )
    }

    const { action, id, submissionId, reason } = await request.json()
    let targetId: string | null = typeof id === 'string' ? id : null
    if (!targetId && typeof submissionId === 'string' && submissionId) {
      targetId = `${FALLBACK_PREFIX}${submissionId}`
    }
    if (!targetId || !['approve', 'reject', 'delete'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const supabase = createClient()
    let db = supabase
    try {
      db = createServiceClient()
    } catch (serviceError) {
      console.warn('Falling back to supabase client for required-doc actions:', serviceError)
    }

    const isFallbackId = targetId.startsWith(FALLBACK_PREFIX)
    if (isFallbackId) {
      const handled = await handleFallbackSubmissionAction({
        supabase: db,
        submissionId: targetId.replace(FALLBACK_PREFIX, ''),
        action: action as 'approve' | 'reject' | 'delete',
        reviewerId: userId,
        rejectionReason: typeof reason === 'string' ? reason : undefined,
      })
      if (!handled.ok) {
        return NextResponse.json(
          { error: handled.error || 'Failed to process submission' },
          { status: handled.status || 400 }
        )
      }
      return NextResponse.json({ success: true })
    }

    const { data: docRecord, error: docError } = await db
      .from('unified_document_system')
      .select('id, uploaded_by, sub_category, metadata')
      .eq('id', targetId)
      .single()

    if (docError || !docRecord) {
      console.error('Document not found for required-doc action:', docError)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (action === 'approve') {
      const { error } = await db
        .from('unified_document_system')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
      if (error) {
        console.error('approve error:', error)
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
      }
    } else if (action === 'reject') {
      const { error } = await db
        .from('unified_document_system')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
      if (error) {
        console.error('reject error:', error)
        return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
      }
    } else if (action === 'delete') {
      const { error } = await db.from('unified_document_system').delete().eq('id', targetId)
      if (error) {
        console.error('delete error:', error)
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
      }
    }

    await syncUserSubmissionStatus({
      supabase: db,
      requiredCode: docRecord.sub_category as string | null,
      requirementId: (docRecord.metadata as any)?.requirement_id || null,
      userId: docRecord.uploaded_by as string | null,
      action,
      reviewerId: userId,
      rejectionReason: typeof reason === 'string' ? reason : undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('actions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function syncUserSubmissionStatus({
  supabase,
  requiredCode,
  requirementId,
  userId,
  action,
  reviewerId,
  rejectionReason,
}: {
  supabase: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient>
  requiredCode: string | null
  requirementId: string | null
  userId: string | null
  action: 'approve' | 'reject' | 'delete'
  reviewerId: string
  rejectionReason?: string
}) {
  try {
    if (!userId) return
    let requirementKey = requirementId
    if (!requirementKey && requiredCode) {
      const { data: requirement } = await supabase
        .from('required_document_types')
        .select('id')
        .eq('code', requiredCode)
        .maybeSingle()
      requirementKey = requirement?.id || null
    }
    if (!requirementKey) return
    const now = new Date().toISOString()
    const payload: Record<string, unknown> = {
      submission_status:
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'not_submitted',
      updated_at: now,
      reviewed_by: reviewerId,
    }
    if (action === 'approve') {
      payload.approved_at = now
      payload.rejected_at = null
      payload.rejection_reason = null
    } else if (action === 'reject') {
      payload.rejected_at = now
      payload.approved_at = null
      if (rejectionReason) payload.rejection_reason = rejectionReason
    } else if (action === 'delete') {
      payload.approved_at = null
      payload.rejected_at = null
      payload.rejection_reason = null
      payload.document_id = null
    }
    await supabase
      .from('user_document_submissions')
      .update(payload)
      .eq('user_id', userId)
      .eq('requirement_id', requirementKey)
  } catch (error) {
    console.error('Failed to sync user submission status:', error)
  }
}

async function handleFallbackSubmissionAction({
  supabase,
  submissionId,
  action,
  reviewerId,
  rejectionReason,
}: {
  supabase: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient>
  submissionId: string
  action: 'approve' | 'reject' | 'delete'
  reviewerId: string
  rejectionReason?: string
}): Promise<{ ok: boolean; error?: string; status?: number }> {
  const { data: submission, error: submissionError } = await supabase
    .from('user_document_submissions')
    .select('id, user_id, requirement_id, document_id, submission_status, submitted_at')
    .eq('id', submissionId)
    .maybeSingle()

  if (submissionError || !submission) {
    console.error('Fallback submission not found:', submissionError)
    return { ok: false, error: '제출 정보를 찾을 수 없습니다.', status: 404 }
  }

  const requirement =
    submission.requirement_id &&
    (
      await supabase
        .from('required_document_types')
        .select('id, code, name_ko, name_en, instructions')
        .eq('id', submission.requirement_id)
        .maybeSingle()
    ).data

  const document =
    submission.document_id &&
    (
      await supabase
        .from('documents')
        .select(
          'id, title, description, file_name, file_url, file_size, mime_type, storage_bucket, storage_path, folder_path, metadata, site_id'
        )
        .eq('id', submission.document_id)
        .maybeSingle()
    ).data

  if (!document && action !== 'delete') {
    return {
      ok: false,
      error: '첨부된 파일이 없어 승인/반려를 진행할 수 없습니다.',
      status: 400,
    }
  }

  const now = new Date().toISOString()
  const updatePayload: Record<string, any> = {
    updated_at: now,
    reviewed_by: reviewerId,
  }
  if (action === 'approve') {
    updatePayload.submission_status = 'approved'
    updatePayload.approved_at = now
    updatePayload.rejected_at = null
    updatePayload.rejection_reason = null
  } else if (action === 'reject') {
    updatePayload.submission_status = 'rejected'
    updatePayload.rejected_at = now
    updatePayload.approved_at = null
    updatePayload.rejection_reason = rejectionReason || null
  } else if (action === 'delete') {
    updatePayload.submission_status = 'not_submitted'
    updatePayload.document_id = null
    updatePayload.submitted_at = null
    updatePayload.approved_at = null
    updatePayload.rejected_at = null
    updatePayload.rejection_reason = null
  }

  const { error: updateError } = await supabase
    .from('user_document_submissions')
    .update(updatePayload)
    .eq('id', submission.id)

  if (updateError) {
    console.error('Failed to update fallback submission:', updateError)
    return { ok: false, error: '제출 상태를 변경할 수 없습니다.', status: 500 }
  }

  if (action === 'delete') {
    await removeUnifiedDocForSubmission({ supabase, submission, documentId: document?.id || null })
    return { ok: true }
  }

  await upsertUnifiedDocFromSubmission({
    supabase,
    submission,
    requirement,
    document: document!,
    action,
    reviewerId,
    rejectionReason,
  })

  return { ok: true }
}

async function removeUnifiedDocForSubmission({
  supabase,
  submission,
  documentId,
}: {
  supabase: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient>
  submission: { id: string; user_id: string | null }
  documentId: string | null
}) {
  try {
    if (!submission?.user_id || !documentId) return
    await supabase
      .from('unified_document_system')
      .delete()
      .eq('category_type', 'required_user_docs')
      .eq('uploaded_by', submission.user_id)
      .eq('document_id', documentId)
  } catch (error) {
    console.error('Failed to remove unified doc for submission:', error)
  }
}

async function upsertUnifiedDocFromSubmission({
  supabase,
  submission,
  requirement,
  document,
  action,
  reviewerId,
  rejectionReason,
}: {
  supabase: ReturnType<typeof createServiceClient> | ReturnType<typeof createClient>
  submission: { id: string; user_id: string | null; requirement_id: string | null }
  requirement?: {
    id: string
    code?: string | null
    name_ko?: string | null
    name_en?: string | null
    instructions?: string | null
  } | null
  document: any
  action: 'approve' | 'reject'
  reviewerId: string
  rejectionReason?: string
}) {
  try {
    if (!submission.user_id) return
    const requirementCode = requirement?.code || null
    const storageRef = resolveStorageReference({
      url: document?.file_url || undefined,
      bucket: document?.storage_bucket || undefined,
      path: document?.storage_path || document?.folder_path || undefined,
    })
    const basePayload: Record<string, any> = {
      title:
        requirement?.name_ko ||
        requirement?.name_en ||
        document?.title ||
        document?.file_name ||
        '제출 문서',
      description: document?.description || requirement?.instructions || '',
      file_name: document?.file_name,
      file_size: document?.file_size,
      file_url: document?.file_url,
      mime_type: document?.mime_type,
      storage_bucket: document?.storage_bucket || storageRef?.bucket || null,
      storage_path: document?.storage_path || storageRef?.objectPath || null,
      document_id: document?.id || null,
      category_type: 'required_user_docs',
      sub_category: requirementCode,
      tags: requirementCode ? [requirementCode] : null,
      uploaded_by: submission.user_id,
      site_id: document?.site_id || null,
      updated_at: new Date().toISOString(),
      metadata: {
        ...(typeof document?.metadata === 'object' ? document.metadata : {}),
        requirement_id: requirement?.id || submission.requirement_id,
        requirement_code: requirementCode,
        requirement_name: requirement?.name_ko || requirement?.name_en || null,
        submission_id: submission.id,
      },
    }
    if (action === 'approve') {
      basePayload.status = 'approved'
      basePayload.approved_at = basePayload.updated_at
      basePayload.approved_by = reviewerId
      basePayload.rejection_reason = null
    } else if (action === 'reject') {
      basePayload.status = 'rejected'
      basePayload.approved_at = null
      basePayload.approved_by = null
      basePayload.rejection_reason = rejectionReason || null
    }

    let existingId: string | null = null
    if (document?.id) {
      const { data: existingDoc } = await supabase
        .from('unified_document_system')
        .select('id')
        .eq('category_type', 'required_user_docs')
        .eq('document_id', document.id)
        .maybeSingle()
      existingId = existingDoc?.id || null
    }
    if (!existingId && requirementCode) {
      const { data: fallbackExisting } = await supabase
        .from('unified_document_system')
        .select('id')
        .eq('category_type', 'required_user_docs')
        .eq('uploaded_by', submission.user_id)
        .eq('sub_category', requirementCode)
        .order('created_at', { ascending: false })
        .limit(1)
      existingId = fallbackExisting?.[0]?.id || null
    }

    if (existingId) {
      await supabase.from('unified_document_system').update(basePayload).eq('id', existingId)
    } else {
      await supabase.from('unified_document_system').insert(basePayload)
    }
  } catch (error) {
    console.error('Failed to upsert unified doc from submission:', error)
  }
}
