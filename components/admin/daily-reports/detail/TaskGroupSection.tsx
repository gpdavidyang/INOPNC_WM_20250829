'use client'

import type { UnifiedDailyReport } from '@/types/daily-reports'

interface TaskGroupSectionProps {
  report: UnifiedDailyReport
  renderArray: (values?: string[]) => string
}

export function TaskGroupSection({ report, renderArray }: TaskGroupSectionProps) {
  const hasDbData = Boolean(
    report?.meta?.componentName ||
      report?.meta?.workProcess ||
      report?.meta?.workSection ||
      report?.memberTypes?.length ||
      report?.workProcesses?.length
  )

  if (report?.taskGroups && report.taskGroups.length > 0) {
    return (
      <div className="space-y-4">
        {report.taskGroups.map((group, index) => (
          <div key={index} className="rounded border p-3 text-sm bg-muted/20">
            <div className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
                작업 {index + 1}
              </span>
            </div>
            <div className="grid gap-2 text-muted-foreground">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">부재명</span>
                <div className="text-foreground">{renderArray(group.memberTypes)}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">작업공정</span>
                <div className="text-foreground">{renderArray(group.workProcesses)}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">작업유형</span>
                <div className="text-foreground">{renderArray(group.workTypes)}</div>
              </div>
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <span className="text-xs font-medium self-center">작업위치</span>
                <div className="text-foreground">
                  {[
                    group.location?.block ? `${group.location.block}블록` : '',
                    group.location?.dong ? `${group.location.dong}동` : '',
                    group.location?.unit ? `${group.location.unit}층` : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || '-'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (hasDbData) {
    return (
      <div className="space-y-2">
        <div className="rounded border p-3 text-sm">
          <div className="grid gap-2 text-muted-foreground">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-xs font-medium self-center">부재명</span>
              <div className="text-foreground">
                {report?.meta?.componentName || (report?.memberTypes || []).join(', ') || '-'}
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-xs font-medium self-center">작업공정</span>
              <div className="text-foreground">
                {report?.meta?.workProcess || (report?.workProcesses || []).join(', ') || '-'}
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <span className="text-xs font-medium self-center">작업유형</span>
              <div className="text-foreground">
                {report?.meta?.workSection || (report?.workTypes || []).join(', ') || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <div className="text-sm text-muted-foreground">등록된 작업 내역이 없습니다.</div>
}
