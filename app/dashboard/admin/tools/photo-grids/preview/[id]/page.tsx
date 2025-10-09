import PhotoGridPreviewPage from '@/components/photo-grid-tool/PhotoGridPreviewPage'
import { PageHeader } from '@/components/ui/page-header'
import type { Metadata } from 'next'
import { requireAdminProfile as requireAuth } from '@/app/dashboard/admin/utils'

export const metadata: Metadata = {
  title: '사진대지 미리보기 | INOPNC',
  description: '사진대지 문서 미리보기',
}

interface PhotoGridPreviewPageProps {
  params: {
    id: string
  }
}

export default async function PhotoGridPreview({ params }: PhotoGridPreviewPageProps) {
  await requireAuth()
  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사진대지 미리보기"
        description={`ID: ${params.id}`}
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장작업 관리' },
          { label: '미리보기' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/tools/photo-grid"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PhotoGridPreviewPage photoGridId={params.id} />
      </div>
    </div>
  )
}
