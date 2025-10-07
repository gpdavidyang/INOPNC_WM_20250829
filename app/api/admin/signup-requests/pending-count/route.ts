import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth
  try {
    const supabase = createClient()
    const { count, error } = await supabase
      .from('signup_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (error) throw error
    return NextResponse.json({ success: true, count: count || 0 })
  } catch (e) {
    console.error('[pending-count] error:', e)
    return NextResponse.json({ success: false, count: 0 }, { status: 200 })
  }
}
