import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import EmptyState from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const metadata: Metadata = { title: '품목 관리' }

async function deleteMaterial(id: string) {
  'use server'
  const supabase = createClient()

  await supabase.from('materials').delete().eq('id', id)
  revalidatePath('/dashboard/admin/materials/settings/materials')
}

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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="품목 관리"
        description="자재(품목) 마스터를 관리합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리' },
        ]}
      />

      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden mx-4 sm:mx-6 lg:mx-8">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-2xl font-black text-[#1A254F] tracking-tight">
              품목 마스터 목록
            </CardTitle>
            <CardDescription className="text-sm font-medium text-slate-500 mt-1">
              시스템 전체에서 사용되는 자재 기준 정보를 관리합니다.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-nowrap shrink-0">
            <Button
              asChild
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-md shadow-blue-900/10 transition-all gap-2 whitespace-nowrap"
            >
              <Link
                href="/dashboard/admin/materials/settings/materials/new"
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">새 품목 등록</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-5 transition-all whitespace-nowrap"
            >
              <Link href="/dashboard/admin/materials/settings" className="whitespace-nowrap">
                <span className="whitespace-nowrap">뒤로가기</span>
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#8da0cd]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[140px] pl-8">
                    자재 코드
                  </TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                    품명
                  </TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[100px]">
                    단위
                  </TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter">
                    규격
                  </TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[100px] text-center">
                    상태
                  </TableHead>
                  <TableHead className="text-white font-bold text-[11px] uppercase tracking-tighter w-[160px] text-center pr-8">
                    관리 동작
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!materials || materials.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24">
                      <EmptyState description="등록된 품목이 없습니다." />
                    </TableCell>
                  </TableRow>
                )}
                {materials.map(m => (
                  <TableRow key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-mono text-[11px] font-black text-blue-600 pl-8 italic">
                      {m.code || '-'}
                    </TableCell>
                    <TableCell className="font-bold text-[#1A254F] py-5">{m.name}</TableCell>
                    <TableCell className="text-slate-500 font-medium">
                      <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100/50 text-xs">
                        {m.unit || '-'}
                      </span>
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[280px] text-slate-400 text-xs font-medium"
                      title={m.specification || ''}
                    >
                      {m.specification || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.is_active ? (
                        <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px] rounded-lg h-5 px-2 shadow-none">
                          사용중
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-50 text-slate-400 border-none font-bold text-[10px] rounded-lg h-5 px-2 shadow-none">
                          중지
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-8">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="compact"
                          className="h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold px-3 border border-blue-100"
                        >
                          <Link href={`/dashboard/admin/materials/settings/materials/${m.id}/edit`}>
                            수정
                          </Link>
                        </Button>
                        <form action={deleteMaterial.bind(null, m.id)} className="inline-flex">
                          <Button
                            type="submit"
                            variant="ghost"
                            size="compact"
                            className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 border border-rose-100"
                          >
                            삭제
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
