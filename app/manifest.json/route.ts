import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Try to read from public directory first
    const publicManifestPath = path.join(process.cwd(), 'public', 'manifest.json')
    
    let manifestContent = ''
    
    if (fs.existsSync(publicManifestPath)) {
      manifestContent = fs.readFileSync(publicManifestPath, 'utf8')
    } else {
      // Fallback: try to read from static directory  
      const staticManifestPath = path.join(process.cwd(), '.next', 'static', 'manifest.json')
      if (fs.existsSync(staticManifestPath)) {
        manifestContent = fs.readFileSync(staticManifestPath, 'utf8')
      } else {
        return new NextResponse('Manifest not found', { status: 404 })
      }
    }

    return new NextResponse(manifestContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  } catch (error) {
    console.error('Error serving manifest:', error)
    return new NextResponse('Manifest error', { status: 500 })
  }
}