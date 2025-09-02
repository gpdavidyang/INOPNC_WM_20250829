import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-static'
export const revalidate = false // Service worker should not be cached

export async function GET() {
  try {
    const swPath = path.join(process.cwd(), 'public', 'sw.js')
    const swContent = fs.readFileSync(swPath, 'utf-8')
    
    return new NextResponse(swContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    })
  } catch (error) {
    console.error('Error serving sw.js:', error)
    
    // Return minimal service worker if file not found
    const fallbackSW = `
// Minimal service worker fallback
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing fallback...')
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating fallback...')
  return self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Pass through all requests
  event.respondWith(fetch(event.request))
})
`
    
    return new NextResponse(fallbackSW, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Service-Worker-Allowed': '/',
      },
    })
  }
}