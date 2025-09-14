
// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    let result

    switch (action) {
      case 'getOutputSummary': {
        const { year, month, site_id, worker_id } = params
        if (!year || !month) {
          return NextResponse.json(
            { success: false, error: 'Year and month are required for getOutputSummary' },
            { status: 400 }
          )
        }
        result = await getOutputSummary(year, month, site_id, worker_id)
        break

}
      case 'getWorkerCalendarData': {
        const { worker_id: wid, year: cy, month: cm } = params
        if (!wid || !cy || !cm) {
          return NextResponse.json(
            { success: false, error: 'Worker ID, year, and month are required for getWorkerCalendarData' },
            { status: 400 }
          )
        }
        result = await getWorkerCalendarData(wid, cy, cm)
        break

}
      case 'getSalaryRules': {
        result = await getSalaryRules()
        break

}
      case 'getSalaryRecords': {
        const { filters, page, pageSize } = params
        result = await getSalaryRecords(filters, page, pageSize)
        break

}
      case 'getSalaryStats': {
        result = await getSalaryStats()
        break

}
      case 'getAvailableSites': {
        result = await getAvailableSitesForSalary()
        break

}
      case 'getAvailableWorkers': {
        result = await getAvailableWorkersForSalary()
        break

}
      case 'calculateSalaries': {
        const { site_id: calc_site_id, worker_id: calc_worker_id, date_from, date_to } = params
        if (!date_from || !date_to) {
          return NextResponse.json(
            { success: false, error: 'Date range is required for calculateSalaries' },
            { status: 400 }
          )
        }
        result = await calculateSalaries(calc_site_id, calc_worker_id, date_from, date_to)
        break

}
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action,
      data: result.data
    })

  } catch (error) {
    console.error('Salary API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}