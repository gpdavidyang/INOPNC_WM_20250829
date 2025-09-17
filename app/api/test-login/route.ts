import { NextResponse } from 'next/server'
import { signIn } from '@/app/auth/actions'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    console.log('[TEST-LOGIN] Testing signIn action with:', { email, password: '***' })

    // Call the Server Action directly
    const result = await signIn(email, password)

    console.log('[TEST-LOGIN] signIn result:', result)

    return NextResponse.json({
      success: true,
      result,
      message: 'Server Action executed successfully',
    })
  } catch (error) {
    console.error('[TEST-LOGIN] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Server Action failed',
      },
      { status: 500 }
    )
  }
}
