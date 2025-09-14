import { getAuthenticatedUser } from "@/lib/auth/server"

export const metadata: Metadata = {
  title: '사진대지 도구 | INOPNC WM',
  description: '현장별 사진대지 문서 생성 및 관리'
}

export default async function PhotoGridToolPage() {
  const user = await getAuthenticatedUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  return <PhotoGridToolMain />
}