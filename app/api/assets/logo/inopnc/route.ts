import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_req: NextRequest) {
  try {
    const filePath = path.join(
      process.cwd(),
      'dy_memo',
      'DY_INOPNC',
      'INOPNC_제공문서',
      'INOPNC_Logo-가로조합-n.png'
    )
    const buf = await fs.readFile(filePath)
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (e: any) {
    console.error('Logo fetch error', e?.message || e)
    return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
  }
}
