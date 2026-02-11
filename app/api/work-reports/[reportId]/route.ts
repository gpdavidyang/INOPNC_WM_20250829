import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// This endpoint retrieves the work report record for a given daily_report_id
export async function GET(request: NextRequest, { params }: { params: { reportId: string } }) {
  try {
    const supabase = createClient()
    const { reportId } = params

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: workReport, error } = await supabase
      .from('work_reports')
      .select('*')
      .eq('daily_report_id', reportId)
      .single()

    if (error) {
      // It's common to check if report exists, so returning null instead of 404 for "not found" might be better for frontend logic,
      // but standard REST is 404. Let's return 404 if not found.
      if (error.code === 'PGRST116') {
        // no rows returned
        return NextResponse.json({ exists: false }, { status: 200 }) // Return 200 with exists: false for easy frontend checking
      }
      console.error('Fetch Work Report Error:', error)
      return NextResponse.json({ error: 'Failed to fetch work report' }, { status: 500 })
    }

    return NextResponse.json({ exists: true, data: workReport })
  } catch (error) {
    console.error('Work Report API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
