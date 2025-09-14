
// POST /api/shared-documents/[id]/share - Generate sharing token
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { expiresInHours = 24, allowDownload = true } = await request.json()

    // Check if user has share permission for this document
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: user.id,
      p_permission_type: 'share'
    } as unknown)

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + expiresInHours)

    // Store sharing token
    const { data: shareToken, error: tokenError } = await supabase
      .from('document_share_tokens')
      .insert({
        document_id: params.id,
        token,
        created_by: user.id,
        expires_at: expiresAt.toISOString(),
        allow_download: allowDownload,
        max_uses: null, // Unlimited uses for now
        used_count: 0
      })
      .select()
      .single()

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json({ error: 'Failed to create share token' }, { status: 500 })
    }

    // Generate share URL
    const baseUrl = request.nextUrl.origin
    const shareUrl = `${baseUrl}/shared/${params.id}?token=${token}`

    // Log share action
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: user.id,
      action: 'generate_share_link',
      details: {
        token_id: shareToken.id,
        expires_at: expiresAt.toISOString(),
        allow_download: allowDownload
      }
    })

    return NextResponse.json({
      shareUrl,
      token,
      expiresAt: expiresAt.toISOString(),
      message: 'Share link generated successfully'
    })

  } catch (error) {
    console.error('Share API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/shared-documents/[id]/share - Get existing share tokens
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has share permission for this document
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: user.id,
      p_permission_type: 'share'
    } as unknown)

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get active share tokens
    const { data: tokens, error } = await supabase
      .from('document_share_tokens')
      .select(`
        id,
        token,
        expires_at,
        allow_download,
        max_uses,
        used_count,
        created_at,
        created_by_user:profiles!document_share_tokens_created_by_fkey(name, email)
      `)
      .eq('document_id', params.id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching share tokens:', error)
      return NextResponse.json({ error: 'Failed to fetch share tokens' }, { status: 500 })
    }

    // Generate URLs for each token
    const baseUrl = request.nextUrl.origin
    const tokensWithUrls = (tokens || []).map((token: unknown) => ({
      ...token,
      shareUrl: `${baseUrl}/shared/${params.id}?token=${token.token}`
    }))

    return NextResponse.json({ tokens: tokensWithUrls })

  } catch (error) {
    console.error('Share API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/shared-documents/[id]/share - Revoke all share tokens
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has share permission for this document
    const hasPermission = await supabase.rpc('check_document_permission', {
      p_document_id: params.id,
      p_user_id: user.id,
      p_permission_type: 'share'
    } as unknown)

    if (!hasPermission.data) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Set all active tokens to expire immediately
    const { error } = await supabase
      .from('document_share_tokens')
      .update({ expires_at: new Date().toISOString() })
      .eq('document_id', params.id)
      .gt('expires_at', new Date().toISOString())

    if (error) {
      console.error('Error revoking share tokens:', error)
      return NextResponse.json({ error: 'Failed to revoke share tokens' }, { status: 500 })
    }

    // Log revocation
    await supabase.from('document_access_logs').insert({
      document_id: params.id,
      user_id: user.id,
      action: 'revoke_share_links',
      details: { revoked_at: new Date().toISOString() }
    })

    return NextResponse.json({ message: 'All share links revoked successfully' })

  } catch (error) {
    console.error('Share API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}