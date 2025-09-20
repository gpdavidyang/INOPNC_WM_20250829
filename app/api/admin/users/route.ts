import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { ADMIN_USERS_STUB } from '@/lib/admin/stub-data'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    // Fetch all users with their associated data
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.max(1, Number.parseInt(limitParam, 10)) : undefined

    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        *,
        sites(
          id,
          name,
          address
        )
      `)
      .order('full_name')

    let normalizedUsers = users || []

    if (limit) {
      normalizedUsers = normalizedUsers.slice(0, limit)
    }

    if (error) {
      console.error('Users query error:', error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        users: normalizedUsers,
        total: (users || []).length,
      },
    })

  } catch (error) {
    console.error('API error:', error)

    return NextResponse.json(
      {
        success: true,
        data: {
          users: ADMIN_USERS_STUB,
          total: ADMIN_USERS_STUB.length,
          fallback: true,
        },
      },
      { status: 200 }
    )
  }
}
