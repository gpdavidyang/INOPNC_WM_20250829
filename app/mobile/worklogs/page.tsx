'use client'

import React, { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns'
import {
  FilterBar,
  TaskDiaryList,
  TaskCalendar,
  DiaryDetailViewer,
} from '@/modules/mobile/components/worklogs'
import '@/modules/mobile/styles/worklogs.css'
import {
  WorklogCalendarCell,
  WorklogDetail,
  WorklogSummary,
  WorklogStatus,
  WorklogAttachment,
} from '@/types/worklog'

interface MockDataBundle {
  summaries: WorklogSummary[]
  details: Record<string, WorklogDetail>
}

const periodOptions = [
  { value: 'recent', label: '최근 7일' },
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'all', label: '전체 기간' },
]

const buildMockData = (): MockDataBundle => {
  const today = new Date()
  const day = (offset: number) => format(addDays(today, -offset), 'yyyy-MM-dd')

  const summaries: WorklogSummary[] = [
    {
      id: 'wl-001',
      siteId: 'site-001',
      siteName: '삼성전자 평택캠퍼스 P3',
      workDate: day(0),
      memberTypes: ['슬라브'],
      processes: ['마감'],
      workTypes: ['지상'],
      manpower: 2.5,
      status: 'submitted',
      attachmentCounts: { photos: 6, drawings: 2, completionDocs: 1, others: 0 },
      createdBy: { id: 'user-001', name: '이현수' },
      updatedAt: format(today, `yyyy-MM-dd'T'HH:mm:ss`),
    },
    {
      id: 'wl-002',
      siteId: 'site-002',
      siteName: '현대ENG 수서역 신축',
      workDate: day(3),
      memberTypes: ['거더'],
      processes: ['균열 보수'],
      workTypes: ['지하'],
      manpower: 1.5,
      status: 'draft',
      attachmentCounts: { photos: 3, drawings: 1, completionDocs: 0, others: 0 },
      createdBy: { id: 'user-002', name: '정민우' },
      updatedAt: format(addDays(today, -2), `yyyy-MM-dd'T'HH:mm:ss`),
    },
    {
      id: 'wl-003',
      siteId: 'site-001',
      siteName: '삼성전자 평택캠퍼스 P3',
      workDate: day(9),
      memberTypes: ['기둥'],
      processes: ['보수', '기타'],
      workTypes: ['지상'],
      manpower: 3,
      status: 'approved',
      attachmentCounts: { photos: 8, drawings: 3, completionDocs: 1, others: 2 },
      createdBy: { id: 'user-003', name: '박지윤' },
      updatedAt: format(addDays(today, -8), `yyyy-MM-dd'T'HH:mm:ss`),
    },
    {
      id: 'wl-004',
      siteId: 'site-003',
      siteName: 'GS건설 양산 물류센터',
      workDate: day(15),
      memberTypes: ['발코니'],
      processes: ['기타'],
      workTypes: ['지붕'],
      manpower: 1,
      status: 'rejected',
      attachmentCounts: { photos: 2, drawings: 0, completionDocs: 0, others: 1 },
      createdBy: { id: 'user-004', name: '김가람' },
      updatedAt: format(addDays(today, -14), `yyyy-MM-dd'T'HH:mm:ss`),
    },
  ]

  const buildAttachments = (
    count: number,
    category: WorklogAttachment['category']
  ): WorklogAttachment[] =>
    Array.from({ length: count }).map((_, index) => ({
      id: `att-${category}-${index}`,
      name: `${category.toUpperCase()}-${index + 1}.jpg`,
      type: category === 'markup' || category === 'completion' ? 'document' : 'photo',
      category,
      previewUrl: 'https://via.placeholder.com/280x180?text=Preview',
      fileUrl: 'https://via.placeholder.com/1200x800?text=Document',
    }))

  const toDetail = (summary: WorklogSummary): WorklogDetail => ({
    ...summary,
    location: { block: 'B', dong: '102', unit: '1604' },
    notes: '현장 안전 점검 완료. 특이사항 없음.',
    safetyNotes: '안전고리, 추락방지망 정상',
    additionalManpower: [
      { id: 'mp-1', name: '조두현', manpower: 0.5 },
      { id: 'mp-2', name: '유민재', manpower: 1 },
    ],
    attachments: {
      photos: buildAttachments(summary.attachmentCounts.photos, 'before'),
      drawings: buildAttachments(summary.attachmentCounts.drawings, 'markup'),
      completionDocs: buildAttachments(summary.attachmentCounts.completionDocs, 'completion'),
      others: buildAttachments(summary.attachmentCounts.others, 'other'),
    },
  })

  const detailMap: Record<string, WorklogDetail> = Object.fromEntries(
    summaries.map(summary => [summary.id, toDetail(summary)])
  )

  return { summaries, details: detailMap }
}

const MOCK_DATA = buildMockData()

const buildSiteOptions = (summaries: WorklogSummary[]) => {
  const uniqueSites = Array.from(
    new Map(summaries.map(summary => [summary.siteId, summary.siteName])).entries()
  )

  return [
    { value: 'all', label: '전체 현장' },
    ...uniqueSites.map(([value, label]) => ({ value, label })),
  ]
}

const filterByPeriod = (summary: WorklogSummary, period: string, referenceDate: Date) => {
  if (period === 'all') return true
  const workDate = parseISO(summary.workDate)

  if (period === 'recent') {
    const today = new Date()
    const start = addDays(today, -6)
    return isWithinInterval(workDate, { start, end: today })
  }

  if (period === 'month') {
    const monthStart = startOfMonth(referenceDate)
    const monthEnd = addMonths(monthStart, 1)
    return isWithinInterval(workDate, { start: monthStart, end: monthEnd })
  }

  if (period === 'quarter') {
    const monthStart = startOfMonth(referenceDate)
    const quarterStart = subMonths(monthStart, 2)
    return isWithinInterval(workDate, { start: quarterStart, end: addMonths(monthStart, 1) })
  }

  return true
}

export default function WorklogsPage() {
  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('recent')
  const [query, setQuery] = useState('')
  const [statuses, setStatuses] = useState<WorklogStatus[]>([])
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const siteOptions = useMemo(() => buildSiteOptions(MOCK_DATA.summaries), [])

  const filteredSummaries = useMemo(() => {
    return MOCK_DATA.summaries.filter(summary => {
      if (selectedSite !== 'all' && summary.siteId !== selectedSite) return false
      if (!filterByPeriod(summary, selectedPeriod, month)) return false
      if (statuses.length > 0 && !statuses.includes(summary.status)) return false
      if (query.trim()) {
        const haystack = [
          summary.siteName,
          summary.processes.join(' '),
          summary.workTypes.join(' '),
          summary.createdBy.name,
        ]
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(query.toLowerCase())) return false
      }
      return true
    })
  }, [selectedSite, selectedPeriod, statuses, query, month])

  const calendarData: WorklogCalendarCell[] = useMemo(() => {
    const counts = new Map<string, WorklogCalendarCell>()
    filteredSummaries.forEach(summary => {
      const existing = counts.get(summary.workDate) ?? {
        date: summary.workDate,
        total: 0,
        submitted: 0,
        draft: 0,
      }
      existing.total += 1
      if (summary.status === 'draft') existing.draft += 1
      if (summary.status === 'submitted' || summary.status === 'approved') existing.submitted += 1
      counts.set(summary.workDate, existing)
    })
    return Array.from(counts.values())
  }, [filteredSummaries])

  const handleStatusToggle = (status: WorklogStatus) => {
    setStatuses(prev =>
      prev.includes(status) ? prev.filter(item => item !== status) : [...prev, status]
    )
  }

  const handleClearFilters = () => {
    setSelectedSite('all')
    setSelectedPeriod('recent')
    setQuery('')
    setStatuses([])
  }

  const handleSelectWorklog = (id: string) => {
    setSelectedId(id)
    setIsViewerOpen(true)
  }

  const selectedWorklog = selectedId ? MOCK_DATA.details[selectedId] : null

  return (
    <main className="worklogs-view" style={{ paddingTop: '60px' }}>
      <FilterBar
        sites={siteOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        periodOptions={periodOptions}
        selectedPeriod={selectedPeriod}
        onPeriodChange={value => setSelectedPeriod(value)}
        query={query}
        onQueryChange={setQuery}
        onQuerySubmit={() => void 0}
        activeStatuses={statuses}
        onStatusToggle={handleStatusToggle}
        onClearFilters={handleClearFilters}
      />

      <TaskCalendar
        month={month}
        data={calendarData}
        selectedDate={selectedId ? selectedWorklog?.workDate : undefined}
        onDateChange={iso => {
          setSelectedPeriod('all')
          setMonth(startOfMonth(parseISO(iso)))
          setQuery('')
        }}
        onMonthChange={setMonth}
      />

      <TaskDiaryList
        items={filteredSummaries}
        onSelect={handleSelectWorklog}
        activeId={selectedId}
        emptyMessage="조건에 맞는 작업일지가 없습니다."
      />

      <DiaryDetailViewer
        open={isViewerOpen}
        worklog={selectedWorklog ?? null}
        onClose={() => setIsViewerOpen(false)}
        onDownload={id => console.log('download', id)}
        onOpenDocument={attachment => console.log('open document', attachment)}
      />
    </main>
  )
}
