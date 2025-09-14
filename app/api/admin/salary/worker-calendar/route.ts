
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { worker_id, year, month } = body

    // Validate required parameters
    if (!worker_id || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'Worker ID, year, and month are required' },
        { status: 400 }
      )
    }

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Year and month must be numbers' },
        { status: 400 }
      )
    }

    if (typeof worker_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Worker ID must be a string' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, error: 'Month must be between 1 and 12' },
        { status: 400 }
      )
    }

    const result = await getWorkerCalendarData(worker_id, year, month)
    
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
    console.error('Worker calendar API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const worker_id = searchParams.get('worker_id')
    const year = parseInt(searchParams.get('year') || '')
    const month = parseInt(searchParams.get('month') || '')

    // Validate required parameters
    if (!worker_id || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'Worker ID, year, and month are required' },
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

    const result = await getWorkerCalendarData(worker_id, year, month)
    
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
    console.error('Worker calendar API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}