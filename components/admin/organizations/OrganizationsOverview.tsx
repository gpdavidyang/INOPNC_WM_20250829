'use client'

import DataTable from '@/components/admin/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useConfirm } from '@/components/ui/use-confirm'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { Building2, Mail, MapPin, Phone, Plus, RefreshCw, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Organization {
  id: string
  name: string
  type?: string
  address?: string
  contact_email?: string
  contact_phone?: string
  member_count?: number
  site_count?: number
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

  const stats = useMemo(() => {
    const total = organizations.length
    const totalMembers = organizations.reduce((acc, o) => acc + (o.member_count ?? 0), 0)
    const totalSites = organizations.reduce((acc, o) => acc + (o.site_count ?? 0), 0)
    return { total, totalMembers, totalSites }
  }, [organizations])

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
    let result = organizations

    // Keyword Search
    const text = keyword.trim().toLowerCase()
    if (text) {
      result = result.filter(org => {
        const haystack = [org.name, org.type, org.address, org.contact_email, org.contact_phone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(text)
      })
    }

    return result
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
      const res = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
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
      {/* 1. Filter & Action Hub (Combined) */}
      <Card className="rounded-2xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative flex-grow w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="업체명, 주소, 연락처 등으로 검색..."
                value={keyword}
                onChange={event => setKeyword(event.target.value)}
                className="h-10 rounded-xl bg-white border-slate-200 pl-10 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {/* Refresh Button */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium shrink-0"
              >
                {refreshing ? '갱신 중...' : '새로고침'}
              </Button>

              {/* New Button */}
              <Button
                asChild
                className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#1A254F]/90 text-white px-5 shadow-sm transition-all text-sm flex items-center justify-center whitespace-nowrap shrink-0 border-none"
              >
                <Link
                  href="/dashboard/admin/organizations/new"
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="font-medium whitespace-nowrap text-white">신규 소속 등록</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Stats Grid (v1.66 Standard) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: '총 관리 업체',
            value: stats.total,
            unit: '개소',
            bg: 'bg-indigo-50/50',
            text: 'text-[#1A254F]',
          },
          {
            label: '전체 연동 인원',
            value: stats.totalMembers,
            unit: '명',
            bg: 'bg-blue-50/50',
            text: 'text-blue-700',
          },
          {
            label: '활성 운영 현장',
            value: stats.totalSites,
            unit: '곳',
            bg: 'bg-sky-50/50',
            text: 'text-sky-700',
          },
        ].map(card => (
          <div
            key={card.label}
            className={cn('flex flex-col gap-1 p-5 rounded-xl border-none text-left', card.bg)}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
              {card.label}
            </span>
            <div className="flex items-baseline gap-1 mt-auto">
              <span className={cn('text-2xl font-bold italic tracking-tighter', card.text)}>
                {card.value.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium opacity-30 ml-1">{card.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <Card className="rounded-3xl border-gray-200 shadow-sm p-12">
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin opacity-20" />
            <p className="text-sm font-medium">소속 정보를 불러오는 중...</p>
          </div>
        </Card>
      ) : error ? (
        <Card className="rounded-3xl border-rose-100 bg-rose-50/10 shadow-sm p-12">
          <div className="text-center py-10">
            <p className="text-rose-600 font-bold mb-2">데이터 로드 오류</p>
            <p className="text-slate-500 text-sm">{error}</p>
            <Button variant="outline" className="mt-6 gap-2" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="rounded-3xl border-gray-200 shadow-sm p-12 bg-slate-50/30 border-dashed">
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-full shadow-sm border border-slate-100">
              <Building2 className="w-8 h-8 text-slate-300" />
            </div>
            <div>
              <p className="font-bold text-slate-800">조회된 소속사가 없습니다</p>
              <p className="text-xs text-slate-500 mt-1">검색어나 필터를 조정해 보세요.</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
          <CardContent className="p-0">
            <DataTable<Organization>
              data={filtered}
              rowKey={o => o.id}
              stickyHeader
              headerClassName="bg-[#8da0cd]"
              columns={[
                {
                  key: 'name',
                  header: '시공업체 상세',
                  sortable: true,
                  width: '30%',
                  render: (o: Organization) => (
                    <div className="flex flex-col gap-0.5 pl-4">
                      <div className="font-semibold text-sm text-[#1A254F] tracking-tight">
                        {o.name}
                      </div>
                      {o.contact_email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Mail className="h-3 w-3 opacity-50" />
                          {o.contact_email}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'address',
                  header: '사업장 주소',
                  sortable: true,
                  render: (o: Organization) =>
                    o.address ? (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">
                        <MapPin className="h-4 w-4 text-slate-300 shrink-0" />
                        <span className="truncate max-w-[200px]" title={o.address}>
                          {o.address}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">미등록</span>
                    ),
                },
                {
                  key: 'contact',
                  header: '유선 연락처',
                  sortable: false,
                  width: '18%',
                  render: (o: Organization) =>
                    o.contact_phone ? (
                      <div className="flex items-center gap-2 text-blue-600 font-medium text-sm leading-none bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-100/50 w-fit">
                        <Phone className="h-3.5 w-3.5" />
                        {o.contact_phone}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">미등록</span>
                    ),
                },
                {
                  key: 'member_count',
                  header: '연동 인원',
                  sortable: true,
                  width: '12%',
                  align: 'right',
                  render: (o: Organization) => (
                    <div className="flex items-center justify-end gap-1.5 pr-4">
                      <span className="text-base font-bold italic text-[#1A254F]">
                        {o.member_count ?? 0}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">명</span>
                    </div>
                  ),
                },
                {
                  key: 'site_count',
                  header: '연동 현장',
                  sortable: true,
                  width: '12%',
                  align: 'right',
                  render: (o: Organization) => (
                    <div className="flex items-center justify-end gap-1.5 pr-4">
                      <span className="text-base font-bold italic text-sky-700">
                        {o.site_count ?? 0}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 uppercase">곳</span>
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: '관리 액션',
                  sortable: false,
                  width: '18%',
                  align: 'right',
                  render: (o: Organization) => (
                    <div className="flex flex-nowrap items-center justify-end gap-2 pr-4">
                      <Button
                        asChild
                        size="xs"
                        variant="outline"
                        className="h-8 rounded-lg px-3 font-medium"
                      >
                        <Link href={`/dashboard/admin/organizations/${o.id}`}>상세</Link>
                      </Button>
                      <Button
                        asChild
                        size="xs"
                        variant="outline"
                        className="h-8 rounded-lg px-3 font-medium border-amber-200 text-amber-700 bg-amber-50/50"
                      >
                        <Link href={`/dashboard/admin/organizations/${o.id}/edit`}>수정</Link>
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="h-8 rounded-lg px-3 font-medium border-rose-100 text-rose-600 bg-rose-50/50"
                        onClick={event => {
                          event.preventDefault()
                          void handleDelete(o.id, o.name)
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
