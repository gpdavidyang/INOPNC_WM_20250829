import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // 인증 확인
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filename = params.filename
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // 로컬 파일 경로 구성
    const basePath = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/도면_데이터'
    const filePath = path.join(basePath, filename)

    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(filePath)
    
    // MIME 타입 결정
    const ext = path.extname(filename).toLowerCase()
    let mimeType = 'application/octet-stream'
    
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.dwg': 'application/dwg',
      '.dxf': 'application/dxf'
    }
    
    if (mimeTypes[ext]) {
      mimeType = mimeTypes[ext]
    }

    // 응답 생성
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}