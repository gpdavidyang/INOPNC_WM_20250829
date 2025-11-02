'use client'

import React, { useEffect, useMemo, useState } from 'react'
import StatsCard from '@/components/ui/stats-card'
import {
  PillTabs as Tabs,
  PillTabsContent as TabsContent,
  PillTabsList as TabsList,
  PillTabsTrigger as TabsTrigger,
} from '@/components/ui/pill-tabs'
import { Input } from '@/components/ui/input'
import CustomSelect, {
  CustomSelectTrigger,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import InvoiceDocumentsTable from '@/components/admin/InvoiceDocumentsTable'
import DocumentVersionsDialog from './DocumentVersionsDialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type DocType = {
  code: string
  label: string
  required: { start: boolean; progress: boolean; completion: boolean }
  isActive?: boolean
  sortOrder?: number
}

const generateTypeCode = (label: string, existingCodes: string[]): string => {
  const baseFromLabel = label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const base = baseFromLabel || 'doc'
  let candidate = base
  let suffix = 1
  while (existingCodes.includes(candidate)) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  return candidate
}

export default function InvoiceTabsClient() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'summary' | 'documents' | 'list' | 'settings'>('summary')
  const [summary, setSummary] = useState<{
    docTypes: DocType[]
    sites: Array<{
      site_id: string
      site_name: string
      docs: Record<string, any>
      progress?: number
    }>
    totals: { sites: number; documents: number }
  }>({ docTypes: [], sites: [], totals: { sites: 0, documents: 0 } })
  const [loading, setLoading] = useState(false)
  const [types, setTypes] = useState<DocType[]>([])
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([])
  const [orgId, setOrgId] = useState<string>('')
  const [siteIdFilter, setSiteIdFilter] = useState('')
  const [sitesCatalog, setSitesCatalog] = useState<Array<{ id: string; name: string }>>([])
  const siteOptions = useMemo(() => {
    const a = (summary.sites || []).map(s => ({ id: s.site_id, name: s.site_name || s.site_id }))
    const map = new Map<string, { id: string; name: string }>()
    for (const it of a) map.set(it.id, it)
    for (const it of sitesCatalog) if (!map.has(it.id)) map.set(it.id, it)
    return Array.from(map.values())
  }, [summary.sites, sitesCatalog])
  const summaryDocTypes = useMemo(() => {
    return (summary.docTypes || [])
      .filter(dt => dt.isActive !== false)
      .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  }, [summary.docTypes])
  const summarySitesFiltered = useMemo(
    () =>
      (summary.sites || []).filter(site => (siteIdFilter ? site.site_id === siteIdFilter : true)),
    [summary.sites, siteIdFilter]
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        if (orgId) qs.set('organization_id', orgId)
        const [sumRes, typesRes, orgRes, siteRes] = await Promise.all([
          fetch(`/api/invoice/summary?${qs.toString()}`),
          fetch('/api/invoice/types'),
          fetch('/api/organizations'),
          fetch(
            `/api/admin/sites/minimal${orgId ? `?organization_id=${encodeURIComponent(orgId)}` : ''}`
          ),
        ])
        const sum = await sumRes.json()
        const ty = await typesRes.json()
        const og = await orgRes.json().catch(() => ({}))
        const sc = await siteRes.json().catch(() => ({}))
        if (sum?.data) setSummary(sum.data)
        if (Array.isArray(ty?.data)) {
          setTypes(
            ty.data.map((item: any) => ({
              code: item.code,
              label: item.label,
              required: item.required || {
                start: false,
                progress: false,
                completion: false,
              },
              sortOrder: Number(item.sort_order || item.sortOrder || 0),
              isActive: item.isActive !== false,
            }))
          )
        }
        if (Array.isArray(og?.data)) setOrgs(og.data)
        if (Array.isArray(sc?.sites)) setSitesCatalog(sc.sites)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  // Initialize upload doc type when types loaded
  // List tab state
  const [list, setList] = useState<any[]>([])
  const [listLoading, setListLoading] = useState(false)
  // Versions dialog state
  const [vOpen, setVOpen] = useState(false)
  const [vSiteId, setVSiteId] = useState<string | undefined>(undefined)
  const [vDocType, setVDocType] = useState<string | undefined>(undefined)
  const [vSiteName, setVSiteName] = useState<string | undefined>(undefined)

  // Export latest manifest per doc_type (parallel downloads for now)
  const exportSite = async (siteId: string) => {
    try {
      const res = await fetch(`/api/invoice/export?site_id=${encodeURIComponent(siteId)}`)
      const j = await res.json()
      const files: Array<{ url: string; file_name: string }> = j?.data?.files || []
      if (!files.length) return toast({ title: '내보낼 파일 없음', variant: 'warning' as any })
      for (const f of files) {
        const a = document.createElement('a')
        a.href = f.url
        a.download = f.file_name || ''
        a.target = '_blank'
        a.click()
      }
      toast({ title: '내보내기 시작', description: `${files.length}개 파일` })
    } catch {
      toast({ title: '내보내기 실패', variant: 'destructive' })
    }
  }
  const loadList = async () => {
    setListLoading(true)
    try {
      const params = new URLSearchParams({ page: '1', limit: '20', category_type: 'invoice' })
      if (orgId) params.set('organization_id', orgId)
      const res = await fetch(`/api/unified-documents/v2?${params.toString()}`, {
        cache: 'no-store',
      })
      const json = await res.json()
      setList(Array.isArray(json?.data) ? json.data : [])
    } catch {
      setList([])
    } finally {
      setListLoading(false)
    }
  }
  useEffect(() => {
    if (tab === 'list') loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const handleDelete = async (target: DocType) => {
    if (!window.confirm(`'${target.label}' 문서유형을 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/invoice/types/${target.code}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('fail')
      setTypes(prev => prev.filter(it => it.code !== target.code))
      toast({ title: '삭제되었습니다', description: target.label })
    } catch {
      toast({
        title: '삭제 실패',
        description: '문서유형 삭제 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (target: DocType) => {
    const nextActive = target.isActive === false
    try {
      const res = await fetch(`/api/invoice/types/${target.code}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      })
      if (!res.ok) throw new Error('fail')
      const nextTypes = types.map(it =>
        it.code === target.code ? { ...it, isActive: nextActive } : it
      )
      setTypes(nextTypes)
      toast({
        title: nextActive ? '활성화됨' : '비활성화됨',
        description: target.label,
      })
    } catch {
      toast({
        title: '상태 변경 실패',
        description: '문서유형 상태를 변경하지 못했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div>
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        {/* Filters */}
        <div className="mb-2 flex items-center gap-2">
          <label className="text-xs text-gray-600">소속사</label>
          <div className="min-w-[240px]">
            <CustomSelect
              value={orgId || 'all'}
              onValueChange={v => setOrgId(v === 'all' ? '' : v)}
            >
              <CustomSelectTrigger>
                <CustomSelectValue placeholder="전체" />
              </CustomSelectTrigger>
              <CustomSelectContent>
                <CustomSelectItem value="all">전체</CustomSelectItem>
                {orgs.map(o => (
                  <CustomSelectItem key={o.id} value={o.id}>
                    {o.name}
                  </CustomSelectItem>
                ))}
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </div>
        <TabsList className="mb-4 w-full" fill>
          <TabsTrigger fill value="summary">
            요약
          </TabsTrigger>
          <TabsTrigger fill value="documents">
            문서 현황
          </TabsTrigger>
          <TabsTrigger fill value="list">
            문서목록
          </TabsTrigger>
          <TabsTrigger fill value="settings">
            설정
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {loading ? (
            <div className="text-sm text-muted-foreground">불러오는 중…</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatsCard label="현장" value={summary.totals.sites} unit="site" />
                <StatsCard label="업로드" value={summary.totals.documents} unit="count" />
              </div>

              <div className="overflow-x-auto border rounded-md bg-white">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2">현장</th>
                      {summary.docTypes.map(dt => (
                        <th key={dt.code} className="px-3 py-2 whitespace-nowrap">
                          {dt.label}
                        </th>
                      ))}
                      <th className="px-3 py-2">진행률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.sites.length === 0 ? (
                      <tr>
                        <td
                          className="px-3 py-6 text-center text-gray-500"
                          colSpan={summary.docTypes.length + 2}
                        >
                          표시할 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      summary.sites.map(s => (
                        <tr key={s.site_id} className="border-t">
                          <td className="px-3 py-2">{s.site_name || s.site_id}</td>
                          {summary.docTypes.map(dt => {
                            const has = !!s.docs?.[dt.code]
                            return (
                              <td
                                key={dt.code}
                                className="px-3 py-2 cursor-pointer"
                                onClick={() => {
                                  setVSiteId(s.site_id)
                                  setVDocType(dt.code)
                                  setVSiteName(s.site_name)
                                  setVOpen(true)
                                }}
                              >
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${
                                    has ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                  title={has ? '업로드됨' : '없음'}
                                />
                              </td>
                            )
                          })}
                          <td className="px-3 py-2">{s.progress ?? 0}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">현장별 문서 현황</h3>
                <p className="text-xs text-muted-foreground">
                  기성 문서 업로드·교체는 각 현장 상세 &gt; 기성청구 탭에서 진행할 수 있습니다.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href="/dashboard/admin/sites">현장 목록 이동</a>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">현장 선택</span>
              <div className="min-w-[220px]">
                <CustomSelect
                  value={siteIdFilter || 'all'}
                  onValueChange={v => setSiteIdFilter(v === 'all' ? '' : v)}
                >
                  <CustomSelectTrigger>
                    <CustomSelectValue placeholder="전체" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all">전체</CustomSelectItem>
                    {siteOptions.map(opt => (
                      <CustomSelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              {siteIdFilter ? (
                <Button size="sm" variant="ghost" onClick={() => setSiteIdFilter('')}>
                  초기화
                </Button>
              ) : null}
            </div>

            <div className="space-y-3">
              {summarySitesFiltered.length === 0 ? (
                <div className="text-sm text-muted-foreground">표시할 현장이 없습니다.</div>
              ) : (
                summarySitesFiltered.map(siteEntry => {
                  const progressLabel =
                    siteEntry.progress !== undefined ? `${siteEntry.progress}%` : '0%'
                  return (
                    <div
                      key={siteEntry.site_id}
                      className="rounded-lg border bg-white p-4 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {siteEntry.site_name || siteEntry.site_id}
                          </div>
                          <div className="text-xs text-muted-foreground">{siteEntry.site_id}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            진행률 {progressLabel}
                          </Badge>
                          <Button asChild size="sm" variant="outline" className="gap-1">
                            <a href={`/dashboard/admin/sites/${siteEntry.site_id}?tab=invoices`}>
                              관리
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportSite(siteEntry.site_id)}
                            className="gap-1"
                          >
                            내보내기
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {summaryDocTypes.map(type => {
                          const hasDoc = !!siteEntry.docs?.[type.code]
                          return (
                            <div
                              key={`${siteEntry.site_id}-${type.code}`}
                              className="flex items-center justify-between rounded border px-3 py-2 text-xs"
                            >
                              <span className="text-muted-foreground">{type.label}</span>
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 font-medium',
                                  hasDoc
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                )}
                              >
                                {hasDoc ? '등록됨' : '미등록'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="list">
          {listLoading ? (
            <div className="text-sm text-muted-foreground">불러오는 중…</div>
          ) : (
            <div className="rounded-lg border bg-white p-3">
              <InvoiceDocumentsTable docs={list} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="rounded-lg border bg-white p-3">
            <div className="mb-2 text-sm text-muted-foreground">
              문서유형 목록(라벨/필수단계 편집 가능, 코드는 시스템이 자동으로 생성합니다 — 테이블
              미프로비저닝 시 저장은 제한될 수 있습니다)
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2">정렬</th>
                    <th className="px-3 py-2">라벨</th>
                    <th className="px-3 py-2">필수(착수)</th>
                    <th className="px-3 py-2">필수(진행)</th>
                    <th className="px-3 py-2">필수(완료)</th>
                    <th className="px-3 py-2">활성</th>
                    <th className="px-3 py-2">동작</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t, idx) => {
                    const isActive = t.isActive !== false
                    return (
                      <tr
                        key={t.code}
                        className={`border-t ${!isActive ? 'bg-gray-50 text-gray-500' : ''}`}
                      >
                        <td className="px-3 py-2">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <Input
                            defaultValue={t.label}
                            onBlur={async e => {
                              const label = e.target.value.trim()
                              if (!label) {
                                toast({
                                  title: '입력 필요',
                                  description: '라벨은 비워둘 수 없습니다.',
                                  variant: 'warning' as any,
                                })
                                e.target.value = t.label
                                return
                              }
                              if (label === t.label) return
                              try {
                                const res = await fetch(`/api/invoice/types/${t.code}`, {
                                  method: 'PATCH',
                                  headers: { 'content-type': 'application/json' },
                                  body: JSON.stringify({ label }),
                                })
                                if (!res.ok) throw new Error('fail')
                                setTypes(prev =>
                                  prev.map(x => (x.code === t.code ? { ...x, label } : x))
                                )
                                toast({ title: '저장됨', description: `${t.code} 라벨 업데이트` })
                              } catch {
                                toast({
                                  title: '저장 실패',
                                  description: '테이블 미프로비저닝 또는 서버 오류',
                                  variant: 'destructive',
                                })
                                e.target.value = t.label
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            defaultChecked={t.required.start}
                            onChange={async e => {
                              const nextRequired = { ...t.required, start: e.target.checked }
                              try {
                                const res = await fetch(`/api/invoice/types/${t.code}`, {
                                  method: 'PATCH',
                                  headers: { 'content-type': 'application/json' },
                                  body: JSON.stringify({ stageRequired: nextRequired }),
                                })
                                if (!res.ok) throw new Error('fail')
                                setTypes(prev =>
                                  prev.map(x =>
                                    x.code === t.code ? { ...x, required: nextRequired } : x
                                  )
                                )
                                toast({ title: '저장됨', description: '필수(착수) 업데이트' })
                              } catch {
                                toast({ title: '저장 실패', variant: 'destructive' })
                                e.target.checked = t.required.start
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            defaultChecked={t.required.progress}
                            onChange={async e => {
                              const nextRequired = { ...t.required, progress: e.target.checked }
                              try {
                                const res = await fetch(`/api/invoice/types/${t.code}`, {
                                  method: 'PATCH',
                                  headers: { 'content-type': 'application/json' },
                                  body: JSON.stringify({ stageRequired: nextRequired }),
                                })
                                if (!res.ok) throw new Error('fail')
                                setTypes(prev =>
                                  prev.map(x =>
                                    x.code === t.code ? { ...x, required: nextRequired } : x
                                  )
                                )
                                toast({ title: '저장됨', description: '필수(진행) 업데이트' })
                              } catch {
                                toast({ title: '저장 실패', variant: 'destructive' })
                                e.target.checked = t.required.progress
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            defaultChecked={t.required.completion}
                            onChange={async e => {
                              const nextRequired = { ...t.required, completion: e.target.checked }
                              try {
                                const res = await fetch(`/api/invoice/types/${t.code}`, {
                                  method: 'PATCH',
                                  headers: { 'content-type': 'application/json' },
                                  body: JSON.stringify({ stageRequired: nextRequired }),
                                })
                                if (!res.ok) throw new Error('fail')
                                setTypes(prev =>
                                  prev.map(x =>
                                    x.code === t.code ? { ...x, required: nextRequired } : x
                                  )
                                )
                                toast({ title: '저장됨', description: '필수(완료) 업데이트' })
                              } catch {
                                toast({ title: '저장 실패', variant: 'destructive' })
                                e.target.checked = t.required.completion
                              }
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {isActive ? '활성' : '비활성'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant={isActive ? 'outline' : 'secondary'}
                              className="min-w-[96px] justify-center"
                              onClick={() => handleToggleActive(t)}
                            >
                              {isActive ? '비활성화' : '활성화'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-w-[72px] justify-center"
                              onClick={() => handleDelete(t)}
                            >
                              삭제
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {types.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                        유형이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add new type (optional) */}
            <div className="mt-4 flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">라벨</label>
                <Input id="new_label" placeholder="예: 사용자 정의 문서" />
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  const label = (
                    document.getElementById('new_label') as HTMLInputElement
                  )?.value?.trim()
                  if (!label) {
                    toast({
                      title: '입력 필요',
                      description: '라벨을 입력하세요.',
                      variant: 'warning' as any,
                    })
                    return
                  }
                  const existingCodes = types.map(t => t.code)
                  const code = generateTypeCode(label, existingCodes)
                  try {
                    const res = await fetch('/api/invoice/types', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ code, label }),
                    })
                    if (!res.ok) throw new Error('fail')
                    setTypes(prev => [
                      ...prev,
                      {
                        code,
                        label,
                        required: { start: false, progress: false, completion: false },
                        isActive: true,
                      } as any,
                    ])
                    toast({ title: '추가됨', description: label })
                    ;(document.getElementById('new_label') as HTMLInputElement).value = ''
                  } catch {
                    toast({
                      title: '추가 실패',
                      description: '테이블 미프로비저닝 또는 서버 오류',
                      variant: 'destructive',
                    })
                  }
                }}
              >
                문서유형 추가
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <DocumentVersionsDialog
        open={vOpen}
        onOpenChange={setVOpen}
        siteId={vSiteId}
        docType={vDocType}
        siteName={vSiteName}
      />
    </div>
  )
}
