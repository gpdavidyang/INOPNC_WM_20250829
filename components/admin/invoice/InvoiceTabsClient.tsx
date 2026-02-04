'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import CustomSelect, {
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { fetchSignedUrlForRecord, openFileRecordInNewTab } from '@/lib/files/preview'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  BarChart3,
  Building2,
  Eye,
  FileCheck,
  LayoutGrid,
  List,
  MapPin,
  Search,
  Settings,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import DocumentVersionsDialog from './DocumentVersionsDialog'
import { InvoiceProgressSummary } from './parts/InvoiceProgressSummary'

type DocType = {
  code: string
  label: string
  required: { start: boolean; progress: boolean; completion: boolean }
  isActive?: boolean
  sortOrder?: number
}

const toCanonicalDocType = (value: string | null | undefined): string => {
  if (!value) return ''
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const normalizeSummaryDocs = (docs: Record<string, any> | undefined | null) => {
  const result: Record<string, any> = {}
  if (!docs) return result
  for (const [key, value] of Object.entries(docs)) {
    if (key) result[key] = value
    const canonical = toCanonicalDocType(key)
    if (canonical && canonical !== key) result[canonical] = value
  }
  return result
}

const getSummaryDocEntry = (docs: Record<string, any>, code: string) => {
  if (!code) return undefined
  const canonical = toCanonicalDocType(code)
  if (canonical && docs[canonical]) return docs[canonical]
  if (docs[code]) return docs[code]
  if (!canonical) return undefined
  for (const [key, value] of Object.entries(docs)) {
    if (toCanonicalDocType(key) === canonical) return value
  }
  return undefined
}

const generateUniqueLabel = (label: string, existingLabels: string[]): string => {
  if (!existingLabels.includes(label)) return label
  let candidate = label
  let suffix = 1
  while (existingLabels.includes(`${label} (${suffix})`)) {
    suffix += 1
  }
  return `${label} (${suffix})`
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
  const [tab, setTab] = useState<'summary' | 'documents' | 'settings'>('summary')
  const [summary, setSummary] = useState<{
    docTypes: DocType[]
    sites: Array<{
      site_id: string
      site_name: string
      site_address?: string | null
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sitesCatalog, setSitesCatalog] = useState<Array<{ id: string; name: string }>>([])
  const [docCache, setDocCache] = useState<
    Record<
      string,
      {
        file_url?: string | null
        file_name?: string | null
        storage_path?: string | null
        storage_bucket?: string | null
        metadata?: Record<string, any> | null
      }
    >
  >({})

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

  const globalProgress = useMemo(() => {
    const p = {
      start: { fulfilled: 0, required: 0 },
      progress: { fulfilled: 0, required: 0 },
      completion: { fulfilled: 0, required: 0 },
      other: { fulfilled: 0, required: 0 },
    }
    const targetSites = summary.sites || []
    const targetTypes = summary.docTypes || []

    targetSites.forEach(site => {
      targetTypes.forEach(t => {
        const has = !!getSummaryDocEntry(site.docs || {}, t.code)?.id
        if (t.required?.start) {
          p.start.required++
          if (has) p.start.fulfilled++
        }
        if (t.required?.progress) {
          p.progress.required++
          if (has) p.progress.fulfilled++
        }
        if (t.required?.completion) {
          p.completion.required++
          if (has) p.completion.fulfilled++
        }
        if (!t.required?.start && !t.required?.progress && !t.required?.completion) {
          p.other.required++
          if (has) p.other.fulfilled++
        }
      })
    })
    return p
  }, [summary.sites, summary.docTypes])

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
        if (sum?.data) {
          const docTypes = Array.isArray(sum.data.docTypes) ? sum.data.docTypes : []
          const sites = Array.isArray(sum.data.sites)
            ? sum.data.sites.map((site: any) => ({
                ...site,
                docs: normalizeSummaryDocs(site?.docs),
              }))
            : []
          setSummary({
            docTypes,
            sites,
            totals: sum.data?.totals ?? { sites: sites.length, documents: 0 },
          })
        }
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

  const [vOpen, setVOpen] = useState(false)
  const [vSiteId, setVSiteId] = useState<string | undefined>(undefined)
  const [vDocType, setVDocType] = useState<string | undefined>(undefined)
  const [vSiteName, setVSiteName] = useState<string | undefined>(undefined)

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

  const fetchDocumentDetail = useCallback(
    async (docId: string) => {
      if (!docId) throw new Error('문서 ID가 없습니다.')
      if (docCache[docId]) return docCache[docId]

      const res = await fetch(`/api/invoice/documents/${encodeURIComponent(docId)}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.error) {
        throw new Error(json?.error || '문서 정보를 불러오지 못했습니다.')
      }
      const data: {
        file_url?: string | null
        file_name?: string | null
        storage_path?: string | null
        storage_bucket?: string | null
        metadata?: Record<string, any> | null
      } = json?.data || {}
      setDocCache(prev => ({ ...prev, [docId]: data }))
      return data
    },
    [docCache]
  )

  const buildFileRecord = useCallback((doc?: Record<string, any>) => {
    if (!doc) return {}
    return {
      file_url: doc.file_url || doc.url,
      storage_bucket:
        doc.storage_bucket ||
        doc.metadata?.storage_bucket ||
        doc.metadata?.storageBucket ||
        doc.bucket ||
        null,
      storage_path:
        doc.storage_path ||
        doc.metadata?.storage_path ||
        doc.metadata?.storagePath ||
        doc.folder_path ||
        doc.metadata?.folder_path ||
        doc.metadata?.folderPath ||
        null,
      folder_path: doc.folder_path || doc.metadata?.folder_path || doc.metadata?.folderPath || null,
      file_name: doc.file_name || doc.metadata?.file_name || doc.metadata?.fileName || null,
      title: doc.title || doc.metadata?.title || doc.file_name || null,
    }
  }, [])

  const handlePreviewDoc = useCallback(
    async (docId: string) => {
      let doc: Awaited<ReturnType<typeof fetchDocumentDetail>> | null = null
      try {
        doc = await fetchDocumentDetail(docId)
        if (!doc?.file_url) {
          throw new Error('파일 URL을 찾을 수 없습니다.')
        }
        await openFileRecordInNewTab(buildFileRecord(doc))
      } catch (error: any) {
        if (doc?.file_url) {
          try {
            window.open(doc.file_url, '_blank', 'noopener,noreferrer')
            return
          } catch {
            /* ignore */
          }
        }
        toast({
          title: '미리보기 실패',
          description: error?.message || '문서를 열 수 없습니다.',
          variant: 'destructive',
        })
      }
    },
    [buildFileRecord, fetchDocumentDetail, toast]
  )

  const handleDownloadDoc = useCallback(
    async (docId: string) => {
      let doc: Awaited<ReturnType<typeof fetchDocumentDetail>> | null = null
      try {
        doc = await fetchDocumentDetail(docId)
        if (!doc?.file_url) {
          throw new Error('파일 URL을 찾을 수 없습니다.')
        }
        const finalUrl = await fetchSignedUrlForRecord(buildFileRecord(doc), {
          downloadName: doc.file_name || doc.metadata?.file_name || doc.metadata?.fileName || null,
        })
        const anchor = document.createElement('a')
        anchor.href = finalUrl
        if (doc.file_name) anchor.download = doc.file_name
        anchor.target = '_blank'
        anchor.rel = 'noopener noreferrer'
        anchor.click()
      } catch (error: any) {
        if (doc?.file_url) {
          const fallbackLink = document.createElement('a')
          fallbackLink.href = doc.file_url
          fallbackLink.target = '_blank'
          fallbackLink.rel = 'noopener noreferrer'
          fallbackLink.click()
        }
        toast({
          title: '다운로드 실패',
          description: error?.message || '파일을 내려받을 수 없습니다.',
          variant: 'destructive',
        })
      }
    },
    [buildFileRecord, fetchDocumentDetail, toast]
  )

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <CardDescription className="text-sm font-bold text-slate-400 mt-1 max-w-lg leading-relaxed">
                협력업체별 기성청구 및 계약 관련 필수 문서의 준비 상태를{' '}
                <span className="text-indigo-600">통합 관리</span>합니다.
              </CardDescription>
            </div>

            <div className="flex items-center gap-4 bg-white/60 px-4 py-2.5 rounded-2xl border border-indigo-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 pr-3 border-r border-indigo-100 shrink-0">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <span className="text-[11px] font-black text-indigo-900 uppercase tracking-tighter whitespace-nowrap">
                    소속사 필터
                  </span>
                </div>
                <CustomSelect
                  value={orgId || 'all'}
                  onValueChange={v => setOrgId(v === 'all' ? '' : v)}
                >
                  <CustomSelectTrigger className="h-9 min-w-[180px] rounded-xl bg-white/50 border-none px-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-bold">
                    <CustomSelectValue placeholder="전체 소속사" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="all" className="font-medium text-slate-400">
                      전체 소속사
                    </CustomSelectItem>
                    {orgs.map(o => (
                      <CustomSelectItem key={o.id} value={o.id} className="font-bold">
                        {o.name}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={v => setTab(v as any)} className="w-full">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-3">
              <TabsList className="grid grid-cols-3 w-full h-auto items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <TabsTrigger
                  value="summary"
                  className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 transition-all hover:text-slate-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 data-[state=active]:after:hidden whitespace-nowrap"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>요약 현황</span>
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 data-[state=active]:after:hidden whitespace-nowrap"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>현장별 현황</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-500 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 data-[state=active]:after:hidden whitespace-nowrap"
                >
                  <Settings className="w-4 h-4" />
                  <span>유형 설정</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="summary" className="mt-0 outline-none">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium text-slate-400">
                      데이터를 불러오는 중입니다...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-slate-100 shadow-sm">
                        <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
                          관리 대상 현장
                        </div>
                        <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">
                          {summary.totals.sites}{' '}
                          <span className="text-sm font-bold not-italic ml-0.5">곳</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 p-5 rounded-2xl flex flex-col gap-1.5 border border-blue-100 shadow-sm">
                        <div className="text-[11px] font-black uppercase tracking-tighter text-blue-700 opacity-30">
                          총 업로드 문서
                        </div>
                        <div className="text-2xl font-black text-blue-700 italic tracking-tight">
                          {summary.totals.documents}{' '}
                          <span className="text-sm font-bold not-italic ml-0.5">건</span>
                        </div>
                      </div>
                    </div>

                    <section className="space-y-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#1A254F] opacity-40" />
                        <h3 className="text-lg font-black text-[#1A254F] uppercase tracking-tight">
                          단계별 문서 준비율 (전체 현장 통합)
                        </h3>
                      </div>
                      <InvoiceProgressSummary progress={globalProgress} />
                    </section>

                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-[#1A254F] tracking-tight flex items-center gap-2">
                          <LayoutGrid className="w-5 h-5 opacity-40" />
                          문서 준비 매트릭스
                        </h3>
                      </div>
                      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-slate-200">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-[#8da0cd] text-white">
                                <th className="px-6 py-4 text-left font-black text-[13px] uppercase tracking-wider">
                                  현장명
                                </th>
                                {summary.docTypes.map(dt => (
                                  <th
                                    key={dt.code}
                                    className="px-4 py-4 text-center font-bold text-[11px] uppercase tracking-tighter border-l border-white/10 whitespace-nowrap"
                                  >
                                    {dt.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {summary.sites.length === 0 ? (
                                <tr>
                                  <td
                                    className="px-6 py-12 text-center text-slate-400 font-medium"
                                    colSpan={summary.docTypes.length + 1}
                                  >
                                    조건에 맞는 현장 정보가 없습니다.
                                  </td>
                                </tr>
                              ) : (
                                summary.sites.map(s => (
                                  <tr
                                    key={s.site_id}
                                    className="hover:bg-slate-50/50 transition-colors"
                                  >
                                    <td className="px-6 py-4 font-bold text-[#1A254F]">
                                      {s.site_name || s.site_id}
                                    </td>
                                    {summary.docTypes.map(dt => {
                                      const docEntry = getSummaryDocEntry(s.docs || {}, dt.code)
                                      const has = !!docEntry?.id
                                      return (
                                        <td
                                          key={dt.code}
                                          className="px-4 py-4 text-center border-l border-slate-50"
                                        >
                                          <button
                                            onClick={() => {
                                              if (!has) return
                                              setVSiteId(s.site_id)
                                              setVDocType(dt.code)
                                              setVSiteName(s.site_name)
                                              setVOpen(true)
                                            }}
                                            className={cn(
                                              'inline-flex h-6 w-6 items-center justify-center rounded-full transition-all',
                                              has
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:scale-110 active:scale-95'
                                                : 'bg-slate-100 text-slate-300 pointer-events-none'
                                            )}
                                          >
                                            {has ? (
                                              <Eye className="w-3 h-3" />
                                            ) : (
                                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                            )}
                                          </button>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-0 outline-none">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex flex-wrap items-end gap-3 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex flex-col gap-1.5 min-w-[280px]">
                      <div className="flex items-center gap-1.5 px-1">
                        <Search className="w-3 h-3 text-[#1A254F] opacity-40" />
                        <span className="text-[11px] font-black text-[#1A254F] uppercase tracking-tighter opacity-40">
                          현장명 검색/선택
                        </span>
                      </div>
                      <CustomSelect
                        value={siteIdFilter || 'all'}
                        onValueChange={v => setSiteIdFilter(v === 'all' ? '' : v)}
                      >
                        <CustomSelectTrigger className="h-10 rounded-xl bg-white border-slate-200 px-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <CustomSelectValue placeholder="전체 현장" />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="all" className="font-medium text-slate-400">
                            전체 현장
                          </CustomSelectItem>
                          {siteOptions.map(opt => (
                            <CustomSelectItem key={opt.id} value={opt.id} className="font-bold">
                              {opt.name}
                            </CustomSelectItem>
                          ))}
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                    {siteIdFilter && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSiteIdFilter('')}
                        className="h-10 px-4 rounded-xl text-slate-400 hover:text-rose-600 font-bold"
                      >
                        필터 초기화
                      </Button>
                    )}

                    <div className="ml-auto flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2 rounded-lg transition-all',
                          viewMode === 'grid'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        )}
                        title="그리드형"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          'p-2 rounded-lg transition-all',
                          viewMode === 'list'
                            ? 'bg-blue-50 text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                        )}
                        title="리스트형"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {summarySitesFiltered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/20">
                        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                          <Search className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">표시할 현장 정보가 없습니다.</p>
                      </div>
                    ) : (
                      summarySitesFiltered.map(siteEntry => {
                        const progress = siteEntry.progress ?? 0
                        return (
                          <div
                            key={siteEntry.site_id}
                            className="rounded-3xl border bg-white p-0 shadow-sm border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50/30 border-b border-slate-100">
                              <div className="space-y-1">
                                <h4 className="text-lg font-black text-[#1A254F] tracking-tight">
                                  {siteEntry.site_name || siteEntry.site_id}
                                </h4>
                                <p className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {siteEntry.site_address || '주소 정보 없음'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end gap-1.5 mr-2">
                                  <div className="text-[10px] font-black text-blue-600 uppercase tracking-tighter opacity-50 text-right">
                                    진행율
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-black text-blue-600 italic leading-none">
                                      {progress}%
                                    </span>
                                  </div>
                                </div>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="secondary"
                                  className="h-9 rounded-xl px-5 font-bold shadow-sm whitespace-nowrap border-slate-200"
                                >
                                  <a
                                    href={`/dashboard/admin/sites/${siteEntry.site_id}?tab=invoices`}
                                  >
                                    관리하기
                                  </a>
                                </Button>
                              </div>
                            </div>

                            <div className="p-6">
                              <div
                                className={cn(
                                  'grid gap-4',
                                  viewMode === 'grid'
                                    ? 'md:grid-cols-2 lg:grid-cols-3'
                                    : 'grid-cols-1'
                                )}
                              >
                                {summaryDocTypes.map(type => {
                                  const docEntry = getSummaryDocEntry(
                                    siteEntry.docs || {},
                                    type.code
                                  )
                                  const docId = docEntry?.id
                                  const hasDoc = Boolean(docId)
                                  const createdAt = docEntry?.createdAt
                                  const displayName =
                                    (docEntry?.label as string | undefined) ||
                                    (docEntry?.title as string | undefined) ||
                                    (docEntry?.fileName as string | undefined) ||
                                    (docEntry?.file_name as string | undefined) ||
                                    null
                                  return (
                                    <div
                                      key={`${siteEntry.site_id}-${type.code}`}
                                      className={cn(
                                        'group flex rounded-2xl border transition-all duration-300',
                                        viewMode === 'grid'
                                          ? 'flex-col gap-3 p-4'
                                          : 'flex-row items-center gap-4 px-6 py-3',
                                        hasDoc
                                          ? 'bg-white border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-blue-50'
                                          : 'bg-slate-50 border-slate-200'
                                      )}
                                    >
                                      <div
                                        className={cn(
                                          'flex-1 min-w-0',
                                          viewMode === 'list' &&
                                            'grid grid-cols-12 items-center gap-4'
                                        )}
                                      >
                                        <div
                                          className={cn(
                                            viewMode === 'grid' ? 'mb-1' : 'col-span-3'
                                          )}
                                        >
                                          <div
                                            className={cn(
                                              'text-[10px] font-black text-[#1A254F] uppercase tracking-tighter transition-all mb-0.5',
                                              hasDoc
                                                ? 'opacity-40 group-hover:opacity-100 group-hover:text-blue-600'
                                                : 'opacity-60'
                                            )}
                                          >
                                            {type.label}
                                          </div>
                                          <Badge
                                            variant={hasDoc ? 'default' : 'secondary'}
                                            className={cn(
                                              'font-black text-[10px] rounded-lg px-2 h-5 border-none',
                                              hasDoc
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                            )}
                                          >
                                            {hasDoc ? '등록됨' : '미등록'}
                                          </Badge>
                                        </div>

                                        <div
                                          className={cn(
                                            'min-h-[20px]',
                                            viewMode === 'grid' ? 'flex-1' : 'col-span-5'
                                          )}
                                        >
                                          <div
                                            className={cn(
                                              'text-sm font-bold truncate',
                                              hasDoc
                                                ? 'text-slate-900'
                                                : 'text-slate-500 font-medium'
                                            )}
                                          >
                                            {hasDoc
                                              ? displayName || '파일명 미상'
                                              : '업로드된 파일 없음'}
                                          </div>
                                          {hasDoc && createdAt && viewMode === 'grid' && (
                                            <div className="text-[10px] text-slate-400 mt-1 font-medium italic">
                                              {new Date(createdAt).toLocaleString('ko-KR')}
                                            </div>
                                          )}
                                        </div>

                                        {viewMode === 'list' && (
                                          <div className="col-span-2 text-[10px] text-slate-400 font-medium italic">
                                            {hasDoc && createdAt
                                              ? new Date(createdAt).toLocaleDateString('ko-KR')
                                              : ''}
                                          </div>
                                        )}

                                        <div
                                          className={cn(
                                            'flex items-center gap-2',
                                            viewMode === 'grid'
                                              ? 'pt-2 border-t border-slate-50 mt-1'
                                              : 'col-span-2 justify-end'
                                          )}
                                        >
                                          {hasDoc && docId ? (
                                            <>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="xs"
                                                className="h-8 rounded-lg border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-bold transition-all text-[11px] px-4"
                                                onClick={() => void handlePreviewDoc(docId)}
                                              >
                                                <span>미리보기</span>
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="xs"
                                                className="h-8 rounded-lg border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 font-bold transition-all text-[11px] px-4"
                                                onClick={() => void handleDownloadDoc(docId)}
                                              >
                                                <span>다운로드</span>
                                              </Button>
                                            </>
                                          ) : (
                                            <div className="text-[10px] text-slate-300 font-bold italic w-full text-center py-1">
                                              {viewMode === 'grid' ? '준비 전' : '-'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0 outline-none">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-amber-900 leading-none">
                        문서 유형 관리 유의사항
                      </p>
                      <p className="text-xs text-amber-700/80 leading-relaxed">
                        문서 유형의 라벨을 수정하거나 활성화 상태를 변경할 수 있습니다. 만약 기존
                        유형과 이름이 중복될 경우, 시스템에서 자동으로 순번(예: (1), (2))을 부여하여
                        구분 관리합니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden border-slate-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-[#8da0cd] text-white">
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter w-16">
                              순서
                            </th>
                            <th className="px-6 py-4 text-left font-black text-[11px] uppercase tracking-tighter">
                              문서유형 라벨
                            </th>
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              착수
                            </th>
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              진행
                            </th>
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              완료
                            </th>
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              기타
                            </th>
                            <th className="px-4 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              활성화 상태
                            </th>
                            <th className="px-6 py-4 text-center font-black text-[11px] uppercase tracking-tighter">
                              액션
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold">
                          {types.map((t, idx) => {
                            const isActive = t.isActive !== false
                            return (
                              <tr
                                key={t.code}
                                className={cn(
                                  'hover:bg-slate-50/50 transition-colors',
                                  !isActive && 'opacity-50'
                                )}
                              >
                                <td className="px-4 py-3 text-center text-slate-400 font-black italic">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-3">
                                  <Input
                                    defaultValue={t.label}
                                    className="h-9 rounded-xl border-slate-200 bg-slate-50/50 font-bold focus:bg-white transition-all max-w-[240px]"
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
                                        toast({
                                          title: '저장됨',
                                          description: `${t.code} 라벨 업데이트`,
                                        })
                                      } catch {
                                        toast({
                                          title: '저장 실패',
                                          description: '서버 오류가 발생했습니다.',
                                          variant: 'destructive',
                                        })
                                        e.target.value = t.label
                                      }
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                      checked={t.required.start}
                                      onChange={async e => {
                                        const nextRequired = {
                                          ...t.required,
                                          start: e.target.checked,
                                        }
                                        try {
                                          const res = await fetch(`/api/invoice/types/${t.code}`, {
                                            method: 'PATCH',
                                            headers: { 'content-type': 'application/json' },
                                            body: JSON.stringify({ stageRequired: nextRequired }),
                                          })
                                          if (!res.ok) throw new Error('fail')
                                          setTypes(prev =>
                                            prev.map(x =>
                                              x.code === t.code
                                                ? { ...x, required: nextRequired }
                                                : x
                                            )
                                          )
                                          toast({ title: '저장됨' })
                                        } catch {
                                          toast({ title: '저장 실패', variant: 'destructive' })
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                      checked={t.required.progress}
                                      onChange={async e => {
                                        const nextRequired = {
                                          ...t.required,
                                          progress: e.target.checked,
                                        }
                                        try {
                                          const res = await fetch(`/api/invoice/types/${t.code}`, {
                                            method: 'PATCH',
                                            headers: { 'content-type': 'application/json' },
                                            body: JSON.stringify({ stageRequired: nextRequired }),
                                          })
                                          if (!res.ok) throw new Error('fail')
                                          setTypes(prev =>
                                            prev.map(x =>
                                              x.code === t.code
                                                ? { ...x, required: nextRequired }
                                                : x
                                            )
                                          )
                                          toast({ title: '저장됨' })
                                        } catch {
                                          toast({ title: '저장 실패', variant: 'destructive' })
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                      checked={t.required.completion}
                                      onChange={async e => {
                                        const nextRequired = {
                                          ...t.required,
                                          completion: e.target.checked,
                                        }
                                        try {
                                          const res = await fetch(`/api/invoice/types/${t.code}`, {
                                            method: 'PATCH',
                                            headers: { 'content-type': 'application/json' },
                                            body: JSON.stringify({ stageRequired: nextRequired }),
                                          })
                                          if (!res.ok) throw new Error('fail')
                                          setTypes(prev =>
                                            prev.map(x =>
                                              x.code === t.code
                                                ? { ...x, required: nextRequired }
                                                : x
                                            )
                                          )
                                          toast({ title: '저장됨' })
                                        } catch {
                                          toast({ title: '저장 실패', variant: 'destructive' })
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="checkbox"
                                      className="w-4 h-4 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                      checked={
                                        !t.required.start &&
                                        !t.required.progress &&
                                        !t.required.completion
                                      }
                                      onChange={async e => {
                                        if (!e.target.checked) {
                                          // Cannot uncheck 'Other' without checking something else
                                          toast({
                                            title: '안내',
                                            description:
                                              '착수/진행/완료 중 최소 하나를 선택하면 관리 품목으로 전환됩니다.',
                                          })
                                          // Revert visual state by not updating the underlying data
                                          return
                                        }
                                        const nextRequired = {
                                          start: false,
                                          progress: false,
                                          completion: false,
                                        }
                                        try {
                                          const res = await fetch(`/api/invoice/types/${t.code}`, {
                                            method: 'PATCH',
                                            headers: { 'content-type': 'application/json' },
                                            body: JSON.stringify({ stageRequired: nextRequired }),
                                          })
                                          if (!res.ok) throw new Error('fail')
                                          setTypes(prev =>
                                            prev.map(x =>
                                              x.code === t.code
                                                ? { ...x, required: nextRequired }
                                                : x
                                            )
                                          )
                                          toast({
                                            title: '저장됨',
                                            description: '기타 보조 내역으로 변경되었습니다.',
                                          })
                                        } catch {
                                          toast({ title: '저장 실패', variant: 'destructive' })
                                        }
                                      }}
                                    />
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex justify-center">
                                    <Badge
                                      variant={isActive ? 'default' : 'outline'}
                                      className={cn(
                                        'h-6 rounded-lg text-[10px] font-black border-none',
                                        isActive
                                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                          : 'bg-slate-100 text-slate-400 border-slate-200'
                                      )}
                                    >
                                      {isActive ? '활성' : '비활성'}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      className={cn(
                                        'h-8 rounded-lg font-bold border-slate-200 whitespace-nowrap min-w-[70px]',
                                        isActive
                                          ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                                          : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                      )}
                                      onClick={() => handleToggleActive(t)}
                                    >
                                      {isActive ? '비활성화' : '활성화'}
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      className="h-8 rounded-lg font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 border border-rose-100 shadow-sm"
                                      onClick={() => handleDelete(t)}
                                    >
                                      삭제
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-[300px]">
                        <Input
                          id="new_label"
                          placeholder="새로운 문서 유형 라벨 입력"
                          className="h-10 rounded-xl border-slate-200 bg-white font-bold"
                        />
                        <Button
                          variant="default"
                          className="h-10 rounded-xl px-6 bg-[#1A254F] hover:bg-[#111836] font-bold whitespace-nowrap gap-2 text-white"
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
                            const existingLabels = types.map(t => t.label)
                            const uniqueLabel = generateUniqueLabel(label, existingLabels)
                            const code = generateTypeCode(uniqueLabel, existingCodes)
                            try {
                              const res = await fetch('/api/invoice/types', {
                                method: 'POST',
                                headers: { 'content-type': 'application/json' },
                                body: JSON.stringify({ code, label: uniqueLabel }),
                              })
                              if (!res.ok) throw new Error('fail')
                              setTypes(prev => [
                                ...prev,
                                {
                                  code,
                                  label: uniqueLabel,
                                  required: { start: false, progress: false, completion: false },
                                  isActive: true,
                                } as any,
                              ])
                              toast({ title: '추가됨', description: uniqueLabel })
                              ;(document.getElementById('new_label') as HTMLInputElement).value = ''
                            } catch {
                              toast({
                                title: '추가 실패',
                                description: '서버 오류가 발생했습니다.',
                                variant: 'destructive',
                              })
                            }
                          }}
                        >
                          + 문서유형 추가
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

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
