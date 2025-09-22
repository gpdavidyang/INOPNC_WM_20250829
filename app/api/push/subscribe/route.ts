import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    
    // Check if request has a body
    const contentLength = request.headers.get('content-length')
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 })
    }
    
    const body = await request.json()
    const { subscription, deviceInfo } = body
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }
    
    // Store or update push subscription
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: authResult.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        device_info: deviceInfo || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,endpoint'
      })
    
    if (upsertError) {
      console.error('Failed to store push subscription:', upsertError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const endpoint = searchParams.get('endpoint')
    
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 })
    }
    
    // Delete push subscription
    const { error: deleteError } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', authResult.userId)
      .eq('endpoint', endpoint)
    
    if (deleteError) {
      console.error('Failed to delete push subscription:', deleteError)
      return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push unsubscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
