'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building, Mail, Phone, RefreshCw, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import EmptyState from '@/components/ui/empty-state'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { t } from '@/lib/ui/strings'

interface PartnerCompany {
  id: string
  company_name: string
  company_type?: 'npc' | 'subcontractor' | 'supplier'
  status?: 'active' | 'inactive'
  contact_name?: string
  contact_phone?: string
  address?: string
}

const COMPANY_TYPE_LABEL: Record<string, string> = {
  npc: '원도급사',
  subcontractor: '협력업체',
  supplier: '자재업체',
}

function PartnersOverview() {
  const [partners, setPartners] = useState<PartnerCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    company_name: '',
    company_type: '',
    status: 'active',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    address: '',
  })

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const response = await fetch(`/api/admin/partner-companies?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      })
      if (!response.ok)
        throw new Error(`파트너 정보를 불러오지 못했습니다. (HTTP ${response.status})`)
      const data = await response.json()
      const list: PartnerCompany[] = data.data?.partner_companies || []
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
        partner.company_type,
        partner.contact_name,
        partner.contact_phone,
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
      const res = await fetch('/api/admin/partner-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setShowCreate(false)
      setCreateForm({
        company_name: '',
        company_type: '',
        status: 'active',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        address: '',
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
      const res = await fetch(`/api/admin/partner-companies/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      void loadPartners()
    } catch (err) {
      console.error('[PartnersOverview] delete error:', err)
      setError('삭제하지 못했습니다.')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="whitespace-nowrap"
              onClick={() => setShowCreate(true)}
            >
              + 새 자재거래처
            </Button>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={t('common.search')}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="all">전체 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">{t('common.refresh')}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent>
            <EmptyState description="업체 정보를 불러오는 중입니다..." />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent>
            <EmptyState title="오류" description={error} />
          </CardContent>
        </Card>
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState description="조건에 맞는 업체가 없습니다." />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            <DataTable<PartnerCompany>
              data={filteredPartners}
              rowKey={p => p.id}
              stickyHeader
              columns={
                [
                  {
                    key: 'company_name',
                    header: '업체명',
                    sortable: true,
                    width: '34%',
                    render: (p: PartnerCompany) => (
                      <div className="flex flex-col">
                        <div className="font-medium text-foreground">{p.company_name}</div>
                        {p.address ? (
                          <div
                            className="text-xs text-muted-foreground mt-0.5 truncate"
                            title={p.address}
                          >
                            {p.address}
                          </div>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'company_type',
                    header: '유형',
                    sortable: true,
                    width: '12%',
                    render: (p: PartnerCompany) =>
                      p.company_type ? (
                        <Badge variant="outline">
                          {COMPANY_TYPE_LABEL[p.company_type] || p.company_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      ),
                  },
                  {
                    key: 'contact_name',
                    header: '담당자',
                    sortable: true,
                    width: '12%',
                    render: (p: PartnerCompany) =>
                      p.contact_name ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {p.contact_name}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">미등록</span>
                      ),
                  },
                  {
                    key: 'contact',
                    header: '연락처',
                    sortable: false,
                    width: '24%',
                    render: (p: PartnerCompany) => (
                      <div className="space-y-1 text-sm">
                        {p.contact_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {p.contact_phone}
                          </div>
                        ) : null}
                        {p.contact_name ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            담당: {p.contact_name}
                          </div>
                        ) : null}
                        {!p.contact_phone && !p.contact_name ? (
                          <span className="text-xs text-muted-foreground">등록된 연락처 없음</span>
                        ) : null}
                      </div>
                    ),
                  },
                  {
                    key: 'status',
                    header: '상태',
                    sortable: true,
                    width: '8%',
                    align: 'right',
                    render: (p: PartnerCompany) => (
                      <Badge variant={p.status === 'active' ? 'secondary' : 'outline'}>
                        {p.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    ),
                  },
                  {
                    key: 'actions',
                    header: '동작',
                    width: '10%',
                    align: 'right',
                    render: (p: PartnerCompany) => (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          asChild
                          size="compact"
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          <a href={`/dashboard/admin/partners/${p.id}/edit`}>수정</a>
                        </Button>
                        <Button
                          size="compact"
                          variant="destructive"
                          className="whitespace-nowrap"
                          onClick={() => handleDelete(p.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    ),
                  },
                ] as Column<PartnerCompany>[]
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" /> 연동 안내
          </CardTitle>
          <CardDescription>
            시공업체는 조직/현장 매핑 후 사용자 계정과 연동됩니다. 운영용 조회 제공.
          </CardDescription>
        </CardHeader>
      </Card>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
            <div className="mb-3 text-lg font-semibold">새 자재거래처</div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>업체명</Label>
                <Input
                  value={createForm.company_name}
                  onChange={e => setCreateForm(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="업체명을 입력하세요"
                />
              </div>
              <div>
                <Label>유형</Label>
                <Input
                  value={createForm.company_type}
                  onChange={e => setCreateForm(prev => ({ ...prev, company_type: e.target.value }))}
                  placeholder="예: supplier"
                />
              </div>
              <div>
                <Label>상태</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                  value={createForm.status}
                  onChange={e => setCreateForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>주소</Label>
                <Input
                  value={createForm.address}
                  onChange={e => setCreateForm(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div>
                <Label>담당자</Label>
                <Input
                  value={createForm.contact_name}
                  onChange={e => setCreateForm(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>연락처</Label>
                <Input
                  value={createForm.contact_phone}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, contact_phone: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>이메일</Label>
                <Input
                  value={createForm.contact_email}
                  onChange={e =>
                    setCreateForm(prev => ({ ...prev, contact_email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
                취소
              </Button>
              <Button onClick={handleCreate} disabled={creating || !createForm.company_name.trim()}>
                {creating ? '생성 중…' : '생성'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PartnersOverview
