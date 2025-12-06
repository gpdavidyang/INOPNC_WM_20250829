import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Allow all authenticated roles to read active options
    const allowed = ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']
    if (!authResult.role || !allowed.includes(authResult.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const searchParams = new URL(request.url).searchParams
    const optionType = searchParams.get('option_type')

    let query = supabase
      .from('work_option_settings')
      .select('*')
      .eq('is_active', true)
      .order('option_type', { ascending: true })
      .order('display_order', { ascending: true })

    if (optionType) {
      query = query.eq('option_type', optionType)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data || [])
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
