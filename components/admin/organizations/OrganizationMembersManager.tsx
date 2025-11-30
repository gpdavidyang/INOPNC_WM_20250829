'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, UserMinus, UserPlus, Search } from 'lucide-react'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/use-toast'

type Member = { id: string; name: string; role: string; email?: string }

type Candidate = {
  id: string
  name: string
  email?: string
  role?: string
  organization_id?: string | null
}

interface OrganizationMembersManagerProps {
  organizationId: string
  initialMembers: Member[]
}

const ROLE_LABELS: Record<string, string> = {
  admin: '본사관리자',
  system_admin: '시스템 관리자',
  site_manager: '현장관리자',
  supervisor: '감리',
  worker: '작업자',
  partner_admin: '파트너 관리자',
  production_manager: '생산관리자',
  customer_manager: '소속사관리자',
}

const sortMembers = (list: Member[]) =>
  [...list].sort((a, b) => (a.name || '-').localeCompare(b.name || '-', 'ko-KR'))

export function OrganizationMembersManager({
  organizationId,
  initialMembers,
}: OrganizationMembersManagerProps) {
  const [members, setMembers] = useState<Member[]>(() => sortMembers(initialMembers))
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const { toast } = useToast()

  const visibleCandidates = useMemo(
    () => candidates.filter(candidate => !members.some(m => m.id === candidate.id)),
    [candidates, members]
  )

  const loadCandidates = useCallback(
    async (term: string) => {
      setLoadingCandidates(true)
      try {
        const search = term ? `?search=${encodeURIComponent(term)}` : ''
        const res = await fetch(`/api/admin/organizations/${organizationId}/members${search}`, {
          cache: 'no-store',
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || '구성원 후보를 불러오지 못했습니다.')
        }
        setCandidates(Array.isArray(json?.candidates) ? (json.candidates as Candidate[]) : [])
      } catch (error) {
        setCandidates([])
        toast({
          title: '목록 불러오기 실패',
          description: (error as Error)?.message || '구성원 후보를 불러오지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setLoadingCandidates(false)
      }
    },
    [organizationId, toast]
  )

  useEffect(() => {
    void loadCandidates('')
  }, [loadCandidates])

  const handleAdd = useCallback(async () => {
    if (!selectedUserId) return
    setAdding(true)
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUserId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '구성원을 추가하지 못했습니다.')
      }
      if (json?.member) {
        setMembers(prev => sortMembers([...prev, json.member as Member]))
        setSelectedUserId('')
        toast({
          title: '구성원 추가 완료',
          description: '소속에 구성원이 연결되었습니다.',
          variant: 'success',
        })
      }
      await loadCandidates(searchTerm)
    } catch (error) {
      toast({
        title: '추가 실패',
        description: (error as Error)?.message || '구성원을 추가하지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setAdding(false)
    }
  }, [selectedUserId, organizationId, toast, loadCandidates, searchTerm])

  const handleRemove = useCallback(
    async (userId: string) => {
      setRemovingId(userId)
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}/members?user_id=${encodeURIComponent(userId)}`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
          }
        )
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || '구성원을 제거하지 못했습니다.')
        }
        setMembers(prev => sortMembers(prev.filter(member => member.id !== userId)))
        setSelectedUserId(prev => (prev === userId ? '' : prev))
        toast({ title: '제거 완료', description: '구성원이 소속에서 제거되었습니다.' })
        await loadCandidates(searchTerm)
      } catch (error) {
        toast({
          title: '제거 실패',
          description: (error as Error)?.message || '구성원을 제거하지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setRemovingId(null)
      }
    },
    [organizationId, loadCandidates, toast, searchTerm]
  )

  const columns = useMemo(
    () =>
      [
        {
          key: 'name',
          header: '이름',
          sortable: true,
          width: '35%',
          render: (m: Member) => (
            <Link
              href={`/dashboard/admin/users/${m.id}`}
              className="font-medium text-foreground underline underline-offset-2"
            >
              {m.name}
            </Link>
          ),
        },
        {
          key: 'role',
          header: '역할',
          sortable: true,
          width: '20%',
          render: (m: Member) => (
            <Badge variant="outline">{ROLE_LABELS[m.role] || m.role || '미지정'}</Badge>
          ),
        },
        {
          key: 'email',
          header: '이메일',
          sortable: true,
          render: (m: Member) => m.email ?? '-',
        },
        {
          key: 'actions',
          header: '작업',
          align: 'right',
          width: '16%',
          render: (m: Member) => (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => void handleRemove(m.id)}
              disabled={removingId === m.id}
            >
              {removingId === m.id ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> 제거 중
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserMinus className="h-4 w-4" /> 제거
                </span>
              )}
            </Button>
          ),
        },
      ] as Column<Member>[],
    [handleRemove, removingId]
  )

  return (
    <div className="space-y-4">
      <div className="px-4">
        <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-muted-foreground">소속 구성원 추가</p>
            <div className="flex items-center gap-2">
              <Input
                placeholder="이름 또는 이메일 검색"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 w-56"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void loadCandidates(searchTerm)}
                disabled={loadingCandidates}
              >
                {loadingCandidates ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" /> 검색 중
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Search className="h-4 w-4" /> 검색
                  </span>
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex-1">
              <CustomSelect
                value={selectedUserId || 'none'}
                onValueChange={value => setSelectedUserId(value === 'none' ? '' : value)}
                disabled={loadingCandidates || visibleCandidates.length === 0}
              >
                <CustomSelectTrigger className="h-10 w-full justify-between">
                  <CustomSelectValue
                    placeholder={
                      loadingCandidates ? '구성원 불러오는 중...' : '추가할 사용자를 선택하세요'
                    }
                  />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="none">선택 안 함</CustomSelectItem>
                  {visibleCandidates.map(candidate => (
                    <CustomSelectItem key={candidate.id} value={candidate.id}>
                      <span className="flex flex-col">
                        <span className="font-medium">{candidate.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {candidate.email || '이메일 없음'} ·{' '}
                          {ROLE_LABELS[candidate.role || ''] || candidate.role || '역할 없음'}
                          {candidate.organization_id ? ' (기존 연결 있음)' : ''}
                        </span>
                      </span>
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleAdd()}
              disabled={adding || !selectedUserId}
              className="md:w-32"
            >
              {adding ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" /> 추가 중...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" /> 추가
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {members.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">연동된 구성원이 없습니다.</p>
      ) : (
        <DataTable<Member> data={members} rowKey={m => m.id} stickyHeader columns={columns} />
      )}
    </div>
  )
}
