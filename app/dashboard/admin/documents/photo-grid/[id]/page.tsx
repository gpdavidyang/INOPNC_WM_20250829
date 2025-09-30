import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: '사진대지 문서' }

export default async function AdminPhotoGridDocumentPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()

  const { data: doc } = await supabase
    .from('unified_document_system')
    .select('id, title, file_url, mime_type, created_at, metadata')
    .eq('id', params.id)
    .maybeSingle()

  const url = (doc as any)?.file_url as string | undefined
  const mime = (doc as any)?.mime_type as string | undefined
  const isImage = typeof mime === 'string' && mime.startsWith('image/')
  const isPdf =
    mime === 'application/pdf' || (typeof url === 'string' && url.toLowerCase().endsWith('.pdf'))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{(doc as any)?.title || '사진대지'}</CardTitle>
          <CardDescription>
            {(doc as any)?.created_at
              ? new Date((doc as any).created_at).toLocaleString('ko-KR')
              : ''}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {url ? (
            isImage ? (
              <img
                src={url}
                alt={(doc as any)?.title || 'photo grid'}
                className="max-w-full h-auto"
              />
            ) : isPdf ? (
              <iframe src={url} className="w-full h-[80vh] border rounded" />
            ) : (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-600"
              >
                새 창에서 열기
              </a>
            )
          ) : (
            <div className="text-sm text-muted-foreground">미리볼 파일 URL이 없습니다.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
