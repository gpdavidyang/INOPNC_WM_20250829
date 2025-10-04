'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building, Building2, Mail, Phone, RefreshCw, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { t } from '@/lib/ui/strings'

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
              파트너 관리
            </CardTitle>
            <CardDescription>
              협력사 및 공급업체 상태를 확인하고 연락처를 관리합니다.
            </CardDescription>
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
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            파트너 정보를 불러오는 중입니다...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-red-500">{error}</CardContent>
        </Card>
      ) : filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center text-sm text-muted-foreground">
            조건에 맞는 파트너사가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">파트너사</TableHead>
                  <TableHead className="w-[14%]">유형</TableHead>
                  <TableHead className="w-[20%]">담당자</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead className="w-[10%] text-right">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map(partner => (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{partner.company_name}</div>
                    </TableCell>
                    <TableCell>
                      {partner.company_type ? (
                        <Badge variant="outline">
                          {COMPANY_TYPE_LABEL[partner.company_type] || partner.company_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {partner.contact_name ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {partner.contact_name}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">미등록</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {partner.contact_phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {partner.contact_phone}
                          </div>
                        ) : null}
                        {partner.contact_name ? (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            담당: {partner.contact_name}
                          </div>
                        ) : null}
                        {!partner.contact_phone && !partner.contact_name ? (
                          <span className="text-xs text-muted-foreground">등록된 연락처 없음</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={partner.status === 'active' ? 'secondary' : 'outline'}>
                        {partner.status === 'active' ? '활성' : '비활성'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            파트너사는 조직/현장 매핑 후 사용자 계정에 연결됩니다. Phase 2에서는 등록·승인 플로우가
            이 화면에서 제공될 예정입니다.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
