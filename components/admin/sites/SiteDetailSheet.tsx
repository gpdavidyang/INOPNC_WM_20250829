'use client'

import { memo } from 'react'
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
                  <div className="font-medium text-foreground">{site.manager_name || site.construction_manager_name || '미지정'}</div>
                  {(site.construction_manager_phone || site.accommodation_phone) && (
                    <div className="text-muted-foreground">
                      {site.construction_manager_phone || site.accommodation_phone}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">안전 담당</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="font-medium text-foreground">{site.safety_manager_name || '미지정'}</div>
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
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="font-medium text-foreground">{assignment.user_name}</div>
                          <div className="text-xs text-muted-foreground">{assignment.user_email || '이메일 없음'}</div>
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
