import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AnnouncementForm from '@/components/admin/communication/AnnouncementForm'

export const metadata: Metadata = {
  title: '공지 수정',
}

export default async function CommunicationEditorPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  await requireAdminProfile()
  const announcementId = typeof searchParams?.id === 'string' ? searchParams?.id.trim() : undefined
  if (!announcementId) {
    redirect('/dashboard/admin/communication?tab=announcements')
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, content, priority, target_sites, target_roles, is_active')
    .eq('id', announcementId)
    .maybeSingle()

  if (error) {
    console.error('[CommunicationEditor] Failed to load announcement:', error)
    notFound()
  }
  if (!data) {
    notFound()
  }

  return (
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="공지 수정"
        description="기존 공지의 내용을 수정합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '커뮤니케이션', href: '/dashboard/admin/communication?tab=announcements' },
          { label: '공지 수정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/communication?tab=announcements"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>공지 편집</CardTitle>
            <CardDescription>수정 후 저장하면 기존 공지가 업데이트됩니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnnouncementForm
              mode="edit"
              initialData={{
                id: data.id,
                title: data.title,
                content: data.content,
                priority: (data.priority as any) || 'normal',
                target_sites: Array.isArray(data.target_sites) ? data.target_sites : [],
                target_roles: Array.isArray(data.target_roles) ? data.target_roles : [],
                is_active: data.is_active ?? true,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
