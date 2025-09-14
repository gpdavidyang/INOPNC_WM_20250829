import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// This is a special handler for large file uploads
// It's configured to handle up to 50MB files

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for large uploads

// Special configuration for large file uploads
export async function POST(request: NextRequest) {
  try {
    // Get content length from headers
    const contentLength = request.headers.get('content-length')
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` },
        { status: 413 }
      )
    }
    
    // Forward the request to the actual upload endpoint
    const url = new URL('/api/shared-documents', request.url)
    
    // Clone the request with the same body
    const formData = await request.formData()
    
    // Create a new request to the actual endpoint
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      headers: {
        // Pass through authentication headers
        'cookie': request.headers.get('cookie') || '',
      },
    })
    
    const data = await response.json()
    
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Upload handler error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}