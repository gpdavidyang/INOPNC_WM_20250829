import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'
import { getOutputSummary } from '@/app/actions/admin/salary'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, site_id, worker_id } = body

    // Validate required parameters
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Year and month are required' },
        { status: 400 }
      )
    }

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Year and month must be numbers' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    const result = await getOutputSummary(year, month, site_id, worker_id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Output summary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')
    const site_id = searchParams.get('site_id') || undefined
    const worker_id = searchParams.get('worker_id') || undefined

    // Validate required parameters
    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Year and month are required' },
        { status: 400 }
      )
    }

    if (isNaN(year) || isNaN(month)) {
      return NextResponse.json(
        { success: false, error: 'Year and month must be valid numbers' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    const result = await getOutputSummary(year, month, site_id, worker_id)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })

  } catch (error) {
    console.error('Output summary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}