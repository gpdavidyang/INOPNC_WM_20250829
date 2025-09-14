
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 마킹 문서 조회
    const { data: document, error: docError } = await supabase
      .from('markup_documents')
      .select('*')
      .eq('id', params.id)
      .eq('is_deleted', false)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // 마킹 도구로 리다이렉트 (뷰 모드)
    const markupViewerUrl = `/dashboard/markup?file=${document.id}&mode=view`
    
    // 브라우저에서 직접 접근한 경우 마킹 뷰어로 리다이렉트
    const userAgent = request.headers.get('user-agent') || ''
    const isDirectBrowserAccess = userAgent.includes('Mozilla') && !userAgent.includes('bot')
    
    if (isDirectBrowserAccess) {
      return NextResponse.redirect(new URL(markupViewerUrl, request.url))
    }

    // API 호출인 경우 문서 정보 반환
    return NextResponse.json({
      success: true,
      data: {
        ...document,
        viewer_url: markupViewerUrl,
        type: 'markup-document'
      }
    })

  } catch (error) {
    console.error('Error serving markup document file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}