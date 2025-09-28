import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import MinimalDocumentUpload from '@/components/admin/documents/MinimalDocumentUpload'

export const metadata: Metadata = { title: '문서 업로드' }

export default async function AdminDocumentUploadPage() {
  await requireAdminProfile()
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Card>
        <CardHeader>
          <CardTitle>문서 업로드(최소)</CardTitle>
          <CardDescription>통합 문서 시스템에 메타데이터 기반 문서를 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <MinimalDocumentUpload />
        </CardContent>
      </Card>
    </div>
  )
}
