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
    
    // Fetch photo grid type documents from unified table
    const { data, error } = await supabase
      .from('unified_document_system')
      .select(`
        *,
        sites(id, name),
        profiles!unified_document_system_uploaded_by_fkey(id, full_name)
      `)
      .eq('category_type', 'photo_grid')
      .eq('status', 'active')
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