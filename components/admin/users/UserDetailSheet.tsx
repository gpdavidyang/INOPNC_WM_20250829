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
import type { UserWithSites } from '@/app/actions/admin/users'
import type { UserRole } from '@/types'

type UserDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserWithSites | null
  loading?: boolean
}

const ROLE_LABELS: Record<UserRole, string> = {
  admin: '관리자',
  system_admin: '시스템 관리자',
  site_manager: '현장 관리자',
  customer_manager: '고객 관리자',
  worker: '작업자',
}

const DOCUMENT_LABELS: Record<string, string> = {
  medical_checkup: '건강검진',
  safety_education: '안전교육 이수증',
  vehicle_insurance: '차량 보험 증권',
  vehicle_registration: '차량 등록증',
  payroll_stub: '급여 명세서',
  id_card: '신분증',
  senior_documents: '고령자 서류',
}

const STATUS_LABELS: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  suspended: '중지',
}

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  try {
    return format(new Date(value), 'yyyy.MM.dd')
  } catch (error) {
    return '-'
  }
}

export const UserDetailSheet = memo(function UserDetailSheet({
  open,
  onOpenChange,
  user,
  loading = false,
}: UserDetailSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">사용자 상세 정보</DialogTitle>
          <DialogDescription>
            사용자 계정 정보와 배정 현황, 필수 서류 상태를 확인할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <LoadingSpinner />
        ) : !user ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            사용자 정보를 불러오지 못했습니다. 다시 시도해 주세요.
          </p>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="font-medium text-lg text-foreground">{user.full_name || user.email}</div>
                  <div className="text-muted-foreground">{user.email}</div>
                  {user.phone && <div className="text-muted-foreground">{user.phone}</div>}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge variant="secondary">{ROLE_LABELS[user.role as UserRole] || user.role}</Badge>
                    {user.status && (
                      <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                        {STATUS_LABELS[user.status] || user.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <h3 className="text-sm font-semibold text-muted-foreground">추가 정보</h3>
                <div className="mt-2 grid gap-1">
                  <div>
                    <span className="text-muted-foreground">소속 조직</span>
                    <div className="font-medium text-foreground">
                      {user.organization?.name || '미지정'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">최근 작업일지</span>
                    <div className="font-medium text-foreground">
                      {formatDate(user.work_log_stats?.last_report_date)}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground">총 일지</span>
                      <div className="font-medium text-foreground">
                        {user.work_log_stats?.total_reports ?? 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">이번 달</span>
                      <div className="font-medium text-foreground">
                        {user.work_log_stats?.this_month ?? 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">배정 현황</h3>
              {user.site_assignments && user.site_assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>현장</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>배정일</TableHead>
                      <TableHead className="text-right">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.site_assignments.map((assignment) => (
                      <TableRow key={`${assignment.site_id}-${assignment.assigned_at}`}>
                        <TableCell>{assignment.site_name || '미지정'}</TableCell>
                        <TableCell>{ROLE_LABELS[assignment.role as UserRole] || assignment.role}</TableCell>
                        <TableCell>{formatDate(assignment.assigned_at)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={assignment.is_active ? 'default' : 'outline'}>
                            {assignment.is_active ? '활성' : '비활성'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">배정된 현장이 없습니다.</p>
              )}
            </section>

            <Separator />

            <section>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">필수 서류 상태</h3>
              {user.required_documents && user.required_documents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>서류</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>제출일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.required_documents.map((doc) => (
                      <TableRow key={doc.document_type}>
                        <TableCell>{DOCUMENT_LABELS[doc.document_type] || doc.document_type}</TableCell>
                        <TableCell>
                          <Badge variant={doc.status === 'submitted' ? 'default' : 'outline'}>
                            {doc.status === 'submitted' ? '제출 완료' : '미제출'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.submitted_at || undefined)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">필수 서류 정보가 없습니다.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
})
