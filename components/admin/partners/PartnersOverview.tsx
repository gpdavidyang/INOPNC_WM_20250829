'use client'

import DataTable from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import EmptyState from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Building2,
  ExternalLink,
  Filter,
  Info,
  Mail,
  Phone,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface MaterialSupplier {
  id: string
  company_name: string
  status?: 'active' | 'inactive'
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  business_number?: string
}

function PartnersOverview() {
  const [partners, setPartners] = useState<MaterialSupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    company_name: '',
    status: 'active',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    business_number: '',
  })

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await fetch(`/api/admin/material-suppliers?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        credentials: 'include',
      })
      if (!response.ok)
        throw new Error(`파트너 정보를 불러오지 못했습니다. (HTTP ${response.status})`)
      const data = await response.json()
      const list: MaterialSupplier[] = data.data?.material_suppliers || []
      setPartners(list)
    } catch (err) {
      console.error('[PartnersOverview] load error:', err)
      setError('파트너 목록을 불러오지 못했습니다. 나중에 다시 시도해 주세요.')
      setPartners([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void loadPartners()
  }, [loadPartners])

  const filteredPartners = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return partners
    return partners.filter(partner => {
      const haystack = [
        partner.company_name,
        partner.contact_name,
        partner.contact_phone,
        partner.contact_email,
        partner.business_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(text)
    })
  }, [keyword, partners])

  const handleRefresh = () => {
    setRefreshing(true)
    void loadPartners()
  }

  const handleCreate = async () => {
    if (!createForm.company_name.trim()) return
    try {
      setCreating(true)
      const res = await fetch('/api/admin/material-suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.company_name,
          status: createForm.status,
          contact_name: createForm.contact_name,
          contact_phone: createForm.contact_phone,
          contact_email: createForm.contact_email,
          address: createForm.address,
          business_number: createForm.business_number,
        }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setShowCreate(false)
      setCreateForm({
        company_name: '',
        status: 'active',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        address: '',
        business_number: '',
      })
      void loadPartners()
    } catch (err) {
      console.error('[PartnersOverview] create error:', err)
      setError('거래처를 생성하지 못했습니다.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      const res = await fetch(`/api/admin/material-suppliers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        if (res.status === 409) {
          throw new Error(
            payload?.error ||
              '다른 데이터와 연결된 거래처입니다. 관련 정보를 먼저 삭제한 뒤 다시 시도해 주세요.'
          )
        }
        const message = payload?.error || `HTTP ${res.status}`
        throw new Error(message)
      }
      void loadPartners()
    } catch (err) {
      console.error('[PartnersOverview] delete error:', err)
      setError(err instanceof Error ? err.message : '삭제하지 못했습니다.')
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
                placeholder="상호명, 담당자, 연락처 등으로 검색..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="h-10 rounded-xl bg-white border-slate-200 pl-10 pr-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all w-full"
              />
            </div>

            {/* Status Filter & Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="relative min-w-[140px]">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10 pointer-events-none" />
                <CustomSelect
                  value={statusFilter}
                  onValueChange={value => setStatusFilter(value as typeof statusFilter)}
                >
                  <CustomSelectTrigger className="h-10 w-full rounded-xl bg-white border border-slate-200 pl-10 pr-4 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <CustomSelectValue placeholder="전체 상태" />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="rounded-xl border-slate-200 shadow-xl overflow-hidden z-[110]">
                    <CustomSelectItem value="all" className="font-medium">
                      전체 상태
                    </CustomSelectItem>
                    <CustomSelectItem value="active" className="font-medium">
                      활성 업체
                    </CustomSelectItem>
                    <CustomSelectItem value="inactive" className="font-medium">
                      비활성 업체
                    </CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>

              {/* Refresh Button - Text Only */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-10 px-4 rounded-xl border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all text-sm font-medium shrink-0"
              >
                {refreshing ? '갱신 중...' : '새로고침'}
              </Button>

              {/* New Partner Button */}
              <Button
                className="h-10 rounded-xl bg-[#1A254F] hover:bg-[#1A254F]/90 text-white px-5 shadow-sm transition-all gap-2 text-sm flex items-center justify-center whitespace-nowrap shrink-0 border-none"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="font-bold">새 자재거래처 등록</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Registration Form (Inline Expanded) */}
      {showCreate && (
        <Card className="rounded-2xl border-blue-100 bg-blue-50/10 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-4 px-6 pt-6 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-[#1A254F]">
                  새 자재거래처 등록
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400">
                  필수 정보를 입력하여 새로운 파트너사를 등록하세요.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreate(false)}
              className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:text-slate-600 hover:bg-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-5 md:grid-cols-3">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">업체 상호명 *</label>
                <Input
                  value={createForm.company_name}
                  onChange={e => setCreateForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="공식 상호명을 입력하세요"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium shadow-sm focus:ring-2 focus:ring-blue-500/10 transition-all font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">운영 상태</label>
                <CustomSelect
                  value={createForm.status}
                  onValueChange={value => setCreateForm(prev => ({ ...prev, status: value }))}
                >
                  <CustomSelectTrigger className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium">
                    <CustomSelectValue />
                  </CustomSelectTrigger>
                  <CustomSelectContent className="rounded-xl">
                    <CustomSelectItem value="active">활성 (운영 중)</CustomSelectItem>
                    <CustomSelectItem value="inactive">비활성 (중지)</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">사업자등록번호</label>
                <Input
                  value={createForm.business_number}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, business_number: e.target.value }))
                  }
                  placeholder="000-00-00000"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium shadow-sm font-mono"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">사업장 주소</label>
                <Input
                  value={createForm.address}
                  onChange={e => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="본사 또는 사업장 소재지"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">대표 담당자</label>
                <Input
                  value={createForm.contact_name}
                  onChange={e => setCreateForm(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="성명"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">대표 연락처</label>
                <Input
                  value={createForm.contact_phone}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, contact_phone: e.target.value }))
                  }
                  placeholder="010-0000-0000"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 ml-1">공식 이메일</label>
                <Input
                  value={createForm.contact_email}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, contact_email: e.target.value }))
                  }
                  placeholder="example@company.com"
                  className="h-10 rounded-xl bg-white border-slate-200 text-sm font-medium"
                />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-blue-100/50">
              <Button
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={creating}
                className="h-10 px-6 rounded-xl bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-semibold transition-all text-sm shadow-sm"
              >
                취소
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !createForm.company_name.trim()}
                className="h-10 px-8 rounded-xl bg-[#1A254F] hover:bg-[#2A355F] text-white font-bold shadow-lg shadow-blue-900/10 transition-all text-sm"
              >
                {creating ? '처리 중...' : '등록 완료'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Table Card */}
      {loading ? (
        <Card className="rounded-2xl border-gray-200 shadow-sm p-12">
          <EmptyState description="업체 정보를 신속하게 불러오는 중입니다..." />
        </Card>
      ) : error ? (
        <Card className="rounded-2xl border-rose-100 bg-rose-50/20 shadow-sm p-8">
          <EmptyState title="서버 통신 오류" description={error} />
        </Card>
      ) : (
        <Card className="rounded-2xl border-gray-200 shadow-sm shadow-gray-200/40 overflow-hidden">
          <CardHeader className="pb-4 px-6 pt-6 border-b border-gray-50 bg-gray-50/10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-50 rounded-lg">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              <CardTitle className="text-base font-bold text-[#1A254F]">
                자재 거래처 리스트
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable<MaterialSupplier>
              data={filteredPartners}
              rowKey={p => p.id}
              stickyHeader
              headerClassName="bg-[#8da0cd]"
              columns={[
                {
                  key: 'company_name',
                  header: '거래처 정보',
                  sortable: true,
                  width: '35%',
                  render: (p: MaterialSupplier) => (
                    <div className="flex flex-col gap-1 pl-4">
                      <div className="font-bold text-sm text-[#1A254F] tracking-tight">
                        {p.company_name}
                      </div>
                      {p.address && (
                        <div
                          className="text-xs text-slate-400 font-medium truncate py-0.5"
                          title={p.address}
                        >
                          {p.address}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'contact_name',
                  header: '현장 담당자',
                  sortable: true,
                  width: '15%',
                  render: (p: MaterialSupplier) =>
                    p.contact_name ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm text-slate-400">
                          <Users className="w-4 h-4" />
                        </div>
                        {p.contact_name}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300 italic">미등록</span>
                    ),
                },
                {
                  key: 'contact',
                  header: '연락처 실황',
                  sortable: false,
                  width: '25%',
                  render: (p: MaterialSupplier) => (
                    <div className="space-y-1.5 px-2">
                      {p.contact_phone ? (
                        <div className="flex items-center gap-2 text-blue-600 font-mono text-sm leading-none bg-blue-50/30 p-1.5 rounded-lg border border-blue-100/50 w-fit">
                          <Phone className="h-3.5 w-3.5" />
                          {p.contact_phone}
                        </div>
                      ) : null}
                      {p.contact_email ? (
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-medium pl-1">
                          <Mail className="h-3.5 w-3.5 opacity-50" />
                          {p.contact_email}
                        </div>
                      ) : null}
                      {!p.contact_phone && !p.contact_email && (
                        <span className="text-xs text-slate-300 italic">정보 없음</span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: '운용 상태',
                  sortable: true,
                  width: '10%',
                  align: 'center',
                  render: (p: MaterialSupplier) => (
                    <Badge
                      className={cn(
                        'border-none font-semibold text-[10px] rounded-lg h-6 px-2.5 shadow-none',
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-400'
                      )}
                    >
                      {p.status === 'active' ? '활성' : '비활성'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: '관리 액션',
                  width: '15%',
                  align: 'right',
                  render: (p: MaterialSupplier) => (
                    <div className="flex items-center justify-end gap-2 pr-4">
                      <Button
                        asChild
                        variant="ghost"
                        size="compact"
                        className="h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold px-3 border border-blue-100/50 transition-all text-xs"
                      >
                        <a
                          href={`/dashboard/admin/partners/${p.id}/edit`}
                          className="flex items-center gap-2"
                        >
                          <span>상세</span>
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="compact"
                        className="h-8 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold px-3 border border-rose-100/50 transition-all text-xs"
                        onClick={() => handleDelete(p.id)}
                      >
                        <span>삭제</span>
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-6 flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#1A254F] flex items-center gap-2">
            시스템 연동 안내
            <ExternalLink className="w-3.5 h-3.5 opacity-40" />
          </h4>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            시공업체(Partner) 정보는 조직 및 현장 매핑 정보를 통해 실제 사용자 계정과 유기적으로
            연동됩니다. 해당 리스트는 시스템 운영 및 자재 발주를 위한 통합 마스터 데이터를 관리하는
            용도로 제공됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PartnersOverview
