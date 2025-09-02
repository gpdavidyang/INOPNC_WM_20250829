import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic' // Ensure it works on Vercel
export const runtime = 'nodejs'

export async function GET() {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'manifest.json')
    const manifest = fs.readFileSync(manifestPath, 'utf-8')
    
    return new NextResponse(manifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Error serving manifest.json:', error)
    
    // Fallback manifest if file not found
    const fallbackManifest = {
      name: "INOPNC 작업 관리 시스템",
      short_name: "INOPNC WM",
      description: "건설 현장 작업 일지 및 자재 관리를 위한 통합 관리 시스템",
      start_url: "/dashboard",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#2563eb",
      orientation: "portrait-primary",
      scope: "/",
      icons: [
        {
          src: "/icons/icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: "/icons/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    }
    
    return NextResponse.json(fallbackManifest, {
      status: 200,
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }
}