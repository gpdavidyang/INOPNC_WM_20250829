'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, Mail, MapPin, Phone, RefreshCw, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/ui/strings'
import Link from 'next/link'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'

interface Organization {
  id: string
  name: string
  type?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  member_count?: number
}

const TYPE_LABEL: Record<string, string> = {
  general_contractor: '원청',
  subcontractor: '협력사',
  supplier: '자재업체',
}

export function OrganizationsOverview() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/organizations', {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`조직 정보를 불러오지 못했습니다. (HTTP ${response.status})`)
      }

      const data = await response.json()
      const list: Organization[] = data.organizations || []
      setOrganizations(list)
    } catch (err) {
      console.error('[OrganizationsOverview] load error:', err)
      setError('조직 목록을 불러오지 못했습니다. 나중에 다시 시도해 주세요.')
      setOrganizations([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return organizations
    return organizations.filter(org => {
      const haystack = [org.name, org.type, org.address, org.contact_email, org.contact_phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(text)
    })
  }, [keyword, organizations])

  const handleRefresh = () => {
    setRefreshing(true)
    void loadOrganizations()
  }

  const { confirm } = useConfirm()
  const { toast } = useToast()
  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: '시공업체 삭제',
      description: `"${name}" 시공업체를 삭제할까요? 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/organizations/${id}`, { method: 'DELETE' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.success === false) throw new Error(j?.error || '삭제 실패')
      toast({ title: '삭제 완료', description: '시공업체가 삭제되었습니다.', variant: 'success' })
      void loadOrganizations()
    } catch (e: any) {
      toast({
        title: '오류',
        description: e?.message || '삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5" />
              소속(시공사) 관리
            </CardTitle>
            <CardDescription>
              현장 연동에 사용되는 시공업체(소속사) 정보를 조회합니다.
            </CardDescription>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2">
            <Input
              placeholder={t('common.search')}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">{t('common.refresh')}</span>
            </Button>
            <Button asChild variant="primary" className="shrink-0">
              <Link href="/dashboard/admin/organizations/new">신규 등록</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            소속(시공사) 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-red-500">{error}</CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-sm text-muted-foreground">
            조건에 맞는 소속(시공사)이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            <DataTable<Organization>
              data={filtered}
              rowKey={o => o.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'name',
                    header: '시공업체명',
                    sortable: true,
                    width: '28%',
                    render: (o: Organization) => (
                      <div className="font-medium text-foreground">
                        {o.name}
                        {o.contact_email ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {o.contact_email}
                          </div>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'address',
                    header: '주소',
                    sortable: true,
                    render: (o: Organization) =>
                      o.address ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{o.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      ),
                  },
                  {
                    key: 'contact',
                    header: '연락처',
                    sortable: false,
                    width: '18%',
                    render: (o: Organization) => (
                      <div className="space-y-1 text-sm">
                        {o.contact_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {o.contact_phone}
                          </div>
                        ) : null}
                        {o.contact_email ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {o.contact_email}
                          </div>
                        ) : null}
                        {!o.contact_phone && !o.contact_email ? (
                          <span className="text-xs text-muted-foreground">등록된 연락처 없음</span>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'member_count',
                    header: '연동 인원',
                    sortable: true,
                    width: '12%',
                    align: 'right',
                    render: (o: Organization) => (
                      <div className="flex items-center justify-end gap-1 text-sm font-medium">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {o.member_count ?? 0}명
                      </div>
                    ),
                  },
                  {
                    key: 'actions',
                    header: '작업',
                    sortable: false,
                    width: '16%',
                    align: 'right',
                    render: (o: Organization) => (
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/organizations/${o.id}`}>상세</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/admin/organizations/${o.id}/edit`}>수정</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(o.id, o.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    ),
                  },
                ] as Column<Organization>[]
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
