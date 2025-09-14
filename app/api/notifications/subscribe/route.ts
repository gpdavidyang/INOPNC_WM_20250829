import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscription, userAgent } = await request.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 })
    }

    // Validate subscription format
    if (!subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Missing subscription keys' }, { status: 400 })
    }

    // Store/update push subscription in user profile
    const { data: profile, error: updateError } = await supabase
      .from('profiles')
      .update({
        push_subscription: JSON.stringify(subscription),
        push_subscription_updated_at: new Date().toISOString(),
        user_agent: userAgent || null
      })
      .eq('id', user.id)
      .select('id, push_subscription')
      .single()

    if (updateError) {
      console.error('Error updating push subscription:', updateError)
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
    }

    // Log subscription event
    await supabase
      .from('notification_logs')
      .insert({
        user_id: user.id,
        notification_type: 'subscription',
        title: 'Push Subscription',
        body: 'User subscribed to push notifications',
        status: 'delivered',
        sent_at: new Date().toISOString(),
        sent_by: user.id
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully',
      subscriptionId: profile.id
    })

  } catch (error: unknown) {
    console.error('Subscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to save subscription',
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove push subscription from user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        push_subscription: null,
        push_subscription_updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error removing push subscription:', updateError)
      return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
    }

    // Log unsubscription event
    await supabase
      .from('notification_logs')
      .insert({
        user_id: user.id,
        notification_type: 'unsubscription',
        title: 'Push Unsubscription',
        body: 'User unsubscribed from push notifications',
        status: 'delivered',
        sent_at: new Date().toISOString(),
        sent_by: user.id
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully'
    })

  } catch (error: unknown) {
    console.error('Unsubscription error:', error)
    return NextResponse.json({ 
      error: 'Failed to remove subscription',
      details: error.message 
    }, { status: 500 })
  }
}
