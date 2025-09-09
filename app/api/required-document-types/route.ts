import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const roleType = searchParams.get('role_type') || profile.role
    const siteId = searchParams.get('site_id') || profile.site_id

    let query = supabase
      .from('required_document_types')
      .select(`
        id,
        code,
        name_ko,
        name_en,
        description,
        file_types,
        max_file_size,
        sort_order,
        role_mappings:required_documents_by_role!inner(
          role_type,
          is_required
        )
      `)
      .eq('is_active', true)
      .eq('role_mappings.role_type', roleType)
      .eq('role_mappings.is_required', true)
      .order('sort_order', { ascending: true })

    const { data: baseDocuments, error: baseError } = await query

    if (baseError) {
      console.error('Error fetching base required documents:', baseError)
      return NextResponse.json({ error: 'Failed to fetch required documents' }, { status: 500 })
    }

    let finalDocuments = baseDocuments || []

    if (siteId) {
      const { data: siteCustomizations, error: siteError } = await supabase
        .from('site_required_documents')
        .select(`
          document_type_id,
          is_required,
          due_days,
          notes,
          document_type:required_document_types(
            id,
            code,
            name_ko,
            name_en,
            description,
            file_types,
            max_file_size,
            sort_order
          )
        `)
        .eq('site_id', siteId)
        .eq('is_required', true)
        .eq('document_type.is_active', true)

      if (!siteError && siteCustomizations) {
        const siteDocumentIds = new Set(siteCustomizations.map(sc => sc.document_type_id))
        
        finalDocuments = finalDocuments.filter(doc => {
          const hasSiteCustomization = siteDocumentIds.has(doc.id)
          return !hasSiteCustomization
        })

        siteCustomizations.forEach(customization => {
          if (customization.document_type) {
            finalDocuments.push({
              ...customization.document_type,
              due_days: customization.due_days,
              notes: customization.notes,
              role_mappings: [{ role_type: roleType, is_required: true }]
            })
          }
        })

        finalDocuments.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      }
    }

    return NextResponse.json({
      required_documents: finalDocuments,
      user_role: roleType,
      site_id: siteId,
      total_count: finalDocuments.length
    })

  } catch (error) {
    console.error('Error in GET /api/required-document-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}