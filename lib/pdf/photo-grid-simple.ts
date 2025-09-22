interface PhotoGridData {
  id: string
  site_id: string
  component_name: string
  work_process: string
  work_section?: string
  work_date: string
  before_photo_url?: string
  after_photo_url?: string
  site?: {
    name: string
    address?: string
  }
  creator?: {
    full_name: string
  }
}

export async function generatePhotoGridPDF(data: PhotoGridData): Promise<Blob> {
  // Generate HTML content
  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>사진대지 - ${data.component_name || '문서'}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 40px;
          max-width: 210mm;
          margin: 0 auto;
          background: white;
        }
        
        h1 {
          text-align: center;
          color: #2c3e50;
          margin-bottom: 40px;
          font-size: 32px;
          font-weight: 700;
          border-bottom: 3px solid #3498db;
          padding-bottom: 15px;
        }
        
        .info-section {
          margin-bottom: 40px;
          background: #f8f9fa;
          padding: 25px;
          border-radius: 10px;
          border: 1px solid #dee2e6;
        }
        
        .info-section h2 {
          color: #495057;
          margin-bottom: 20px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        
        .info-row {
          display: flex;
          align-items: center;
          padding: 8px 0;
        }
        
        .info-label {
          font-weight: 600;
          width: 100px;
          color: #6c757d;
          font-size: 14px;
        }
        
        .info-value {
          color: #212529;
          font-size: 15px;
        }
        
        .photos-section {
          margin-bottom: 40px;
        }
        
        .photos-section h2 {
          color: #495057;
          margin-bottom: 25px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .photos-container {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
        }
        
        .photo-wrapper {
          border: 1px solid #dee2e6;
          border-radius: 10px;
          overflow: hidden;
          background: white;
        }
        
        .photo-header {
          padding: 12px;
          font-weight: 600;
          text-align: center;
          font-size: 16px;
        }
        
        .photo-header.before {
          background: #fff3cd;
          color: #856404;
          border-bottom: 2px solid #ffc107;
        }
        
        .photo-header.after {
          background: #d1ecf1;
          color: #0c5460;
          border-bottom: 2px solid #17a2b8;
        }
        
        .photo-container {
          padding: 15px;
          background: #f8f9fa;
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .photo-container img {
          max-width: 100%;
          max-height: 400px;
          height: auto;
          border-radius: 5px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .placeholder {
          padding: 80px 20px;
          text-align: center;
          color: #6c757d;
          background: #e9ecef;
          border-radius: 5px;
          font-size: 14px;
        }
        
        .placeholder-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        
        .footer {
          text-align: center;
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #6c757d;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          
          .photo-wrapper {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <h1>사진대지</h1>
      
      <div class="info-section">
        <h2>문서 정보</h2>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">현장명:</span>
            <span class="info-value">${data.site?.name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업일자:</span>
            <span class="info-value">${data.work_date || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">부재명:</span>
            <span class="info-value">${data.component_name || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업공정:</span>
            <span class="info-value">${data.work_process || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작업구간:</span>
            <span class="info-value">${data.work_section || '-'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성자:</span>
            <span class="info-value">${data.creator?.full_name || '-'}</span>
          </div>
        </div>
      </div>
      
      <div class="photos-section">
        <h2>작업 사진</h2>
        <div class="photos-container">
          <div class="photo-wrapper">
            <div class="photo-header before">작업 전</div>
            <div class="photo-container">
              ${data.before_photo_url && data.before_photo_url.startsWith('http') 
                ? `<img src="${data.before_photo_url}" alt="작업 전 사진" />`
                : `<div class="placeholder">
                     <div class="placeholder-icon">📷</div>
                     <div>사진 없음</div>
                   </div>`
              }
            </div>
          </div>
          
          <div class="photo-wrapper">
            <div class="photo-header after">작업 후</div>
            <div class="photo-container">
              ${data.after_photo_url && data.after_photo_url.startsWith('http')
                ? `<img src="${data.after_photo_url}" alt="작업 후 사진" />`
                : `<div class="placeholder">
                     <div class="placeholder-icon">📷</div>
                     <div>사진 없음</div>
                   </div>`
              }
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>생성일: ${new Date().toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
        <p style="margin-top: 10px;">© 2025 INOPNC - 사진대지 문서</p>
      </div>
    </body>
    </html>
  `

  // Convert HTML to Blob for download
  const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
  return blob
}