import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

export const dynamic = 'force-dynamic'

const ALLOWED_ROLES = ['worker', 'site_manager', 'customer_manager', 'admin', 'system_admin']

type UserOption = {
  id: string
  name: string
  role?: string
}

export async function GET() {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) {
      return auth
    }

    const { role, userId, email } = auth
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['worker', 'site_manager'])
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[mobile][site-workers] profile fetch failed', error)
      return NextResponse.json({ error: 'Failed to load worker profiles' }, { status: 500 })
    }

    const userMap = new Map<string, UserOption>()

    const addUser = (user?: {
      id?: string | null
      full_name?: string | null
      role?: string | null
    }) => {
      if (!user?.id) return
      userMap.set(user.id, {
        id: user.id,
        name: user.full_name || '이름없음',
        role: user.role || undefined,
      })
    }

    data?.forEach(profile => addUser(profile))

    addUser({
      id: userId,
      full_name: email || '사용자',
      role,
    })

    const result = Array.from(userMap.values()).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'ko', { sensitivity: 'base' })
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[mobile][site-workers] unexpected error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
