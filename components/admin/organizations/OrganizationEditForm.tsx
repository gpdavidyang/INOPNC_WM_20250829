'use client'

import { ChangeEvent, FormEvent, useState, useTransition } from 'react'
import { Building2, Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import StickyActionBar from '@/components/ui/sticky-action-bar'

interface OrganizationEditFormProps {
  organization: {
    id: string
    name: string
    type?: string
    address?: string
    contact_email?: string
    contact_phone?: string
    description?: string
  }
}

const TYPE_LABEL: Record<string, string> = {
  general_contractor: '원청',
  subcontractor: '협력사',
  supplier: '자재업체',
}

export function OrganizationEditForm({ organization }: OrganizationEditFormProps) {
  const [formState, setFormState] = useState({ ...organization })
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleChange =
    (field: keyof OrganizationEditFormProps['organization']) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState(prev => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    startTransition(async () => {
      try {
        const response = await fetch(`/api/admin/organizations/${organization.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState),
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        if (data.organization) {
          setFormState({ ...data.organization })
        }

        toast({
          title: '저장 완료',
          description: '조직 정보가 갱신되었습니다.',
        })
      } catch (error) {
        console.error('[OrganizationEditForm] save error:', error)
        toast({
          title: '저장 실패',
          description: '조직 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form className="space-y-6 pb-20" onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            {formState.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">조직명</Label>
              <Input
                id="org-name"
                value={formState.name}
                disabled={isPending}
                onChange={handleChange('name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-type">구분</Label>
              <Input
                id="org-type"
                value={formState.type ? TYPE_LABEL[formState.type] || formState.type : '미지정'}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-phone">대표 전화</Label>
              <Input
                id="org-phone"
                value={formState.contact_phone || ''}
                placeholder="미등록"
                onChange={handleChange('contact_phone')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">대표 이메일</Label>
              <Input
                id="org-email"
                value={formState.contact_email || ''}
                placeholder="미등록"
                onChange={handleChange('contact_email')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-address">주소</Label>
              <Input
                id="org-address"
                value={formState.address || ''}
                placeholder="미등록"
                onChange={handleChange('address')}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-description">메모</Label>
              <Textarea
                id="org-description"
                value={formState.description || ''}
                className="min-h-[120px]"
                placeholder="조직 관련 메모가 여기에 표시됩니다."
                onChange={handleChange('description')}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} variant="primary">
              {isPending ? '저장 중...' : '변경사항 저장'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <StickyActionBar>
        <div className="mx-auto max-w-6xl flex items-center justify-end gap-2">
          <Button type="submit" disabled={isPending} variant="primary">
            {isPending ? '저장 중...' : '변경사항 저장'}
          </Button>
        </div>
      </StickyActionBar>
    </form>
  )
}
