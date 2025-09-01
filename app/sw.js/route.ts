import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Try to read from public directory first
    const publicSwPath = path.join(process.cwd(), 'public', 'sw.js')
    
    let swContent = ''
    
    if (fs.existsSync(publicSwPath)) {
      swContent = fs.readFileSync(publicSwPath, 'utf8')
    } else {
      // Fallback: try to read from static directory  
      const staticSwPath = path.join(process.cwd(), '.next', 'static', 'sw.js')
      if (fs.existsSync(staticSwPath)) {
        swContent = fs.readFileSync(staticSwPath, 'utf8')
      } else {
        return new NextResponse('Service Worker not found', { status: 404 })
      }
    }

    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Service-Worker-Allowed': '/'
      }
    })
  } catch (error) {
    console.error('Error serving service worker:', error)
    return new NextResponse('Service Worker error', { status: 500 })
  }
}