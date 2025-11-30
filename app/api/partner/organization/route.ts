import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireApiAuth()
  if (auth instanceof NextResponse) return auth

  if (!auth.organizationId) {
    return NextResponse.json({ success: false, error: '조직 정보가 없습니다.' }, { status: 404 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', auth.organizationId)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: '조직 정보를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, organization: data })
}
