import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'
import { createServiceRoleClient } from '@/lib/supabase/service-role'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get statement data from request body
    const body = await request.json()
    const { statements } = body

    if (!statements || !Array.isArray(statements)) {
      return NextResponse.json(
        { error: 'Statements data is required' },
        { status: 400 }
      )
    }

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()
    
    // Insert all salary statements
    const { data, error } = await serviceClient
      .from('salary_statements')
      .insert(statements.map(stmt => ({
        ...stmt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })))
      .select()

    if (error) {
      console.error('Error inserting salary statements:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data,
      message: `Successfully generated ${data.length} salary statements`
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (authResult.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const workerId = searchParams.get('workerId')

    // Use service role client to bypass RLS
    const serviceClient = createServiceRoleClient()
    
    let query = serviceClient
      .from('salary_statements')
      .select('*')
      .order('created_at', { ascending: false })

    if (year) {
      query = query.eq('year', parseInt(year))
    }
    if (month) {
      query = query.eq('month', parseInt(month))
    }
    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching salary statements:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      data
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
