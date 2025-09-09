import { NextRequest, NextResponse } from 'next/server'
import { signIn } from '@/app/auth/actions'

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG-LOGIN] Starting debug login test...')
    
    const body = await request.json()
    const { email, password } = body
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    
    console.log('[DEBUG-LOGIN] Calling signIn with email:', email)
    
    const result = await signIn(email, password)
    
    console.log('[DEBUG-LOGIN] signIn result:', result)
    
    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('[DEBUG-LOGIN] Error during debug login:', error)
    console.error('[DEBUG-LOGIN] Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}