import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export async function GET() {
  try {
    // Return the public VAPID key for client-side subscription
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

    if (!publicVapidKey) {
      return NextResponse.json({ 
        error: 'VAPID public key not configured' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      publicKey: publicVapidKey,
      success: true 
    })

  } catch (error: unknown) {
    console.error('VAPID key error:', error)
    return NextResponse.json({ 
      error: 'Failed to get VAPID key',
      details: error.message 
    }, { status: 500 })
  }
}