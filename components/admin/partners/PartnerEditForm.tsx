'use client'

import { ChangeEvent, FormEvent, useState, useTransition } from 'react'
import { Building2, Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

const COMPANY_TYPE_LABEL: Record<string, string> = {
  npc: '원도급사',
  subcontractor: '협력업체',
  supplier: '자재업체',
}

interface PartnerEditFormProps {
  partner: {
    id: string
    company_name: string
    company_type?: string
    status?: string
    contact_name?: string
    contact_phone?: string
    contact_email?: string
  }
}

export function PartnerEditForm({ partner }: PartnerEditFormProps) {
  const [formState, setFormState] = useState({ ...partner })
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleChange =
    (field: keyof PartnerEditFormProps['partner']) => (event: ChangeEvent<HTMLInputElement>) => {
      setFormState(prev => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/partner-companies/${partner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        if (data.partner) {
          setFormState({ ...data.partner })
        }

        toast({ title: '저장 완료', description: '파트너 정보가 갱신되었습니다.' })
      } catch (error) {
        console.error('[PartnerEditForm] save error:', error)
        toast({
          title: '저장 실패',
          description: '파트너 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {formState.company_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partner-name">시공업체</Label>
              <Input
                id="partner-name"
                value={formState.company_name}
                onChange={handleChange('company_name')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-type">유형</Label>
              <Input
                id="partner-type"
                value={
                  formState.company_type
                    ? COMPANY_TYPE_LABEL[formState.company_type] || formState.company_type
                    : '미지정'
                }
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-status">상태</Label>
              <Input
                id="partner-status"
                value={formState.status === 'inactive' ? '비활성' : '활성'}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-manager">담당자</Label>
              <Input
                id="partner-manager"
                value={formState.contact_name || ''}
                placeholder="미등록"
                onChange={handleChange('contact_name')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-phone">연락처</Label>
              <Input
                id="partner-phone"
                value={formState.contact_phone || ''}
                placeholder="미등록"
                onChange={handleChange('contact_phone')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
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

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={isPending} variant="default">
              {isPending ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
