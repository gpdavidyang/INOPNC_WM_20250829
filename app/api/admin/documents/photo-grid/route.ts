import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Fetch photo grid type documents
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        site:sites!documents_site_id_fkey(id, name),
        creator:profiles!documents_owner_id_fkey(id, full_name)
      `)
      .eq('document_type', 'report') // Photo grids stored as reports
      .ilike('title', '%사진대지%') // Filter for photo grid reports
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching photo grid documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/admin/documents/photo-grid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}