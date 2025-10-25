import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const supabase = await createClient()
    const payload = await request.json()
    const { data, error } = await supabase
      .from('photo_sheet_previews')
      .insert({ created_by: auth.userId, payload })
      .select('id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id: data.id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create preview' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true })
}
