'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { AlertTriangle, Edit3, Save, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChangeEvent, FormEvent, useState, useTransition } from 'react'

interface PartnerEditFormProps {
  partner: {
    id: string
    company_name: string
    status?: string
    contact_name?: string
    contact_phone?: string
    contact_email?: string
    address?: string
    business_number?: string
  }
}

export function PartnerEditForm({ partner }: PartnerEditFormProps) {
  const [formState, setFormState] = useState({ ...partner })
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleChange =
    (field: keyof PartnerEditFormProps['partner']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState(prev => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/material-suppliers/${partner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState),
          credentials: 'include',
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (data.supplier) setFormState({ ...data.supplier })
        toast({ title: '저장 완료', description: '자재거래처 정보가 저장되었습니다.' })
      } catch (error) {
        console.error('[PartnerEditForm] save error:', error)
        toast({
          title: '저장 실패',
          description: '자재거래처 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          variant: 'destructive',
        })
      }
    })
  }

  const handleDelete = async () => {
    if (isDeleting) return
    if (!window.confirm('정말 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.')) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/material-suppliers/${partner.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error || `HTTP ${response.status}`)
      }
      toast({ title: '삭제 완료', description: '자재거래처가 삭제되었습니다.' })
      router.push('/dashboard/admin/partners')
    } catch (error) {
      console.error('[PartnerEditForm] delete error:', error)
      toast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '자재거래처를 삭제하지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStatusChange = (value: string) => {
    setFormState(prev => ({ ...prev, status: value as 'active' | 'inactive' }))
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto w-full pb-12">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6 px-8 py-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-[#1A254F] tracking-tight">
                  거래처 상세 정보
                </CardTitle>
                <CardDescription className="text-sm font-medium text-slate-500 mt-1">
                  협력사(Partner)의 마스터 데이터를 최신 상태로 관리합니다.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label
                  htmlFor="partner-name"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  공식 상호명
                </Label>
                <Input
                  id="partner-name"
                  value={formState.company_name}
                  onChange={handleChange('company_name')}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="partner-status"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  운용 상태
                </Label>
                <CustomSelect
                  value={formState.status ?? 'active'}
                  onValueChange={handleStatusChange}
                  disabled={isPending}
                >
                  <CustomSelectTrigger className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none">
                    <CustomSelectValue placeholder="상태 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden">
                    <CustomSelectItem value="active" className="font-bold py-3">
                      활성 (사용 가능)
                    </CustomSelectItem>
                    <CustomSelectItem value="inactive" className="font-bold py-3">
                      비활성 (거래 중단)
                    </CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="partner-business-number"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  사업자등록번호
                </Label>
                <Input
                  id="partner-business-number"
                  value={formState.business_number || ''}
                  placeholder="000-00-00000"
                  onChange={handleChange('business_number')}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="partner-address"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  사업장 주소
                </Label>
                <Input
                  id="partner-address"
                  value={(formState as any).address || ''}
                  placeholder="본사 또는 전시장 소재지"
                  onChange={handleChange('address' as any)}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="partner-manager"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  대표 담당자
                </Label>
                <Input
                  id="partner-manager"
                  value={formState.contact_name || ''}
                  placeholder="미등록"
                  onChange={handleChange('contact_name')}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="partner-phone"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  대표 연락처
                </Label>
                <Input
                  id="partner-phone"
                  value={formState.contact_phone || ''}
                  placeholder="미등록"
                  onChange={handleChange('contact_phone')}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="partner-email"
                  className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40 px-1"
                >
                  공식 이메일
                </Label>
                <Input
                  id="partner-email"
                  value={formState.contact_email || ''}
                  placeholder="미등록"
                  onChange={handleChange('contact_email')}
                  disabled={isPending}
                  className="h-11 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-mono text-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-8 mt-8 border-t border-slate-100">
              <Button
                type="submit"
                disabled={isPending}
                className="flex-grow h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-900/10 transition-all gap-2 text-base"
              >
                <Save className="w-5 h-5" />
                {isPending ? '저장 중...' : '변경사항 저장하기'}
              </Button>
              <Button
                asChild
                variant="outline"
                type="button"
                className="h-12 rounded-xl border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-bold px-8 transition-all gap-2 text-base"
              >
                <Link href="/dashboard/admin/partners">
                  <X className="w-5 h-5" />
                  <span>취소</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-rose-100 bg-rose-50/20 p-8 shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center border border-rose-200 shadow-sm shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-rose-700 tracking-tight text-lg">
              거래처 정보 영구 삭제
            </h4>
            <p className="text-sm text-rose-600/70 font-medium leading-relaxed">
              삭제한 데이터는 즉시 시스템에서 제거되며 복구가 불가능합니다.
              <br className="hidden md:block" />
              자재 데이터 마스터와 연동된 경우 삭제가 제한될 수 있습니다.
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-12 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white font-bold px-8 transition-all shrink-0 shadow-sm"
        >
          {isDeleting ? '처리 중...' : '거래처 삭제하기'}
        </Button>
      </div>
    </div>
  )
}
