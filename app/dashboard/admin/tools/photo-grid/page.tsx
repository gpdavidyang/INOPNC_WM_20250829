import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { PageHeader } from '@/components/ui/page-header'
import PhotoGridToolMain from '@/components/photo-grid-tool/PhotoGridToolMain'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '사진대지 관리',
}

export default async function PhotoGridToolPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="사진대지 관리"
        description="작업 전/후 사진으로 사진대지 생성 및 관리"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '현장작업 관리' },
          { label: '사진대지 관리' },
        ]}
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <PhotoGridToolMain />
      </div>
    </div>
  )
}
