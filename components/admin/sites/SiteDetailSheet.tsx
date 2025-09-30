'use client'

import { memo, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import type { Site, SiteStatus } from '@/types'

export interface SiteAssignmentSummary {
  id: string
  user_id: string
  user_name: string
  user_role: string
  user_email?: string | null
  user_phone?: string | null
  assigned_at?: string | null
  is_active?: boolean
}

type SiteDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: Site | null
  assignments?: SiteAssignmentSummary[]
  loading?: boolean
}

const STATUS_LABELS: Record<SiteStatus, string> = {
  active: '진행 중',
  inactive: '중단',
  completed: '완료',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  try {
    return format(new Date(value), 'yyyy.MM.dd')
  } catch (error) {
    return '-'
  }
}

export const SiteDetailSheet = memo(function SiteDetailSheet({
  open,
  onOpenChange,
  site,
  assignments = [],
  loading = false,
}: SiteDetailSheetProps) {
  const [blueprints, setBlueprints] = useState<
    Array<{ id: string; title: string; uploadDate: string; isPrimary: boolean }>
  >([])
  const [bpLoading, setBpLoading] = useState(false)
  const [bpError, setBpError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBlueprints = async () => {
      if (!open || !site?.id) return
      setBpLoading(true)
      setBpError(null)
      try {
        const res = await fetch(`/api/partner/sites/${site.id}/documents?type=drawing`, {
          cache: 'no-store',
        })
        const json = await res.json()
        const arr = json?.data?.documents || []
        const mapped = arr
          .filter(
            (d: any) =>
              d.categoryType === 'drawing' &&
              (d.subType === 'blueprint' || d.document_type === 'blueprint')
          )
          .map((d: any) => ({
            id: d.id,
            title: d.title || d.name || '공도면',
            uploadDate: d.uploadDate,
            isPrimary: !!d.is_primary_blueprint,
          }))
        setBlueprints(mapped)
      } catch (e) {
        setBpError('공도면 목록을 불러오지 못했습니다.')
      } finally {
        setBpLoading(false)
      }
    }
    fetchBlueprints()
  }, [open, site?.id])

  const setPrimary = async (docId: string) => {
    try {
      const res = await fetch(`/api/admin/site-documents/${docId}/primary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary_blueprint: true }),
      })
      const json = await res.json()
      if (!res.ok || json?.error) throw new Error(json?.error || '대표 도면 설정 실패')
      // Update state: only this doc is primary
      setBlueprints(prev => prev.map(b => ({ ...b, isPrimary: b.id === docId })))
    } catch (e) {
      setBpError(e instanceof Error ? e.message : '대표 도면 설정 실패')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">현장 상세 정보</DialogTitle>
          <DialogDescription>
            현장의 개요와 담당자 배정 현황을 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : !site ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            현장 정보를 불러오지 못했습니다. 다시 시도해 주세요.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="text-lg font-semibold text-foreground">{site.name}</div>
                  <div className="text-muted-foreground">{site.address}</div>
                  <div className="flex items-center gap-2 pt-2">
                    {site.status ? (
                      <Badge variant={site.status === 'active' ? 'default' : 'outline'}>
                        {STATUS_LABELS[site.status as SiteStatus] || site.status}
                      </Badge>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      생성일 {formatDate(site.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <h3 className="text-sm font-semibold text-muted-foreground">일정</h3>
                <div className="mt-2 grid gap-2">
                  <div>
                    <span className="text-muted-foreground">시작일</span>
                    <div className="font-medium text-foreground">{formatDate(site.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">종료 예정</span>
                    <div className="font-medium text-foreground">{formatDate(site.end_date)}</div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">현장 관리자</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="font-medium text-foreground">{site.manager_name || '미지정'}</div>
                  {((site as any).manager_phone ||
                    (site as any).construction_manager_phone ||
                    site.accommodation_phone) && (
                    <div className="text-muted-foreground">
                      {(site as any).manager_phone ||
                        (site as any).construction_manager_phone ||
                        site.accommodation_phone}
                    </div>
                  )}
                  {(site as any).manager_email && (
                    <div className="text-muted-foreground">{(site as any).manager_email}</div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">안전 담당</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="font-medium text-foreground">
                    {site.safety_manager_name || '미지정'}
                  </div>
                  {site.safety_manager_phone && (
                    <div className="text-muted-foreground">{site.safety_manager_phone}</div>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">배정 현황</h3>
              {assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead>배정일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(assignment => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{assignment.user_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {assignment.user_email || '이메일 없음'}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.user_role}</TableCell>
                        <TableCell>{assignment.user_phone || '연락처 없음'}</TableCell>
                        <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">배정된 사용자가 없습니다.</p>
              )}
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">공도면 관리</h3>
              {bpLoading ? (
                <LoadingSpinner />
              ) : bpError ? (
                <p className="text-sm text-destructive">{bpError}</p>
              ) : blueprints.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  공도면이 없습니다. 업로드 후 대표 도면을 지정하세요.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>파일명</TableHead>
                      <TableHead>업로드일</TableHead>
                      <TableHead>대표</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blueprints.map(bp => (
                      <TableRow key={bp.id}>
                        <TableCell>{bp.title}</TableCell>
                        <TableCell>{bp.uploadDate || '-'}</TableCell>
                        <TableCell>
                          {bp.isPrimary ? (
                            <Badge variant="default">대표</Badge>
                          ) : (
                            <Badge variant="outline">일반</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={bp.isPrimary ? 'secondary' : 'default'}
                            disabled={bp.isPrimary}
                            onClick={() => setPrimary(bp.id)}
                          >
                            대표로 설정
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
