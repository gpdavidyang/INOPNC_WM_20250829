import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth

    const supabase = createClient()

    let query = supabase
      .from('notification_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .is('read_at', null as unknown as null)

    // Exclude failed deliveries from unread badge
    try {
      query = query.neq('status', 'failed')
    } catch {
      // ignore if column or operator not available
    }

    const { count, error } = await query
    if (error) {
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ count: 0, error: error?.message || 'error' })
  }
}
