import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createServiceRoleClient()

    // profile (for organization context)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, organization_id, partner_company_id')
      .eq('id', auth.userId)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const form = await request.formData()
    const file = form.get('file') as File | null
    const siteId = String(form.get('site_id') || '')
    const docType = String(form.get('doc_type') || '')
    const stage = String(form.get('stage') || '')
    const organizationId = String(form.get('organization_id') || '') || null
    const title = String(form.get('title') || '')
    const description = String(form.get('description') || '')

    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })
    if (!siteId) return NextResponse.json({ error: 'site_id is required' }, { status: 400 })
    if (!docType) return NextResponse.json({ error: 'doc_type is required' }, { status: 400 })

    // Validate file size/type similarly to unified-documents upload
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB' }, { status: 400 })
    }
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ]
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    // Build storage path
    const sanitized = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_')
    const unique = `${Date.now()}_${sanitized}`
    const storagePath = `invoice/${siteId}/${docType}/${unique}`

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer())
    const { error: upErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })
    if (upErr) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath)

    const record = {
      title: title || file.name,
      description: description || null,
      file_name: file.name,
      mime_type: file.type,
      file_url: urlData.publicUrl,
      file_size: file.size,
      category_type: 'invoice',
      sub_category: stage || null,
      metadata: {
        doc_type: docType,
        ...(stage ? { stage } : {}),
        ...(organizationId ? { organization_id: organizationId } : {}),
      },
      site_id: siteId,
      customer_company_id: organizationId || profile.partner_company_id || null,
      uploaded_by: auth.userId,
      status: 'uploaded',
      is_public: false,
      is_archived: false,
      approval_required: false,
      approved_by: null,
      approved_at: null,
      tags: stage ? [`invoice_stage:${stage}`] : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error: insErr } = await supabase
      .from('unified_document_system')
      .insert(record)
      .select('*')
      .single()
    if (insErr) {
      console.error('[invoice/upload] insert failed', insErr)
      // rollback storage
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json(
        {
          error: insErr.message || 'DB insert failed',
          details: insErr.details,
          hint: insErr.hint,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: inserted })
  } catch (e) {
    console.error('[invoice/upload] error', e)
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
