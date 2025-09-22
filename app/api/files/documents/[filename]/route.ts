import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth } from '@/lib/auth/ultra-simple'


export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const authResult = await requireApiAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()

    const filename = params.filename
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Supabase Storage에서 파일 찾기 - 여러 버킷에서 순차적으로 검색
    const buckets = ['user-documents', 'daily-report-attachments', 'attachments']
    let fileData = null
    let foundBucket = null

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(filename)

        if (!error && data) {
          fileData = data
          foundBucket = bucket
          break
        }
      } catch (err) {
        // 버킷에서 파일을 찾지 못했으면 다음 버킷에서 시도
        continue
      }
    }

    if (!fileData) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // MIME 타입 결정
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'dwg': 'application/dwg',
      'dxf': 'application/dxf',
      'txt': 'text/plain'
    }
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream'

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 응답 생성
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
      }
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
