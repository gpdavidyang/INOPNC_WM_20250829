'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  WorklogDetail,
  WorklogSummary,
  WorklogCalendarCell,
  WorklogStatus,
} from '@/types/worklog'
import {
  fetchWorklogList,
  fetchWorklogCalendar,
  WorklogListParams,
  WorklogListResult,
  WorklogPeriod,
} from '@/modules/mobile/data/worklog-api'

export type { WorklogListParams, WorklogListResult, WorklogPeriod, WorklogStatus }

export const useWorklogList = (filters: WorklogListParams) => {
  const queryKey = useMemo(() => ['worklogs', filters], [filters])

  return useQuery<WorklogListResult>({
    queryKey,
    queryFn: () => fetchWorklogList(filters),
    placeholderData: previous => previous ?? { summaries: [], detailMap: {} },
  })
}

export const useWorklogCalendar = (options: { month: string; siteId?: string }) => {
  return useQuery<WorklogCalendarCell[]>({
    queryKey: ['worklog-calendar', options],
    queryFn: () => fetchWorklogCalendar(options),
    placeholderData: previous => previous ?? [],
  })
}

export const useWorklogDetailFromMap = (
  detailMap: Record<string, WorklogDetail>,
  id: string | null
) => {
  return id ? (detailMap[id] ?? null) : null
}
