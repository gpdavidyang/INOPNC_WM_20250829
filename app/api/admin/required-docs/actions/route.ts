import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiAuth } from '@/lib/auth/ultra-simple'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    if (auth instanceof NextResponse) return auth
    const { role, userId } = auth as any
    if (!['admin', 'system_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Only administrators can update required documents' },
        { status: 403 }
      )
    }

    const { action, id } = await request.json()
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const supabase = createClient()
    const db = createServiceClient() || supabase

    if (action === 'approve') {
      const { error } = await db
        .from('unified_document_system')
        .update({
          workflow_status: 'approved',
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) {
        console.error('approve error:', error)
        return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
      }
    } else if (action === 'reject') {
      const { error } = await db
        .from('unified_document_system')
        .update({
          workflow_status: 'rejected',
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) {
        console.error('reject error:', error)
        return NextResponse.json({ error: 'Failed to reject' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('actions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
