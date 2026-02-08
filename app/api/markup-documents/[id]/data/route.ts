import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const documentId = params.id

  // Validate UUID format to prevent Postgres errors with temp IDs (e.g. temp-123)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId)
  if (!isUuid) {
    return NextResponse.json({ markupData: [] })
  }

  // Use service role client for robust internal data access
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role')
  const supabase = createServiceRoleClient()

  // Fetch markup_data
  const { data, error } = await supabase
    .from('markup_documents')
    .select('markup_data')
    .eq('id', documentId)
    .single()

  if (error) {
    // PGRST116 means 0 rows returned for single()
    if (error.code === 'PGRST116') {
      return NextResponse.json({ markupData: [] })
    }
    console.error('Error fetching markup data:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ markupData: data.markup_data || [] })
}
