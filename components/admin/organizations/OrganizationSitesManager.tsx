'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

type AssignedSite = {
  id: string
  name: string
  status: 'active' | 'inactive' | 'planning'
}

type SiteOption = {
  id: string
  name: string
  organization_id?: string | null
}

interface OrganizationSitesManagerProps {
  organizationId: string
  initialSites: AssignedSite[]
}

export function OrganizationSitesManager({
  organizationId,
  initialSites,
}: OrganizationSitesManagerProps) {
  const [assignedSites, setAssignedSites] = useState<AssignedSite[]>(() =>
    [...initialSites].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
  )
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([])
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)
  const [unassigningId, setUnassigningId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadSiteOptions = useCallback(async () => {
    setOptionsLoading(true)
    setOptionsError(null)
    try {
      const res = await fetch('/api/admin/sites/minimal', { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (res.ok && Array.isArray(json?.sites)) {
        setSiteOptions(json.sites as SiteOption[])
      } else {
        setSiteOptions([])
        setOptionsError('현장 목록을 불러오지 못했습니다.')
      }
    } catch {
      setSiteOptions([])
      setOptionsError('현장 목록을 불러오지 못했습니다.')
    } finally {
      setOptionsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSiteOptions()
  }, [loadSiteOptions])

  const selectableSites = useMemo(
    () =>
      siteOptions.filter(
        option =>
          (!option.organization_id || option.organization_id === organizationId) &&
          !assignedSites.some(site => site.id === option.id)
      ),
    [assignedSites, organizationId, siteOptions]
  )

  const sortedAssignedSites = useMemo(
    () => [...assignedSites].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR')),
    [assignedSites]
  )

  const assignSite = useCallback(async () => {
    if (!selectedSiteId) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/admin/sites/${selectedSiteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || '연동에 실패했습니다.')
      }
      const updated = json?.data
      if (updated?.id) {
        const mapped: AssignedSite = {
          id: updated.id,
          name: updated.name || '현장',
          status: (updated.status as AssignedSite['status']) || 'inactive',
        }
        setAssignedSites(prev => {
          const filtered = prev.filter(site => site.id !== mapped.id)
          return [...filtered, mapped]
        })
      }
      setSelectedSiteId('')
      toast({
        title: '연결 완료',
        description: '현장이 소속에 연결되었습니다.',
        variant: 'success',
      })
      await loadSiteOptions()
    } catch (error) {
      toast({
        title: '연결 실패',
        description: (error as Error)?.message || '현장을 연결하지 못했습니다.',
        variant: 'destructive',
      })
    } finally {
      setAssigning(false)
    }
  }, [organizationId, selectedSiteId, toast, loadSiteOptions])

  const unassignSite = useCallback(
    async (siteId: string) => {
      setUnassigningId(siteId)
      try {
        const res = await fetch(`/api/admin/sites/${siteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_id: null }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || '해제에 실패했습니다.')
        }
        setAssignedSites(prev => prev.filter(site => site.id !== siteId))
        toast({ title: '연결 해제 완료', description: '현장 연결이 해제되었습니다.' })
        await loadSiteOptions()
      } catch (error) {
        toast({
          title: '해제 실패',
          description: (error as Error)?.message || '현장 연결을 해제하지 못했습니다.',
          variant: 'destructive',
        })
      } finally {
        setUnassigningId(null)
      }
    },
    [loadSiteOptions, toast]
  )

  const columns = useMemo(
    () =>
      [
        {
          key: 'name',
          header: '현장명',
          sortable: true,
          render: (site: AssignedSite) => (
            <Link
              href={`/dashboard/admin/sites/${site.id}`}
              className="font-medium text-foreground underline underline-offset-2"
            >
              {site.name}
            </Link>
          ),
        },
        {
          key: 'status',
          header: '상태',
          sortable: true,
          align: 'right',
          width: '15%',
          render: (site: AssignedSite) => (
            <Badge variant={site.status === 'active' ? 'secondary' : 'outline'}>
              {site.status === 'active' ? '활성' : site.status === 'inactive' ? '비활성' : '준비중'}
            </Badge>
          ),
        },
        {
          key: 'actions',
          header: '작업',
          align: 'right',
          width: '16%',
          render: (site: AssignedSite) => (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => void unassignSite(site.id)}
              disabled={unassigningId === site.id}
            >
              {unassigningId === site.id ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> 해제 중
                </span>
              ) : (
                '연결 해제'
              )}
            </Button>
          ),
        },
      ] as Column<AssignedSite>[],
    [unassignSite, unassigningId]
  )

  return (
    <div className="space-y-4">
      <div className="px-4">
        <div className="rounded-lg border border-dashed border-border/50 bg-muted/20 p-4">
          <p className="text-sm font-medium text-muted-foreground">연동 현장 추가</p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row">
            <div className="flex-1">
              <CustomSelect
                value={selectedSiteId || 'none'}
                onValueChange={value => setSelectedSiteId(value === 'none' ? '' : value)}
                disabled={optionsLoading || selectableSites.length === 0}
              >
                <CustomSelectTrigger className="h-9 w-full justify-between">
                  <CustomSelectValue
                    placeholder={
                      optionsLoading ? '현장 불러오는 중...' : '연결할 현장을 선택하세요'
                    }
                  />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="none">선택 안 함</CustomSelectItem>
                  {selectableSites.map(site => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
                </CustomSelectContent>
              </CustomSelect>
              {optionsError ? (
                <p className="mt-1 text-[11px] text-destructive">{optionsError}</p>
              ) : (
                selectableSites.length === 0 &&
                !optionsLoading && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    연동 가능한 미지정 현장이 없습니다.
                  </p>
                )
              )}
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void assignSite()}
              disabled={assigning || !selectedSiteId}
              className="md:w-32 text-xs"
            >
              {assigning ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  연결 중...
                </span>
              ) : (
                '연결'
              )}
            </Button>
          </div>
        </div>
      </div>

      {sortedAssignedSites.length === 0 ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">연동된 현장이 없습니다.</p>
      ) : (
        <DataTable<AssignedSite>
          data={sortedAssignedSites}
          rowKey={site => site.id}
          stickyHeader
          columns={columns}
        />
      )}
    </div>
  )
}
