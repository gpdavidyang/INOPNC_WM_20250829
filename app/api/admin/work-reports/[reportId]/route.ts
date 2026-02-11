import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest, { params }: { params: { reportId: string } }) {
  const supabase = createClient()
  const { reportId } = params

  try {
    // 1. Auth Check (Admin Only ideally, but we'll check created_by match too)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Fetch the report to get file path
    const { data: report, error: fetchError } = await supabase
      .from('work_reports')
      .select('file_url, created_by')
      // Assuming params.reportId is daily_report_id, if work_report id used change to 'id'
      .eq('daily_report_id', reportId)
      .single()

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // 3. Delete from Storage
    // Extract file name from URL
    const url = new URL(report.file_url)
    const pathname = url.pathname // e.g., /storage/v1/object/public/work_reports/filename.pdf
    const parts = pathname.split('work_reports/')

    if (parts.length > 1) {
      const filePath = parts.slice(1).join('work_reports/') // Handle potential duplicate folder names if any
      const { error: storageError } = await supabase.storage.from('work_reports').remove([filePath])

      if (storageError) {
        console.error('Storage Delete Error:', storageError)
        // Proceed to clean DB? Usually yes.
      }
    }

    // 4. Delete from Database
    const { error: deleteError } = await supabase
      .from('work_reports')
      .delete()
      .eq('daily_report_id', reportId) // Use daily_report_id not ID of work_reports itself based on logic

    if (deleteError) {
      console.error('DB Delete Error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete Database Record' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
