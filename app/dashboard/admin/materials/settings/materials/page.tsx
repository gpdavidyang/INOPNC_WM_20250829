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

export const metadata: Metadata = { title: '품목 관리' }

type MaterialRow = {
  id: string
  code: string | null
  name: string
  unit: string | null
  specification?: string | null
  is_active?: boolean | null
}

export default async function MaterialsSettingsListPage() {
  await requireAdminProfile()
  const supabase = createClient()

  const { data, error } = await supabase
    .from('materials')
    .select('id, code, name, unit, specification, is_active')
    .order('name', { ascending: true })

  const materials = (data || []) as MaterialRow[]

  return (
    <div className="px-0 pb-8">
      <PageHeader
        title="품목 관리"
        description="자재(품목) 마스터를 관리합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리' },
        ]}
        actions={
          <div className="flex gap-2">
            <Link
              href="/dashboard/admin/materials/settings/materials/new"
              className={buttonVariants({ variant: 'primary', size: 'standard' })}
            >
              새 품목
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
                <TableHead className="w-[140px]">코드</TableHead>
                <TableHead>품명</TableHead>
                <TableHead className="w-[120px]">단위</TableHead>
                <TableHead>규격</TableHead>
                <TableHead className="w-[100px]">사용</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!materials || materials.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <EmptyState description="등록된 품목이 없습니다." />
                  </TableCell>
                </TableRow>
              )}
              {materials.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.code || '-'}</TableCell>
                  <TableCell className="font-medium text-foreground">{m.name}</TableCell>
                  <TableCell>{m.unit || '-'}</TableCell>
                  <TableCell className="truncate max-w-[360px]" title={m.specification || ''}>
                    {m.specification || '-'}
                  </TableCell>
                  <TableCell>{m.is_active ? 'Y' : 'N'}</TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/admin/materials/settings/materials/${m.id}/edit`}
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
