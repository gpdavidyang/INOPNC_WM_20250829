import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import { Edit2, Save, X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="품목 수정"
        description="등록된 자재 품목의 상세 정보를 수정합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리', href: '/dashboard/admin/materials/settings/materials' },
          { label: '품목 수정' },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-[#1A254F] tracking-tight">
                  품목 정보 수정
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                  자재 마스터의 기본 속성 및 사용 상태를 변경합니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form action={action} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                    자재 코드
                  </label>
                  <Input
                    name="code"
                    defaultValue={(m as any).code || ''}
                    className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                    단위
                  </label>
                  <Input
                    name="unit"
                    defaultValue={(m as any).unit || ''}
                    className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                  품명 <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="name"
                  required
                  defaultValue={(m as any).name || ''}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                  규격
                </label>
                <Input
                  name="specification"
                  defaultValue={(m as any).specification || ''}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex items-center gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="relative flex h-6 w-11 items-center">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    defaultChecked={!!(m as any).is_active}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor="is_active"
                    className="h-6 w-11 cursor-pointer rounded-full bg-slate-200 transition-all peer-checked:bg-emerald-500 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"
                  />
                </div>
                <label
                  htmlFor="is_active"
                  className="text-sm font-bold text-[#1A254F] cursor-pointer"
                >
                  품목 사용 활성화
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <Button
                  type="submit"
                  className="flex-grow h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/10 transition-all gap-2 text-base"
                >
                  <Save className="w-5 h-5" />
                  <span>변경사항 저장하기</span>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  type="button"
                  className="h-12 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold px-6 transition-all gap-2 text-base"
                >
                  <Link href="/dashboard/admin/materials/settings/materials">
                    <X className="w-5 h-5" />
                    <span>취소</span>
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
