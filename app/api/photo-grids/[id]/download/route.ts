import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'


export const dynamic = 'force-dynamic'

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

    // Get all images from photo_grid_images table
    const { data: images, error: imagesError } = await supabase
      .from('photo_grid_images')
      .select('*')
      .eq('photo_grid_id', params.id)
      .order('photo_type', { ascending: true })
      .order('photo_order', { ascending: true })

    if (imagesError) {
      console.error('Error fetching images:', imagesError)
    }

    // Separate before and after images
    const beforeImages = images?.filter((img: unknown) => img.photo_type === 'before') || []
    const afterImages = images?.filter((img: unknown) => img.photo_type === 'after') || []

    // Ensure we have exactly 3 slots for each type (fill empty slots)
    const beforePhotos = []
    const afterPhotos = []
    
    for (let i = 0; i < 3; i++) {
      const beforeImg = beforeImages.find((img: unknown) => img.photo_order === i)
      beforePhotos.push(beforeImg ? { url: beforeImg.photo_url, order: i } : null)
      
      const afterImg = afterImages.find((img: unknown) => img.photo_order === i)
      afterPhotos.push(afterImg ? { url: afterImg.photo_url, order: i } : null)
    }

    // Generate A4-optimized HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>사진대지 - ${photoGrid.site?.name || ''}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Malgun Gothic', 'Nanum Gothic', sans-serif;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            color: #333;
          }
          
          /* 상단 작업 정보 섹션 */
          .header-section {
            border: 2px solid #333;
            padding: 15px;
            margin-bottom: 20px;
            background: #f8f9fa;
            border-radius: 4px;
          }
          
          .header-title {
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: #2c3e50;
            letter-spacing: 2px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 12px;
          }
          
          .info-item {
            display: flex;
            align-items: center;
          }
          
          .info-label {
            font-weight: bold;
            min-width: 80px;
            color: #555;
          }
          
          .info-value {
            flex: 1;
            color: #333;
            padding-left: 10px;
          }
          
          /* 사진 그리드 레이아웃 */
          .photo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
          }
          
          .photo-column {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }
          
          .column-header {
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            padding: 10px;
            background: #2c3e50;
            color: white;
            border-radius: 4px;
            letter-spacing: 1px;
          }
          
          .before-header {
            background: #27ae60;
          }
          
          .after-header {
            background: #3498db;
          }
          
          .photo-item {
            height: 200px;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .photo-item img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
          }
          
          .photo-number {
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
          }
          
          .no-photo {
            color: #999;
            font-size: 12px;
            text-align: center;
          }
          
          /* 하단 정보 */
          .footer-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #666;
          }
          
          .footer-left {
            text-align: left;
          }
          
          .footer-right {
            text-align: right;
          }
          
          .company-name {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 3px;
          }
          
          /* 인쇄 최적화 */
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .header-section {
              break-inside: avoid;
            }
            
            .photo-grid {
              break-inside: avoid;
            }
            
            .photo-item {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <!-- 상단 작업 정보 -->
        <div class="header-section">
          <div class="header-title">사진대지</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">현장명:</span>
              <span class="info-value">${photoGrid.site?.name || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">작업일자:</span>
              <span class="info-value">${photoGrid.work_date ? new Date(photoGrid.work_date).toLocaleDateString('ko-KR') : '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">부재명:</span>
              <span class="info-value">${photoGrid.component_name || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">작업공정:</span>
              <span class="info-value">${photoGrid.work_process || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">작업구간:</span>
              <span class="info-value">${photoGrid.work_section || '-'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">작성자:</span>
              <span class="info-value">${photoGrid.creator?.full_name || '-'}</span>
            </div>
          </div>
        </div>

        <!-- 사진 그리드 (좌: 작업 전, 우: 작업 후) -->
        <div class="photo-grid">
          <!-- 좌측: 작업 전 -->
          <div class="photo-column">
            <div class="column-header before-header">작업 전</div>
            ${beforePhotos.map((photo: unknown, index: number) => `
              <div class="photo-item">
                <span class="photo-number">${index + 1}</span>
                ${photo && photo.url ? 
                  `<img src="${photo.url}" alt="작업 전 ${index + 1}">` : 
                  '<div class="no-photo">사진 없음</div>'
                }
              </div>
            `).join('')}
          </div>

          <!-- 우측: 작업 후 -->
          <div class="photo-column">
            <div class="column-header after-header">작업 후</div>
            ${afterPhotos.map((photo: unknown, index: number) => `
              <div class="photo-item">
                <span class="photo-number">${index + 1}</span>
                ${photo && photo.url ? 
                  `<img src="${photo.url}" alt="작업 후 ${index + 1}">` : 
                  '<div class="no-photo">사진 없음</div>'
                }
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 하단 정보 -->
        <div class="footer-section">
          <div class="footer-left">
            <div class="company-name">INOPNC</div>
            <div>문서번호: PG-${photoGrid.id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div class="footer-right">
            <div>작성일: ${new Date().toLocaleDateString('ko-KR')}</div>
            <div>출력일: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </body>
      </html>
    `

    // Return HTML as response (browser can print to PDF)
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
