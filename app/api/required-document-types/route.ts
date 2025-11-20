import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', authResult.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const role = profile.role || authResult.role || ''

    console.log('Required document types API - User profile:', profile)

    const searchParams = request.nextUrl.searchParams
    const roleType = searchParams.get('role_type')
    const siteId = searchParams.get('site_id')

    const { data: documents, error } = await supabase
      .from('required_document_types')
      .select(
        `
        id,
        code,
        name_ko,
        name_en,
        description,
        file_types,
        max_file_size,
        instructions,
        valid_duration_days,
        sort_order,
        is_active,
        role_mappings:required_documents_by_role(role_type,is_required),
        site_customizations:site_required_documents(site_id,is_required,due_days)
      `
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching document requirements:', error)
      return NextResponse.json({ error: 'Failed to fetch required documents' }, { status: 500 })
    }

    console.log('Required document types API - Found documents:', documents?.length || 0)

    const filteredDocuments = (documents || []).filter((doc: any) => {
      if (roleType) {
        const allowedForRole =
          Array.isArray(doc.role_mappings) &&
          doc.role_mappings.some(
            (mapping: any) => mapping.role_type === roleType && mapping.is_required
          )
        if (!allowedForRole) return false
      }
      if (siteId) {
        const allowedForSite =
          Array.isArray(doc.site_customizations) &&
          doc.site_customizations.some(
            (customization: any) => customization.site_id === siteId && customization.is_required
          )
        if (!allowedForSite) return false
      }
      return true
    })

    // Transform to expected format for documents-tab.tsx
    const transformedDocuments = filteredDocuments.map((doc: any) => {
      const maxSize = Number(doc.max_file_size) || 5 * 1024 * 1024
      return {
        id: doc.id,
        code: doc.code || doc.id,
        document_type: doc.code || doc.id,
        name_ko: doc.name_ko || doc.name_en,
        name_en: doc.name_en || doc.name_ko,
        description: doc.description,
        instructions: doc.instructions,
        file_types: doc.file_types || ['pdf', 'jpg', 'jpeg', 'png'],
        max_file_size: maxSize,
        max_file_size_mb: Math.round(maxSize / 1024 / 1024),
        valid_duration_days: doc.valid_duration_days,
        sort_order: doc.sort_order || 0,
        isRequired: true,
        submissionStatus: 'not_submitted',
      }
    })

    return NextResponse.json({
      required_documents: transformedDocuments,
      user_role: role,
      site_id: profile.site_id,
      total_count: transformedDocuments.length,
    })
  } catch (error) {
    console.error('Error in GET /api/required-document-types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
