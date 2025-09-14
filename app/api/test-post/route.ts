import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'GET request successful',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log('POST /api/test-post - Request received')
  
  try {
    // Try to read the body in different ways
    const contentType = request.headers.get('content-type') || ''
    let body = null
    
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    } else {
      body = await request.text()
    }
    
    return NextResponse.json({ 
      message: 'POST request successful',
      timestamp: new Date().toISOString(),
      contentType,
      bodyReceived: !!body,
      body
    })
  } catch (error) {
    console.error('POST /api/test-post - Error:', error)
    return NextResponse.json({ 
      error: 'Error processing request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}