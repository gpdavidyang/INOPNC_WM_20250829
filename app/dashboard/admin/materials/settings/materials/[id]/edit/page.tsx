import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: '품목 수정' }

async function updateMaterialAction(id: string, formData: FormData) {
  'use server'
  const supabase = createClient()

  const code = (formData.get('code') as string)?.trim() || null
  const name = (formData.get('name') as string)?.trim()
  const unit = (formData.get('unit') as string)?.trim() || null
  const specification = (formData.get('specification') as string)?.trim() || null
  const isActive = (formData.get('is_active') as string) === 'on'

  if (!name) {
    redirect(`/dashboard/admin/materials/settings/materials/${id}/edit`)
  }

  await supabase
    .from('materials')
    .update({ code, name, unit, specification, is_active: isActive } as any)
    .eq('id', id)

  redirect('/dashboard/admin/materials/settings/materials')
}

export default async function EditMaterialPage({ params }: { params: { id: string } }) {
  await requireAdminProfile()
  const supabase = createClient()
  const { data: m } = await supabase
    .from('materials')
    .select('id, code, name, unit, specification, is_active')
    .eq('id', params.id)
    .single()

  if (!m) {
    redirect('/dashboard/admin/materials/settings/materials')
  }

  async function action(formData: FormData) {
    'use server'
    return updateMaterialAction(params.id, formData)
  }

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="품목 수정"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리', href: '/dashboard/admin/materials/settings/materials' },
          { label: '품목 수정' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials/settings/materials"
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={action} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">코드</label>
                <Input name="code" defaultValue={(m as any).code || ''} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">품명 *</label>
                <Input name="name" required defaultValue={(m as any).name || ''} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">단위</label>
                <Input name="unit" defaultValue={(m as any).unit || ''} />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">규격</label>
                <Input name="specification" defaultValue={(m as any).specification || ''} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="is_active"
                  name="is_active"
                  type="checkbox"
                  defaultChecked={!!(m as any).is_active}
                />
                <label htmlFor="is_active" className="text-sm">
                  사용
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  저장
                </Button>
                <Button asChild variant="outline" type="button">
                  <a href="/dashboard/admin/materials/settings/materials">취소</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
