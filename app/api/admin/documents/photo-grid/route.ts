import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// DEPRECATED: 통합 API(/api/unified-documents)를 사용하세요
// 이 엔드포인트는 하위 호환성을 위해 리다이렉트합니다
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // 통합 API로 리다이렉트
  const newUrl = new URL('/api/unified-documents', request.url)
  newUrl.searchParams.set('category_type', 'photo_grid')
  newUrl.searchParams.set('status', searchParams.get('status') || 'active')
  
  // 다른 파라미터들도 전달
  searchParams.forEach((value, key) => {
    if (key !== 'category_type' && key !== 'status') {
      newUrl.searchParams.set(key, value)
    }
  })
  
  return NextResponse.redirect(newUrl, 308) // Permanent Redirect
}