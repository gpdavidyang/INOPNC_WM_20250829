import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: '새 품목 등록' }

async function createMaterialAction(formData: FormData) {
  'use server'
  const supabase = createClient()
  const code = (formData.get('code') as string)?.trim() || null
  const name = (formData.get('name') as string)?.trim()
  const unit = (formData.get('unit') as string)?.trim() || null
  const specification = (formData.get('specification') as string)?.trim() || null

  if (!name) {
    // 간단 검증 실패 시 목록으로
    redirect('/dashboard/admin/materials/settings/materials')
  }

  await supabase.from('materials').insert({
    code,
    name,
    unit,
    specification,
    is_active: true,
  } as any)

  redirect('/dashboard/admin/materials/settings/materials')
}

export default async function NewMaterialPage() {
  await requireAdminProfile()

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="새 품목 등록"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리', href: '/dashboard/admin/materials/settings/materials' },
          { label: '새 품목' },
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
            <form action={createMaterialAction} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">코드</label>
                <Input name="code" placeholder="예: NPC-1000" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">품명 *</label>
                <Input name="name" required placeholder="예: 콘크리트 NPC-1000" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">단위</label>
                <Input name="unit" placeholder="예: 말, 개, m" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">규격</label>
                <Input name="specification" placeholder="예: 25-240-15" />
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
