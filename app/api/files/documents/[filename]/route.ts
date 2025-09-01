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

    // 먼저 도면 폴더에서 찾기
    const markupBasePath = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/도면_데이터'
    let filePath = path.join(markupBasePath, filename)

    // 도면 폴더에 없으면 다른 위치도 확인 (추후 확장 가능)
    if (!fs.existsSync(filePath)) {
      // 다른 문서 경로들 추가 가능
      const documentBasePath = '/Users/davidyang/workspace/INOPNC_WM_20250829/dy_memo/DY_INOPNC/문서_데이터'
      filePath = path.join(documentBasePath, filename)
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
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
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.dwg': 'application/dwg',
      '.dxf': 'application/dxf',
      '.txt': 'text/plain'
    }
    
    if (mimeTypes[ext]) {
      mimeType = mimeTypes[ext]
    }

    // 응답 생성
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        // 파일명이 한글인 경우를 위한 인코딩
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
      }
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}