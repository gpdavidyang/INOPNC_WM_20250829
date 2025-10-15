import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: '새 결제방식' }

async function createPaymentMethodAction(formData: FormData) {
  'use server'
  const supabase = createClient()
  const name = (formData.get('name') as string)?.trim()
  const tax_rate = Number(formData.get('tax_rate') || 10)
  if (!name) redirect('/dashboard/admin/materials/settings/payment-methods')
  await supabase.from('payment_methods').insert({ name, tax_rate, is_active: true } as any)
  redirect('/dashboard/admin/materials/settings/payment-methods')
}

export default async function NewPaymentMethodPage() {
  await requireAdminProfile()
  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="새 결제방식"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '결제방식 관리', href: '/dashboard/admin/materials/settings/payment-methods' },
          { label: '새 결제방식' },
        ]}
        showBackButton
        backButtonHref="/dashboard/admin/materials/settings/payment-methods"
      />
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPaymentMethodAction} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">이름 *</label>
                <Input name="name" required placeholder="예: 현금, 계좌이체, 카드" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">세율(%)</label>
                <Input name="tax_rate" type="number" step="0.1" defaultValue={10} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary">
                  저장
                </Button>
                <Button asChild variant="outline" type="button">
                  <a href="/dashboard/admin/materials/settings/payment-methods">취소</a>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
