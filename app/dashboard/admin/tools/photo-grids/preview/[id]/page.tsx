import PhotoGridPreviewPage from '@/components/photo-grid-tool/PhotoGridPreviewPage'

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
  
  return <PhotoGridPreviewPage photoGridId={params.id} />
}