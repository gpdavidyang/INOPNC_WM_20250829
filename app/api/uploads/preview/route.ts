import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = createClient()

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ success: false, error: 'file required' }, { status: 400 })

    const ext = (file.name.split('.').pop() || 'png').toLowerCase()
    const safeExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png'
    const path = `markups/previews/${auth.userId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${safeExt}`

    const { data: up, error: upErr } = await supabase.storage
      .from('documents')
      .upload(path, file, { contentType: file.type || `image/${safeExt}`, duplex: 'half' })
    if (upErr)
      return NextResponse.json(
        { success: false, error: upErr.message || 'upload failed' },
        { status: 500 }
      )

    const { data: pub } = supabase.storage.from('documents').getPublicUrl(up.path)
    return NextResponse.json({ success: true, url: pub.publicUrl, path: up.path })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Internal error' },
      { status: 500 }
    )
  }
}
