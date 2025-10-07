'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building, Building2, Mail, Phone, RefreshCw, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/ui/strings'
import EmptyState from '@/components/ui/empty-state'

interface PartnerCompany {
  id: string
  company_name: string
  company_type?: 'npc' | 'subcontractor' | 'supplier'
  status?: 'active' | 'inactive'
  contact_name?: string
  contact_phone?: string
}

const COMPANY_TYPE_LABEL: Record<string, string> = {
  npc: '원도급사',
  subcontractor: '협력업체',
  supplier: '자재업체',
}

export function PartnersOverview() {
  const [partners, setPartners] = useState<PartnerCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

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

      if (!response.ok) {
        throw new Error(`파트너 정보를 불러오지 못했습니다. (HTTP ${response.status})`)
      }

      const data = await response.json()
      const list: PartnerCompany[] = data.data?.partner_companies || data.partnerCompanies || []
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5" />
              공급업체 관리
            </CardTitle>
            <CardDescription>공급업체 상태를 확인하고 연락처를 관리합니다.</CardDescription>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder={t('common.search')}
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
            />
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value as typeof statusFilter)}
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
                    width: '30%',
                    render: (p: PartnerCompany) => (
                      <div className="font-medium text-foreground">{p.company_name}</div>
                    ),
                  },
                  {
                    key: 'company_type',
                    header: '유형',
                    sortable: true,
                    width: '14%',
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
                    width: '20%',
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
                    width: '10%',
                    align: 'right',
                    render: (p: PartnerCompany) => (
                      <Badge variant={p.status === 'active' ? 'secondary' : 'outline'}>
                        {p.status === 'active' ? '활성' : '비활성'}
                      </Badge>
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
            <Building className="h-5 w-5" />
            연동 안내
          </CardTitle>
          <CardDescription>
            시공업체는 조직/현장 매핑 후 사용자 계정과 연동됩니다. 이 화면에서는 운영용 조회만
            제공됩니다.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
