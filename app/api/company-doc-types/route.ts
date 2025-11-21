import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'
import {
  COMPANY_DOC_SLUG_REGEX,
  DEFAULT_COMPANY_DOCUMENT_TYPES,
  detectCompanyDocSlug,
  normalizeCompanyDocumentTypes,
} from '@/lib/documents/company-types'

export const dynamic = 'force-dynamic'

const ADMIN_ROLES = new Set(['admin', 'system_admin'])

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '') // keep simple to avoid undefined

const assertAdmin = (auth: { role?: string | null }) =>
  ADMIN_ROLES.has(String(auth?.role || '').trim())

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  const supabase = createClient()
  const activeOnly = request.nextUrl.searchParams.get('active') === 'true'
  const includeDocs = request.nextUrl.searchParams.get('include_docs') === 'true'

  try {
    const query = supabase.from('company_document_types').select('*').order('display_order', {
      ascending: true,
    })
    if (activeOnly) query.eq('is_active', true)

    const { data, error } = await query
    if (error) {
      if ((error as any)?.code === '42P01') {
        console.warn('[company-doc-types] table missing, falling back to defaults')
        return NextResponse.json({
          success: true,
          fallback: true,
          data: DEFAULT_COMPANY_DOCUMENT_TYPES,
        })
      }
      console.error('[company-doc-types] failed to fetch:', error)
      return NextResponse.json({ error: 'Failed to load company document types' }, { status: 500 })
    }

    const normalized = normalizeCompanyDocumentTypes(data || [])
    const fallbackNeeded = !normalized.length

    let documentsBySlug: Record<string, any[]> = {}
    let unmatchedDocuments: any[] = []
    if (includeDocs) {
      const preparedDocs: any[] = []

      const columnVariants = [
        'id,title,file_name,file_url,folder_path,tags,document_type,status,created_at,metadata,storage_bucket,storage_path',
        'id,title,file_name,file_url,folder_path,tags,document_type,status,created_at,metadata',
        'id,title,file_name,file_url,tags,document_type,status,created_at,metadata',
        'id,title,file_name,file_url,tags,document_type,status,created_at',
      ]
      let docQuery: { data: any[] | null; error: any; note?: string } | null = null

      for (const columns of columnVariants) {
        const query = await supabase
          .from('unified_documents')
          .select(columns)
          .eq('category_type', 'shared')
          .in('status', ['uploaded', 'active', 'approved', 'draft'])
          .order('created_at', { ascending: false })
          .limit(500)
        docQuery = { data: query.data, error: query.error, note: columns }
        if (!query.error || query.error?.code !== '42703') {
          break
        }
      }

      if (!docQuery) {
        docQuery = { data: null, error: new Error('Unknown query state') }
      }

      if (!docQuery.error && Array.isArray(docQuery.data)) {
        preparedDocs.push(
          ...docQuery.data.map(doc => ({
            ...doc,
            metadata:
              doc?.metadata && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata)
                ? doc.metadata
                : null,
            tags: Array.isArray(doc?.tags) ? doc.tags : [],
          }))
        )
      } else {
        console.warn(
          '[company-doc-types] unified_documents lookup failed, falling back to unified_document_system',
          docQuery.error
        )
        const fallback = await supabase
          .from('unified_document_system')
          .select('*')
          .eq('category_type', 'shared')
          .order('created_at', { ascending: false })
          .limit(500)
        if (!fallback.error && Array.isArray(fallback.data)) {
          preparedDocs.push(
            ...fallback.data.map(doc => ({
              id: doc.id,
              title: doc.title || doc.file_name || '문서',
              file_name: doc.file_name || null,
              file_url: doc.file_url || null,
              storage_bucket: doc.storage_bucket ?? doc.bucket ?? null,
              storage_path: doc.storage_path ?? doc.folder_path ?? null,
              folder_path: doc.folder_path ?? null,
              tags: Array.isArray(doc?.tags) ? doc.tags : [],
              document_type: doc.document_type || doc.category_type || null,
              status: doc.status || null,
              created_at: doc.created_at,
              metadata:
                doc?.metadata && typeof doc.metadata === 'object' && !Array.isArray(doc.metadata)
                  ? doc.metadata
                  : null,
            }))
          )
        } else if (fallback.error) {
          console.warn('[company-doc-types] legacy fallback failed:', fallback.error)
        }
      }

      preparedDocs.forEach(doc => {
        const slug = detectCompanyDocSlug(doc, {})
        const normalized = {
          ...doc,
          storage_bucket:
            doc.storage_bucket ??
            doc.bucket ??
            doc.metadata?.storage_bucket ??
            doc.metadata?.bucket ??
            null,
          storage_path:
            doc.storage_path ??
            doc.folder_path ??
            doc.metadata?.storage_path ??
            doc.metadata?.path ??
            null,
          folder_path: doc.folder_path ?? null,
        }

        if (slug) {
          if (!documentsBySlug[slug]) documentsBySlug[slug] = []
          documentsBySlug[slug].push(normalized)
        } else {
          unmatchedDocuments.push(normalized)
        }
      })
    }

    return NextResponse.json({
      success: true,
      fromDefaultSeed: fallbackNeeded,
      data: (fallbackNeeded ? DEFAULT_COMPANY_DOCUMENT_TYPES : normalized).map(item => ({
        ...item,
        documents: includeDocs ? documentsBySlug[item.slug] || [] : undefined,
      })),
      unmatchedDocuments: includeDocs ? unmatchedDocuments : undefined,
    })
  } catch (err) {
    console.error('[company-doc-types] unexpected error:', err)
    return NextResponse.json({ error: 'Failed to load company document types' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  if (!assertAdmin(auth)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const slug = normalizeString((payload as any).slug).toLowerCase()
  const name = normalizeString((payload as any).name)
  const description = normalizeString((payload as any).description)
  const displayOrder =
    typeof (payload as any).display_order === 'number' ? (payload as any).display_order : 100
  const isRequired = Boolean((payload as any).is_required)
  const isActive =
    typeof (payload as any).is_active === 'boolean' ? (payload as any).is_active : true
  const defaultVisibility = normalizeString((payload as any).default_visibility) || 'shared'

  if (!slug || !COMPANY_DOC_SLUG_REGEX.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
  }
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('company_document_types')
    .insert({
      slug,
      name,
      description: description || null,
      display_order: displayOrder,
      is_required: isRequired,
      is_active: isActive,
      default_visibility: defaultVisibility,
    })
    .select('*')
    .single()

  if (error) {
    if ((error as any)?.code === '42P01') {
      return NextResponse.json(
        { error: 'company_document_types table is missing. Please apply the latest migration.' },
        { status: 503 }
      )
    }
    console.error('[company-doc-types] failed to create:', error)
    return NextResponse.json({ error: 'Failed to create document type' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data })
}
