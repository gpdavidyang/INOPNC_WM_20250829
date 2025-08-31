import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'
import { generatePhotoGridPDF } from '@/lib/pdf/photo-grid-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get the photo grid data
    const { data: photoGrid, error } = await supabase
      .from('photo_grids')
      .select(`
        *,
        site:sites(id, name, address),
        creator:profiles(id, full_name)
      `)
      .eq('id', params.id)
      .single()

    if (error || !photoGrid) {
      console.error('Error fetching photo grid:', error)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await generatePhotoGridPDF(photoGrid)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="photo-grid-${photoGrid.work_date || 'document'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/photo-grids/[id]/download:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}