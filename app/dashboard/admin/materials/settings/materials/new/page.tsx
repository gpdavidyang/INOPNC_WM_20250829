import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { createClient } from '@/lib/supabase/server'
import { Plus, Save, X } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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
    <div className="px-0 pb-8 space-y-6">
      <PageHeader
        title="새 품목 등록"
        description="시스템 전체에서 사용될 새로운 자재 품목을 마스터에 등록합니다."
        breadcrumbs={[
          { label: '대시보드', href: '/dashboard/admin' },
          { label: '자재 관리', href: '/dashboard/admin/materials' },
          { label: '설정', href: '/dashboard/admin/materials/settings' },
          { label: '품목 관리', href: '/dashboard/admin/materials/settings/materials' },
          { label: '새 품목 등록' },
        ]}
      />

      <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full">
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-[#1A254F] tracking-tight">
                  품목 정보 입력
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                  자재 코드 및 상세 정보를 정확히 입력해주세요.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form action={createMaterialAction} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                    자재 코드
                  </label>
                  <Input
                    name="code"
                    placeholder="예: NPC-1000"
                    className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                    단위
                  </label>
                  <Input
                    name="unit"
                    placeholder="예: 말, 개, m"
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
                  placeholder="예: 콘크리트 NPC-1000"
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1">
                  규격
                </label>
                <Input
                  name="specification"
                  placeholder="예: 25-240-15"
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <Button
                  type="submit"
                  className="flex-grow h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/10 transition-all gap-2 text-base"
                >
                  <Save className="w-5 h-5" />
                  <span>새 품목 등록하기</span>
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
