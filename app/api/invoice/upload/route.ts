import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    // profile (for organization context)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, organization_id')
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

    // Compute next version for (site_id, doc_type)
    let newVersion = 1
    try {
      const { data: last } = await supabase
        .from('unified_documents')
        .select('version')
        .eq('category_type', 'invoice')
        .eq('site_id', siteId)
        .eq('document_type', docType)
        .order('version', { ascending: false })
        .limit(1)
      if (Array.isArray(last) && last.length > 0) newVersion = Number(last[0].version || 0) + 1
    } catch {
      // ignore
    }

    const record = {
      title: title || `${docType} - ${file.name}`,
      description,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: urlData.publicUrl,
      storage_path: storagePath,
      category_type: 'invoice',
      document_type: docType,
      site_id: siteId,
      customer_company_id: organizationId,
      uploaded_by: auth.userId,
      status: 'active',
      workflow_status: 'draft',
      is_public: false,
      is_archived: false,
      access_level: 'role',
      tags: [stage ? `invoice_stage:${stage}` : ''].filter(Boolean),
      version: newVersion,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: { stage, doc_type: docType, organization_id: organizationId || undefined },
    }

    const { data: inserted, error: insErr } = await supabase
      .from('unified_documents')
      .insert(record)
      .select('*')
      .single()
    if (insErr) {
      // rollback storage
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: inserted })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
