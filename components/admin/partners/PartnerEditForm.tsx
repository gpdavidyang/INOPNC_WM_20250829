'use client'

import { ChangeEvent, FormEvent, useState, useTransition } from 'react'
import { Building2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'

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
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {formState.company_name || '미등록'}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="partner-name">상호명</Label>
              <Input
                id="partner-name"
                value={formState.company_name}
                onChange={handleChange('company_name')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-status">상태</Label>
              <CustomSelect
                value={formState.status ?? 'active'}
                onValueChange={handleStatusChange}
                disabled={isPending}
              >
                <CustomSelectTrigger className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <CustomSelectValue placeholder="상태 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="active">활성</CustomSelectItem>
                  <CustomSelectItem value="inactive">비활성</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-business-number">사업자등록번호</Label>
              <Input
                id="partner-business-number"
                value={formState.business_number || ''}
                placeholder="000-00-00000"
                onChange={handleChange('business_number')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="partner-address">주소</Label>
              <Input
                id="partner-address"
                value={(formState as any).address || ''}
                placeholder="도로명 주소 등"
                onChange={handleChange('address' as any)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-manager">담당자</Label>
              <Input
                id="partner-manager"
                value={formState.contact_name || ''}
                placeholder="미등록"
                onChange={handleChange('contact_name')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partner-phone">연락처</Label>
              <Input
                id="partner-phone"
                value={formState.contact_phone || ''}
                placeholder="미등록"
                onChange={handleChange('contact_phone')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="partner-email">이메일</Label>
              <Input
                id="partner-email"
                value={formState.contact_email || ''}
                placeholder="미등록"
                onChange={handleChange('contact_email')}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} variant="outline" className="min-w-[140px]">
              {isPending ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-5 w-5 text-destructive" />
          <div>
            <div className="text-sm font-semibold text-destructive">자재거래처 삭제</div>
            <p className="text-xs text-muted-foreground">
              삭제 후에는 복구할 수 없습니다. 필요한 데이터는 미리 백업해 주세요.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          {isDeleting ? '삭제 중...' : '자재거래처 삭제'}
        </Button>
      </div>
    </div>
  )
}
