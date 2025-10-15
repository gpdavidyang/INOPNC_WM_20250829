import type { Metadata } from 'next'
import Link from 'next/link'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/page-header'
import { buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import EmptyState from '@/components/ui/empty-state'

export const metadata: Metadata = { title: '결제방식 관리' }

type PaymentMethod = {
  id: string
  name: string
  tax_rate: number | null
  is_active: boolean | null
}

export default async function PaymentMethodsListPage() {
  await requireAdminProfile()
  const supabase = createClient()
  const { data, error } = await supabase
    .from('payment_methods')
    .select('id, name, tax_rate, is_active')
    .order('name', { ascending: true })

  const methods = (data || []) as PaymentMethod[]

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="결제방식 관리"
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '결제방식 관리' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              href="/dashboard/admin/materials/settings/payment-methods/new"
              className={buttonVariants({ variant: 'primary', size: 'standard' })}
            >
              새 결제방식
            </Link>
            <Link
              href="/dashboard/admin/materials/settings"
              className={buttonVariants({ variant: 'outline', size: 'standard' })}
            >
              설정으로 돌아가기
            </Link>
          </div>
        }
      />

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead className="w-[120px]">세율(%)</TableHead>
                <TableHead className="w-[100px]">사용</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10">
                    <EmptyState description="등록된 결제방식이 없습니다." />
                  </TableCell>
                </TableRow>
              )}
              {methods.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell>{m.tax_rate ?? 10}</TableCell>
                  <TableCell>{m.is_active ? 'Y' : 'N'}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/materials/settings/payment-methods/${m.id}/edit`}
                      className="underline"
                    >
                      수정
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
