'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { UserRole, UserStatus } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: '본사관리자' },
  { value: 'system_admin', label: '시스템관리자' },
  { value: 'site_manager', label: '현장관리자' },
  { value: 'customer_manager', label: '소속사 관리자' },
  { value: 'worker', label: '작업자' },
]

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'active', label: '활성' },
  { value: 'inactive', label: '비활성' },
  { value: 'suspended', label: '중지' },
]

type OrganizationOption = {
  id: string
  name: string
}

type UserEditFormProps = {
  user: {
    id: string
    full_name: string
    email: string
    phone?: string | null
    role?: UserRole | null
    status?: UserStatus | null
    organization_id?: string | null
  }
  organizations: OrganizationOption[]
  allowOrganizationChange?: boolean
}

export default function UserEditForm({
  user,
  organizations,
  allowOrganizationChange = false,
}: UserEditFormProps) {
  const router = useRouter()

  const [fullName, setFullName] = useState(user.full_name ?? '')
  const [email, setEmail] = useState(user.email ?? '')
  const [phone, setPhone] = useState(user.phone ?? '')
  const [role, setRole] = useState<UserRole>(user.role ?? 'worker')
  const [status, setStatus] = useState<UserStatus>(user.status ?? 'active')
  const [organizationId, setOrganizationId] = useState<string | null>(user.organization_id ?? null)
  const [loading, setLoading] = useState(false)

  const organizationOptions = useMemo(() => organizations, [organizations])

  const selectedOrganizationName = useMemo(() => {
    if (!organizationId) return '미지정'
    const match = organizationOptions.find(option => option.id === organizationId)
    return match?.name ?? '미지정'
  }, [organizationId, organizationOptions])

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (loading) return

      setLoading(true)
      try {
        const payload = {
          full_name: fullName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role,
          status,
          organization_id: allowOrganizationChange ? organizationId || null : undefined,
        }

        const response = await fetch(`/api/admin/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const body = await response.json().catch(() => ({}))
        if (!response.ok || body?.success === false) {
          throw new Error(body?.error || '사용자 정보를 수정하지 못했습니다.')
        }

        toast.success('사용자 정보를 수정했습니다.')
        router.push(`/dashboard/admin/users/${user.id}`)
        router.refresh()
      } catch (error) {
        console.error('[UserEditForm] failed to update user:', error)
        toast.error(error instanceof Error ? error.message : '사용자 정보를 수정하지 못했습니다.')
      } finally {
        setLoading(false)
      }
    },
    [
      allowOrganizationChange,
      email,
      fullName,
      loading,
      organizationId,
      phone,
      role,
      router,
      status,
      user.id,
    ]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>사용자 계정의 기본 정보를 수정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                placeholder="이름"
                value={fullName}
                onChange={event => setFullName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                placeholder="010-0000-0000"
                value={phone ?? ''}
                onChange={event => setPhone(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>역할</Label>
              <Select value={role} onValueChange={value => setRole(value as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>상태</Label>
              <Select value={status} onValueChange={value => setStatus(value as UserStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {allowOrganizationChange && (
              <div className="space-y-2">
                <Label>소속 조직</Label>
                <Select
                  value={organizationId ?? 'none'}
                  onValueChange={value => setOrganizationId(value === 'none' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="조직 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">미지정</SelectItem>
                    {organizationOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!allowOrganizationChange && (
              <div className="space-y-2">
                <Label>소속 조직</Label>
                <Input value={selectedOrganizationName} readOnly />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  )
}
