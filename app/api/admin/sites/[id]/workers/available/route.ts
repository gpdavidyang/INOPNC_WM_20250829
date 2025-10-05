import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const supabase = createClient()

    const siteId = params.id
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const role = url.searchParams.get('role') || undefined
    const company = url.searchParams.get('company') || undefined
    const sortParam = (url.searchParams.get('sort') as 'name' | 'role' | 'company') || 'name'
    const orderParam = (url.searchParams.get('order') as 'asc' | 'desc') || 'asc'
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '20') || 20))
    const offset = Math.max(0, Number(url.searchParams.get('offset') || '0') || 0)

    // Get IDs of workers already assigned to this site (active)
    const { data: assignedWorkers } = await supabase
      .from('site_assignments')
      .select('user_id')
      .eq('site_id', siteId)
      .eq('is_active', true)

    const assignedUserIds = (assignedWorkers || []).map((w: any) => w.user_id).filter(Boolean)

    // Build filtered query
    let profilesQuery = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, company', { count: 'exact' })

    if (assignedUserIds.length > 0) {
      profilesQuery = profilesQuery.not('id', 'in', `(${assignedUserIds.join(',')})`)
    }

    if (role && role !== 'all') {
      profilesQuery = profilesQuery.eq('role', role)
    }
    if (company && company !== 'all') {
      profilesQuery = profilesQuery.eq('company', company)
    }
    if (q) {
      const pattern = `%${q}%`
      profilesQuery = profilesQuery.or(
        `full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},company.ilike.${pattern}`
      )
    }

    const sortMap: Record<string, string> = { name: 'full_name', role: 'role', company: 'company' }
    const sortColumn = sortMap[sortParam] || 'full_name'
    profilesQuery = profilesQuery.order(sortColumn, { ascending: orderParam === 'asc' })

    profilesQuery = profilesQuery.range(offset, offset + limit - 1)

    const { data: profileWorkers, count, error: profilesError } = await profilesQuery
    if (profilesError) {
      console.error('Error fetching from profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch available workers' }, { status: 500 })
    }

    const formattedWorkers = (profileWorkers || []).map((worker: any) => ({
      id: worker.id,
      full_name: worker.full_name || 'Unknown',
      email: worker.email || '',
      phone: worker.phone || '',
      role: worker.role || 'worker',
      company: worker.company || '',
    }))

    return NextResponse.json({
      success: true,
      data: formattedWorkers,
      total: count || 0,
      site_id: siteId,
      limit,
      offset,
      sort: sortParam,
      order: orderParam,
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
