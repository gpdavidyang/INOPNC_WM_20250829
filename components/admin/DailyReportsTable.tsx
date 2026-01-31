'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/components/ui/use-confirm'
import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useTransition } from 'react'

const STATUS_META: Record<
  string,
  {
    label: string
    className: string
  }
> = {
  draft: { label: '임시', className: 'bg-gray-100 text-gray-700' },
  submitted: { label: '제출', className: 'bg-sky-100 text-sky-700' },
  approved: { label: '승인', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '반려', className: 'bg-rose-100 text-rose-700' },
}

const isBlankValue = (value: unknown) => {
  if (value === null || value === undefined) return true
  const str = String(value).trim()
  if (!str) return true
  const lowered = str.toLowerCase()
  return lowered === 'null' || lowered === 'undefined' || str === '-'
}

const formatMemberTypes = (row: any) => {
  if (Array.isArray(row?.member_types)) {
    const filtered = row.member_types
      .map((item: unknown) => (typeof item === 'string' ? item.trim() : String(item ?? '')))
      .filter(item => !isBlankValue(item))
    if (filtered.length > 0) {
      return filtered.join(', ')
    }
  }
  if (!isBlankValue(row?.component_name)) {
    return String(row.component_name).trim()
  }
  return ''
}

const formatProcessName = (row: any) => {
  if (!isBlankValue(row?.work_process)) {
    return String(row.work_process).trim()
  }
  if (!isBlankValue(row?.process_type)) {
    return String(row.process_type).trim()
  }
  return ''
}

const formatSectionName = (row: any) => {
  if (!isBlankValue(row?.work_section)) {
    return String(row.work_section).trim()
  }
  return ''
}

export default function DailyReportsTable({ reports }: { reports: any[] }) {
  const router = useRouter()
  const sp = useSearchParams()
  const { confirm } = useConfirm()
  const sortKey = (sp?.get('sort') || 'work_date') as string
  const sortDir = (sp?.get('dir') || 'desc') as 'asc' | 'desc'

  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [approvalLoadingId, setApprovalLoadingId] = React.useState<string | null>(null)
  const [rejectingId, setRejectingId] = React.useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = React.useState('')

  const selectAllRef = React.useRef<HTMLInputElement>(null)
  const reportIds = React.useMemo(() => reports.map(r => String(r.id)), [reports])
  const zeroManhourIds = React.useMemo(() => {
    // Treat undefined, null, or <= 0 man-hours as zero and eligible for cleanup
    const ids = reports
      .filter(r => {
        const total = Number(
          (r as any)?.total_manhours ?? (r as any)?.totalLaborHours ?? (r as any)?.labor_hours ?? 0
        )
        return !Number.isFinite(total) || total <= 0
      })
      .map(r => String(r.id))
    return Array.from(new Set(ids))
  }, [reports])
  const allSelected = reportIds.length > 0 && selectedIds.length === reportIds.length
  const isIndeterminate = selectedIds.length > 0 && !allSelected
  const selectedCount = selectedIds.length
  const zeroCount = zeroManhourIds.length
  const isBusy = isPending || isDeleting

  React.useEffect(() => {
    setSelectedIds(prev => prev.filter(id => reportIds.includes(id)))
  }, [reportIds])

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate
    }
  }, [isIndeterminate])

  const onSortChange = (key: string, dir: 'asc' | 'desc') => {
    const params = new URLSearchParams(sp?.toString() || '')
    params.set('sort', key)
    params.set('dir', dir)
    params.set('page', '1')
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? [] : [...reportIds])
  }

  const handleStatusChange = async (
    reportId: string,
    action: 'approve' | 'revert' | 'reject',
    reason?: string
  ) => {
    setApprovalLoadingId(reportId)
    try {
      const res = await fetch(`/api/admin/daily-reports/${reportId}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '상태 변경에 실패했습니다.')
      }
      setRejectingId(null)
      setRejectionReason('')
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      alert((error as Error)?.message || '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setApprovalLoadingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return
    const ok = await confirm({
      title: '선택한 작업일지 삭제',
      description: `선택한 ${selectedCount}건의 작업일지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/daily-reports/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: selectedIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '삭제에 실패했습니다.')
      }
      setSelectedIds([])
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteZeroManhours = async () => {
    if (zeroCount === 0) return
    const ok = await confirm({
      title: '총공수 0건 삭제',
      description: `총공수가 0인 ${zeroCount}건의 작업일지를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
    })
    if (!ok) return

    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/daily-reports/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportIds: zeroManhourIds }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || '삭제에 실패했습니다.')
      }
      setSelectedIds(prev => prev.filter(id => !zeroManhourIds.includes(id)))
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {selectedCount > 0
            ? `${selectedCount}건 선택됨`
            : zeroCount > 0
              ? `총공수 0인 작업일지가 ${zeroCount}건 있습니다.`
              : '삭제할 작업일지를 선택해주세요.'}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0 || isDeleting}
            onClick={handleBulkDelete}
            className="flex-1 sm:flex-none"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                삭제 중...
              </>
            ) : (
              '선택 삭제'
            )}
          </Button>
        </div>
      </div>
      <DataTable
        data={reports}
        rowKey="id"
        emptyMessage="표시할 작업일지가 없습니다."
        stickyHeader
        initialSort={{ columnKey: sortKey, direction: sortDir }}
        onSortChange={onSortChange}
        columns={[
          {
            key: 'select',
            header: (
              <input
                ref={selectAllRef}
                type="checkbox"
                aria-label="현재 페이지 전체 선택"
                className="h-4 w-4"
                disabled={reports.length === 0 || isDeleting}
                checked={allSelected}
                onChange={toggleSelectAll}
              />
            ),
            sortable: false,
            align: 'center',
            width: 40,
            headerClassName: 'whitespace-nowrap text-center',
            className: 'text-center',
            render: (r: any) => {
              const id = String(r.id)
              const checked = selectedIds.includes(id)
              return (
                <input
                  type="checkbox"
                  aria-label="작업일지 선택"
                  className="h-4 w-4"
                  disabled={isDeleting}
                  checked={checked}
                  onChange={event => {
                    event.stopPropagation()
                    toggleSelect(id)
                  }}
                />
              )
            },
          },
          {
            key: 'work_date',
            header: '작업일자',
            sortable: true,
            accessor: (r: any) =>
              r?.work_date || r?.report_date ? new Date(r.work_date || r.report_date).getTime() : 0,
            render: (r: any) => (
              <a
                href={`/dashboard/admin/daily-reports/${r.id}`}
                className="underline text-blue-600"
              >
                {r?.work_date || r?.report_date
                  ? new Date(r.work_date || r.report_date).toLocaleDateString('ko-KR')
                  : '-'}
              </a>
            ),
            width: 110,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'site_name',
            header: '현장',
            sortable: true,
            accessor: (r: any) => r?.sites?.name || r?.site?.name || '',
            render: (r: any) => (
              <div className="font-medium text-foreground">
                {r?.site_id ? (
                  <a
                    href={`/dashboard/admin/sites/${r.site_id}`}
                    className="underline-offset-2 hover:underline"
                    title="현장 상세 보기"
                  >
                    {r?.sites?.name || r?.site?.name || '-'}
                  </a>
                ) : (
                  <span>{r?.sites?.name || r?.site?.name || '-'}</span>
                )}
                <div className="text-xs text-muted-foreground">
                  {r?.sites?.address || r?.site?.address || '-'}
                </div>
              </div>
            ),
            width: 220,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'organization',
            header: '소속',
            sortable: true,
            accessor: (r: any) => (r?.organization?.name ? String(r.organization.name) : ''),
            render: (r: any) => r?.organization?.name || '미기입',
            width: 180,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'component_name',
            header: '부재명',
            sortable: true,
            accessor: (r: any) => {
              const component = formatMemberTypes(r)
              return component || '미기입'
            },
            render: (r: any) => {
              const component = formatMemberTypes(r)
              return component || '미기입'
            },
            width: 180,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'work_process',
            header: '작업공정',
            sortable: true,
            accessor: (r: any) => formatProcessName(r) || '미기입',
            render: (r: any) => formatProcessName(r) || '미기입',
            width: 160,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'work_section',
            header: '작업구간',
            sortable: true,
            accessor: (r: any) => formatSectionName(r) || '미기입',
            render: (r: any) => formatSectionName(r) || '미기입',
            width: 160,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'author',
            header: '작성자',
            sortable: false,
            accessor: (r: any) =>
              r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '',
            render: (r: any) =>
              r?.created_by ? (
                <a
                  href={`/dashboard/admin/users/${r.created_by}`}
                  className="underline-offset-2 hover:underline"
                  title="사용자 상세 보기"
                >
                  {r?.profiles?.full_name || r?.submitted_by_profile?.full_name || r.created_by}
                </a>
              ) : (
                <span>{r?.profiles?.full_name || r?.submitted_by_profile?.full_name || '-'}</span>
              ),
            width: 140,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'status',
            header: '상태',
            sortable: true,
            accessor: (r: any) => r?.status || '',
            render: (r: any) => (
              <Badge
                variant="outline"
                className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[r?.status as keyof typeof STATUS_META]?.className || 'bg-gray-100 text-gray-700'}`}
              >
                {STATUS_META[r?.status as keyof typeof STATUS_META]?.label || r?.status || '미정'}
              </Badge>
            ),
            width: 90,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'workers',
            header: '인원',
            sortable: false,
            accessor: (r: any) => r?.worker_details_count ?? r?.total_workers ?? 0,
            render: (r: any) => String(r?.worker_details_count ?? r?.total_workers ?? 0),
            width: 70,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'total_manhours',
            header: '총공수',
            sortable: true,
            accessor: (r: any) => r?.total_manhours ?? 0,
            render: (r: any) => <span>{formatManhours(r?.total_manhours)}</span>,
            width: 90,
            headerClassName: 'whitespace-nowrap',
          },
          {
            key: 'actions',
            header: '작업',
            sortable: false,
            align: 'left',
            width: 250,
            className: 'whitespace-nowrap',
            render: (r: any) => {
              const rid = String(r.id)
              const isRejecting = rejectingId === rid

              return (
                <div className="flex flex-col gap-2 py-1">
                  <div className="flex justify-start gap-1">
                    <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                      <a href={`/dashboard/admin/daily-reports/${r.id}`}>상세</a>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="px-2 py-1 text-xs">
                      <a href={`/dashboard/admin/daily-reports/${r.id}/edit`}>수정</a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 text-xs"
                      disabled={isDeleting}
                      onClick={async () => {
                        const ok = await confirm({
                          title: '작업일지 삭제',
                          description: '이 작업일지를 삭제하시겠습니까? 되돌릴 수 없습니다.',
                          confirmText: '삭제',
                          cancelText: '취소',
                          variant: 'destructive',
                        })
                        if (!ok) return
                        try {
                          const res = await fetch(`/api/admin/daily-reports/${r.id}`, {
                            method: 'DELETE',
                          })
                          if (!res.ok) throw new Error('삭제 실패')
                          setSelectedIds(prev => prev.filter(id => id !== String(r.id)))
                          startTransition(() => {
                            router.refresh()
                          })
                        } catch (e) {
                          alert((e as Error)?.message || '삭제 중 오류가 발생했습니다.')
                        }
                      }}
                    >
                      삭제
                    </Button>
                    {r?.status === 'submitted' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          className="px-2 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                          disabled={approvalLoadingId === rid}
                          onClick={() => handleStatusChange(rid, 'approve')}
                        >
                          {approvalLoadingId === rid ? (
                            <>
                              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
                              승인 중...
                            </>
                          ) : (
                            '승인'
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="px-2 py-1 text-xs"
                          disabled={approvalLoadingId === rid}
                          onClick={() => {
                            if (isRejecting) {
                              setRejectingId(null)
                              setRejectionReason('')
                            } else {
                              setRejectingId(rid)
                              setRejectionReason('')
                            }
                          }}
                        >
                          반려
                        </Button>
                      </>
                    )}
                    {(r?.status === 'approved' || r?.status === 'rejected') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 text-xs"
                        disabled={approvalLoadingId === rid}
                        onClick={() => handleStatusChange(rid, 'revert')}
                      >
                        {approvalLoadingId === rid ? (
                          <>
                            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden />
                            처리 중...
                          </>
                        ) : (
                          '상태 초기화'
                        )}
                      </Button>
                    )}
                  </div>
                  {isRejecting && (
                    <div className="mt-1 flex flex-col gap-1.5 rounded-md border bg-muted/30 p-2 animate-in slide-in-from-top-1 duration-200">
                      <textarea
                        className="w-full rounded border bg-white p-1.5 text-xs focus:ring-1 focus:ring-rose-500"
                        placeholder="반려 사유를 입력하세요 (예: 사진 누락)"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={2}
                      />
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px]"
                          onClick={() => {
                            setRejectingId(null)
                            setRejectionReason('')
                          }}
                        >
                          취소
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 px-2 text-[10px] bg-rose-600 hover:bg-rose-700"
                          disabled={!rejectionReason.trim() || approvalLoadingId === rid}
                          onClick={() => handleStatusChange(rid, 'reject', rejectionReason)}
                        >
                          반려 확정
                        </Button>
                      </div>
                    </div>
                  )}
                  {r?.status === 'rejected' && r?.rejection_reason && !isRejecting && (
                    <div className="text-[10px] text-rose-600 font-medium">
                      사유: {r.rejection_reason}
                    </div>
                  )}
                </div>
              )
            },
          },
        ]}
      />
      {isBusy && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] pointer-events-none">
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function formatManhours(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '0.0'
  const floored = Math.floor(n * 10) / 10
  return floored.toFixed(1)
}
