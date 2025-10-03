export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { fullName, jobTitle, phone, email, partnerCompanyId } = body || {}

    if (!fullName || !jobTitle || !phone || !email || !partnerCompanyId) {
      return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Resolve partner company name by id
    const { data: company, error: companyErr } = await admin
      .from('partner_companies')
      .select('company_name')
      .eq('id', partnerCompanyId)
      .single()

    if (companyErr || !company) {
      return NextResponse.json({ error: '파트너사 정보를 찾을 수 없습니다.' }, { status: 400 })
    }

    // Prevent duplicate requests for the same email
    const { data: existing } = await admin
      .from('signup_requests')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: '이미 승인 요청이 제출된 이메일입니다.' }, { status: 409 })
    }

    const { error: insertErr } = await admin.from('signup_requests').insert({
      full_name: fullName,
      company: company.company_name,
      job_title: jobTitle,
      phone,
      email,
      job_type: 'construction',
      status: 'pending',
      requested_at: new Date().toISOString(),
    } as any)

    if (insertErr) {
      return NextResponse.json({ error: '승인 요청 제출에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[SIGNUP-REQUEST] Error:', e)
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
