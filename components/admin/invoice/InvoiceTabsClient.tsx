'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

type DocType = {
  code: string
  label: string
  required: { start: boolean; progress: boolean; completion: boolean }
}

export default function InvoiceTabsClient() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'summary' | 'by-site' | 'list' | 'settings'>('summary')
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
  const [upDocType, setUpDocType] = useState<string>('')
  const [upStage, setUpStage] = useState<'start' | 'progress' | 'completion'>('start')
  const [upSiteId, setUpSiteId] = useState<string>('')
  const [siteIdFilter, setSiteIdFilter] = useState('')
  const [sitesCatalog, setSitesCatalog] = useState<Array<{ id: string; name: string }>>([])
  const siteOptions = useMemo(() => {
    const a = (summary.sites || []).map(s => ({ id: s.site_id, name: s.site_name || s.site_id }))
    const map = new Map<string, { id: string; name: string }>()
    for (const it of a) map.set(it.id, it)
    for (const it of sitesCatalog) if (!map.has(it.id)) map.set(it.id, it)
    return Array.from(map.values())
  }, [summary.sites, sitesCatalog])

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
        if (ty?.data) setTypes(ty.data)
        if (Array.isArray(og?.data)) setOrgs(og.data)
        if (Array.isArray(sc?.sites)) setSitesCatalog(sc.sites)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  // Initialize upload doc type when types loaded
  useEffect(() => {
    if (types.length > 0 && !upDocType) setUpDocType(types[0].code)
  }, [types, upDocType])

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
          <TabsTrigger fill value="by-site">
            현장별
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
                <div className="rounded-lg border p-4 bg-white">
                  <div className="text-xs text-gray-500">현장</div>
                  <div className="text-2xl font-semibold">{summary.totals.sites}</div>
                </div>
                <div className="rounded-lg border p-4 bg-white">
                  <div className="text-xs text-gray-500">업로드</div>
                  <div className="text-2xl font-semibold">{summary.totals.documents}</div>
                </div>
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

        <TabsContent value="by-site">
          {/* 업로드 폼 */}
          <div className="rounded-md border bg-white p-3 mb-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">현장</label>
                <div className="min-w-[240px]">
                  <CustomSelect value={upSiteId} onValueChange={setUpSiteId}>
                    <CustomSelectTrigger>
                      <CustomSelectValue placeholder="현장 선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {siteOptions.map(opt => (
                        <CustomSelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">문서유형</label>
                <div>
                  <CustomSelect
                    value={upDocType || types[0]?.code || 'all'}
                    onValueChange={v => setUpDocType(v)}
                  >
                    <CustomSelectTrigger>
                      <CustomSelectValue placeholder="선택" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      {types.map(t => (
                        <CustomSelectItem key={t.code} value={t.code}>
                          {t.label}
                        </CustomSelectItem>
                      ))}
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">단계</label>
                <div>
                  <CustomSelect value={upStage} onValueChange={v => setUpStage(v as any)}>
                    <CustomSelectTrigger>
                      <CustomSelectValue />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="start">착수</CustomSelectItem>
                      <CustomSelectItem value="progress">진행</CustomSelectItem>
                      <CustomSelectItem value="completion">완료</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
              </div>
              <div>
                <input id="inv_file" type="file" className="text-sm" />
              </div>
              <div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    const siteId = upSiteId?.trim()
                    const docType = upDocType
                    const stage = upStage
                    const file = (document.getElementById('inv_file') as HTMLInputElement)
                      ?.files?.[0]
                    if (!siteId || !docType || !file) {
                      toast({
                        title: '입력 필요',
                        description: '현장/문서유형/파일을 확인하세요.',
                        variant: 'warning' as any,
                      })
                      return
                    }
                    const fd = new FormData()
                    fd.append('site_id', siteId)
                    fd.append('doc_type', docType)
                    fd.append('stage', stage)
                    fd.append('file', file)
                    try {
                      const res = await fetch('/api/invoice/upload', { method: 'POST', body: fd })
                      const j = await res.json()
                      if (!res.ok || j?.error) throw new Error(j?.error || '업로드 실패')
                      toast({ title: '업로드 완료' })
                      // refresh summary/list
                      const sres = await fetch('/api/invoice/summary')
                      const sj = await sres.json()
                      setSummary(
                        sj?.data || { docTypes: [], sites: [], totals: { sites: 0, documents: 0 } }
                      )
                      setTab('summary')
                    } catch (e: any) {
                      toast({
                        title: '업로드 실패',
                        description: e?.message || '오류',
                        variant: 'destructive',
                      })
                    }
                  }}
                >
                  업로드
                </Button>
              </div>
            </div>
          </div>
          {/* 현장 선택 (CustomSelect) */}
          <div className="rounded-md border bg-white p-3 mb-3 flex items-center gap-3">
            <label className="text-xs text-gray-600">현장</label>
            <div className="min-w-[240px]">
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
          </div>
          {/* 간단 뷰: summary 재사용 */}
          <div className="space-y-2">
            {summary.sites
              .filter(s => (siteIdFilter ? s.site_id === siteIdFilter : true))
              .map(s => (
                <div key={s.site_id} className="rounded-md border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.site_name || s.site_id}</div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">진행률 {s.progress ?? 0}%</div>
                      <Button variant="outline" size="sm" onClick={() => exportSite(s.site_id)}>
                        내보내기
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {summary.docTypes.map(dt => {
                      const has = !!s.docs?.[dt.code]
                      return (
                        <span
                          key={dt.code}
                          className={`px-2 py-1 text-xs rounded border ${
                            has
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          {dt.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            {summary.sites.filter(s => (siteIdFilter ? s.site_id === siteIdFilter : true))
              .length === 0 && (
              <div className="text-sm text-muted-foreground">표시할 현장이 없습니다.</div>
            )}
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
              문서유형 목록(코드는 고정, 라벨/정렬/필수단계 편집 가능 — 테이블 미프로비저닝 시
              저장은 제한됩니다)
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2">정렬</th>
                    <th className="px-3 py-2">코드</th>
                    <th className="px-3 py-2">라벨</th>
                    <th className="px-3 py-2">필수(착수)</th>
                    <th className="px-3 py-2">필수(진행)</th>
                    <th className="px-3 py-2">필수(완료)</th>
                    <th className="px-3 py-2">활성</th>
                    <th className="px-3 py-2">동작</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t, idx) => (
                    <tr key={t.code} className="border-t">
                      <td className="px-3 py-2">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{t.code}</td>
                      <td className="px-3 py-2">
                        <Input
                          defaultValue={t.label}
                          onBlur={async e => {
                            const label = e.target.value
                            if (label === t.label) return
                            try {
                              const res = await fetch(`/api/invoice/types/${t.code}`, {
                                method: 'PATCH',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({ label }),
                              })
                              if (!res.ok) throw new Error('fail')
                              toast({ title: '저장됨', description: `${t.code} 라벨 업데이트` })
                            } catch {
                              toast({
                                title: '저장 실패',
                                description: '테이블 미프로비저닝 또는 서버 오류',
                                variant: 'destructive',
                              })
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          defaultChecked={t.required.start}
                          onChange={async e => {
                            try {
                              const res = await fetch(`/api/invoice/types/${t.code}`, {
                                method: 'PATCH',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                  stageRequired: { ...t.required, start: e.target.checked },
                                }),
                              })
                              if (!res.ok) throw new Error('fail')
                              toast({ title: '저장됨', description: '필수(착수) 업데이트' })
                            } catch {
                              toast({ title: '저장 실패', variant: 'destructive' })
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          defaultChecked={t.required.progress}
                          onChange={async e => {
                            try {
                              const res = await fetch(`/api/invoice/types/${t.code}`, {
                                method: 'PATCH',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                  stageRequired: { ...t.required, progress: e.target.checked },
                                }),
                              })
                              if (!res.ok) throw new Error('fail')
                              toast({ title: '저장됨', description: '필수(진행) 업데이트' })
                            } catch {
                              toast({ title: '저장 실패', variant: 'destructive' })
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          defaultChecked={t.required.completion}
                          onChange={async e => {
                            try {
                              const res = await fetch(`/api/invoice/types/${t.code}`, {
                                method: 'PATCH',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({
                                  stageRequired: { ...t.required, completion: e.target.checked },
                                }),
                              })
                              if (!res.ok) throw new Error('fail')
                              toast({ title: '저장됨', description: '필수(완료) 업데이트' })
                            } catch {
                              toast({ title: '저장 실패', variant: 'destructive' })
                            }
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">●</td>
                      <td className="px-3 py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/invoice/types/${t.code}`, {
                                method: 'DELETE',
                              })
                              if (!res.ok) throw new Error('fail')
                              setTypes(prev => prev.filter(x => x.code !== t.code))
                              toast({ title: '비활성화됨', description: t.label })
                            } catch {
                              toast({
                                title: '실패',
                                description: '비활성화 실패',
                                variant: 'destructive',
                              })
                            }
                          }}
                        >
                          비활성화
                        </Button>
                      </td>
                    </tr>
                  ))}
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
                <label className="block text-xs text-gray-500 mb-1">코드</label>
                <Input id="new_code" placeholder="예: custom_doc" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">라벨</label>
                <Input id="new_label" placeholder="예: 사용자 정의 문서" />
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  const code = (
                    document.getElementById('new_code') as HTMLInputElement
                  )?.value?.trim()
                  const label = (
                    document.getElementById('new_label') as HTMLInputElement
                  )?.value?.trim()
                  if (!code || !label) {
                    toast({
                      title: '입력 필요',
                      description: '코드/라벨을 입력하세요.',
                      variant: 'warning' as any,
                    })
                    return
                  }
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
                      } as any,
                    ])
                    toast({ title: '추가됨', description: label })
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
