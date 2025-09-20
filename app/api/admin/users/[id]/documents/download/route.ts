import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceClient } from '@/lib/supabase/service'


export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = params.id
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('documentType')

    if (!documentType) {
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 })
    }

    // Create service client
    const serviceClient = createServiceClient()

    // Get document record
    const { data: document, error: fetchError } = await serviceClient
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('document_type', documentType)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Get signed URL for download
    const { data: signedUrl, error: urlError } = await serviceClient.storage
      .from('user-documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError || !signedUrl) {
      console.error('Signed URL error:', urlError)
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      downloadUrl: signedUrl.signedUrl,
      filename: document.original_filename,
      mimeType: document.mime_type
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
