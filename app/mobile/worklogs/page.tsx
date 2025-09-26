'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO, startOfMonth } from 'date-fns'
import {
  FilterBar,
  TaskDiaryList,
  TaskCalendar,
  DiaryDetailViewer,
} from '@/modules/mobile/components/worklogs'
import {
  useWorklogList,
  useWorklogCalendar,
  WorklogStatus,
  WorklogPeriod,
  useWorklogDetailFromMap,
} from '@/modules/mobile/hooks/use-worklogs'
import '@/modules/mobile/styles/worklogs.css'

const periodOptions = [
  { value: 'recent', label: '최근 7일' },
  { value: 'month', label: '이번 달' },
  { value: 'quarter', label: '최근 3개월' },
  { value: 'all', label: '전체 기간' },
] as const

export default function WorklogsPage() {
  const router = useRouter()
  const [selectedSite, setSelectedSite] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState<WorklogPeriod>('recent')
  const [query, setQuery] = useState('')
  const [statuses, setStatuses] = useState<WorklogStatus[]>([])
  const [month, setMonth] = useState(startOfMonth(new Date()))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [siteOptions, setSiteOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'all', label: '전체 현장' },
  ])

  const listFilters = useMemo(
    () => ({
      siteId: selectedSite,
      period: selectedPeriod,
      statuses,
      query,
      referenceDate: format(month, 'yyyy-MM-dd'),
    }),
    [selectedSite, selectedPeriod, statuses, query, month]
  )

  const { data: listResult, isLoading } = useWorklogList(listFilters)
  const { data: calendarCells = [] } = useWorklogCalendar({
    month: format(month, 'yyyy-MM-01'),
    siteId: selectedSite,
  })

  const worklogs = listResult?.summaries ?? []
  const detailMap = listResult?.detailMap ?? {}

  useEffect(() => {
    const nextOptions = new Map<string, string>([['all', '전체 현장']])
    worklogs.forEach(item => {
      if (item.siteId) {
        nextOptions.set(item.siteId, item.siteName)
      }
    })

    const nextArray = Array.from(nextOptions.entries()).map(([value, label]) => ({ value, label }))

    setSiteOptions(prev => {
      if (
        prev.length === nextArray.length &&
        prev.every(
          (option, index) =>
            option.value === nextArray[index].value && option.label === nextArray[index].label
        )
      ) {
        return prev
      }
      return nextArray
    })
  }, [worklogs])

  const selectedWorklog = useWorklogDetailFromMap(detailMap, selectedId)

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

  return (
    <main className="worklogs-view" style={{ paddingTop: '60px' }}>
      <FilterBar
        sites={siteOptions}
        selectedSite={selectedSite}
        onSiteChange={setSelectedSite}
        periodOptions={periodOptions.map(option => ({ value: option.value, label: option.label }))}
        selectedPeriod={selectedPeriod}
        onPeriodChange={value => setSelectedPeriod(value as WorklogPeriod)}
        query={query}
        onQueryChange={setQuery}
        onQuerySubmit={() => void 0}
        activeStatuses={statuses}
        onStatusToggle={handleStatusToggle}
        onClearFilters={handleClearFilters}
      />

      <TaskCalendar
        month={month}
        data={calendarCells}
        selectedDate={selectedWorklog?.workDate}
        onDateChange={iso => {
          setSelectedPeriod('all')
          setMonth(startOfMonth(parseISO(iso)))
          setQuery('')
        }}
        onMonthChange={setMonth}
      />

      <TaskDiaryList
        items={worklogs}
        onSelect={handleSelectWorklog}
        activeId={selectedId}
        isLoading={isLoading}
        emptyMessage="조건에 맞는 작업일지가 없습니다."
      />

      <DiaryDetailViewer
        open={isViewerOpen && Boolean(selectedWorklog)}
        worklog={selectedWorklog ?? null}
        onClose={() => setIsViewerOpen(false)}
        onDownload={id => console.log('download', id)}
        onOpenDocument={attachment => console.log('open document', attachment)}
        onOpenMarkup={worklog => {
          const params = new URLSearchParams()
          params.set('mode', 'browse')
          params.set('siteId', worklog.siteId)
          params.set('worklogId', worklog.id)
          router.push(`/mobile/markup-tool?${params.toString()}`)
        }}
        onOpenMarkupDoc={(docId, worklog) => {
          const params = new URLSearchParams()
          params.set('mode', 'start')
          params.set('siteId', worklog.siteId)
          params.set('worklogId', worklog.id)
          params.set('docId', docId)
          router.push(`/mobile/markup-tool?${params.toString()}`)
        }}
      />
    </main>
  )
}
