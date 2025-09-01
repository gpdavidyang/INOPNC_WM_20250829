import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/auth/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    
    // Get the photo grid data
    const { data: photoGrid, error } = await supabase
      .from('photo_grids')
      .select(`
        *,
        site:sites(id, name, address),
        creator:profiles(id, full_name)
      `)
      .eq('id', params.id)
      .single()

    if (error || !photoGrid) {
      console.error('Error fetching photo grid:', error)
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate simple HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; color: #333; }
          .info-section { margin: 20px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { font-weight: bold; width: 120px; }
          .photos { display: flex; justify-content: space-around; margin: 30px 0; }
          .photo-container { width: 45%; text-align: center; }
          .photo-container h3 { margin-bottom: 10px; }
          .photo-container img { max-width: 100%; height: auto; border: 1px solid #ccc; }
          .placeholder { padding: 100px 20px; background: #f0f0f0; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h1>사진대지</h1>
        
        <div class="info-section">
          <h2>문서 정보</h2>
          <div class="info-row">
            <span class="info-label">현장명:</span>
            <span>${photoGrid.site?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업일자:</span>
            <span>${photoGrid.work_date || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">부재명:</span>
            <span>${photoGrid.component_name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업공정:</span>
            <span>${photoGrid.work_process || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업구간:</span>
            <span>${photoGrid.work_section || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성자:</span>
            <span>${photoGrid.creator?.full_name || '-'}</span>
          </div>
        </div>
        
        <div class="photos">
          <div class="photo-container">
            <h3>작업 전</h3>
            ${photoGrid.before_photo_url && photoGrid.before_photo_url.startsWith('http') 
              ? `<img src="${photoGrid.before_photo_url}" alt="작업 전 사진">`
              : '<div class="placeholder">사진 없음</div>'
            }
          </div>
          <div class="photo-container">
            <h3>작업 후</h3>
            ${photoGrid.after_photo_url && photoGrid.after_photo_url.startsWith('http')
              ? `<img src="${photoGrid.after_photo_url}" alt="작업 후 사진">`
              : '<div class="placeholder">사진 없음</div>'
            }
          </div>
        </div>
        
        <p style="text-align: center; margin-top: 50px; color: #666; font-size: 12px;">
          생성일: ${new Date().toLocaleDateString('ko-KR')}
        </p>
      </body>
      </html>
    `

    // For now, return HTML as response (browser can print to PDF)
    // In production, you might want to use puppeteer or similar to generate actual PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="photo-grid-${photoGrid.work_date || 'document'}.html"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/photo-grids/[id]/download:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}