import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User document submissions API - User ID:', user.id)

    // Get user's document submission status
    const { data: submissions, error } = await supabase
      .from('user_document_submissions')
      .select(`
        *,
        requirement:document_requirements(*),
        document:unified_document_system(id, title, file_name, file_url, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('User document submissions API - Submissions found:', submissions?.length || 0)
    console.log('User document submissions API - Error:', error)

    if (error) {
      console.error('Error fetching user submissions:', error)
      // Return empty array if table doesn't exist
      return NextResponse.json({
        success: true,
        data: [],
        source: 'fallback'
      })
    }

    return NextResponse.json({
      success: true,
      data: submissions || [],
      source: 'database'
    })

  } catch (error) {
    console.error('Error in user document submissions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requirement_id, document_id } = body

    if (!requirement_id) {
      return NextResponse.json({ error: 'requirement_id is required' }, { status: 400 })
    }

    // Insert or update submission status
    const { data, error } = await supabase
      .from('user_document_submissions')
      .upsert({
        user_id: user.id,
        requirement_id,
        document_id,
        submission_status: document_id ? 'submitted' : 'not_submitted',
        submitted_at: document_id ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,requirement_id'
      })
      .select()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json(
        { error: 'Failed to update submission status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null
    })

  } catch (error) {
    console.error('Error in POST user document submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role && ['admin', 'system_admin'].includes(profile.role)

    const body = await request.json()
    const { submission_id, status, rejection_reason, reviewed_by } = body

    if (!submission_id || !status) {
      return NextResponse.json({ error: 'submission_id and status are required' }, { status: 400 })
    }

    // Only admins can approve/reject submissions
    if (['approved', 'rejected'].includes(status) && !isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: unknown = {
      submission_status: status,
      updated_at: new Date().toISOString()
    }

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString()
      updateData.reviewed_by = reviewed_by || user.id
    } else if (status === 'rejected') {
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = rejection_reason
      updateData.reviewed_by = reviewed_by || user.id
    }

    const { data, error } = await supabase
      .from('user_document_submissions')
      .update(updateData)
      .eq('id', submission_id)
      .select()

    if (error) {
      console.error('Error updating submission status:', error)
      return NextResponse.json(
        { error: 'Failed to update submission status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null
    })

  } catch (error) {
    console.error('Error in PUT user document submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}