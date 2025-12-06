import type { DailyReportSearchConfig, SearchFieldConfig, QuickFilter } from './types'

export const dailyReportSearchFields: SearchFieldConfig[] = [
  {
    field: 'work_date',
    label: '작업일자',
    type: 'date',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: '날짜 선택',
  },
  {
    field: 'member_name',
    label: '담당자명',
    type: 'text',
    operators: ['contains', 'equals', 'startsWith'],
    placeholder: '담당자명 입력',
  },
  {
    field: 'process_type',
    label: '공정',
    type: 'select',
    operators: ['equals'],
    options: [
      { value: '토공사', label: '토공사' },
      { value: '철근공사', label: '철근공사' },
      { value: '거푸집공사', label: '거푸집공사' },
      { value: '콘크리트공사', label: '콘크리트공사' },
      { value: '조적공사', label: '조적공사' },
      { value: '방수공사', label: '방수공사' },
      { value: '타일공사', label: '타일공사' },
      { value: '도장공사', label: '도장공사' },
      { value: '기타', label: '기타' },
    ],
  },
  {
    field: 'status',
    label: '상태',
    type: 'select',
    operators: ['equals'],
    options: [
      { value: 'draft', label: '임시' },
      { value: 'submitted', label: '제출됨' },
    ],
  },
  {
    field: 'site_id',
    label: '현장',
    type: 'select',
    operators: ['equals'],
    options: [], // Will be populated dynamically
  },
  {
    field: 'total_workers',
    label: '작업인원',
    type: 'number',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: '인원 수',
  },
  {
    field: 'npc1000_used',
    label: 'NPC-1000 사용량',
    type: 'number',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: 'kg 단위',
  },
  {
    field: 'npc1000_remaining',
    label: 'NPC-1000 잔량',
    type: 'number',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: 'kg 단위',
  },
  {
    field: 'issues',
    label: '특이사항',
    type: 'text',
    operators: ['contains', 'equals'],
    placeholder: '특이사항 내용',
  },
  {
    field: 'created_at',
    label: '작성일',
    type: 'date',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: '작성일 선택',
  },
  {
    field: 'submitted_at',
    label: '제출일',
    type: 'date',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: '제출일 선택',
  },
  {
    field: 'approved_at',
    label: '승인일',
    type: 'date',
    operators: ['equals', 'gte', 'lte', 'between'],
    placeholder: '승인일 선택',
  },
]

export const dailyReportQuickFilters: QuickFilter[] = [
  {
    id: 'today',
    label: '오늘 작업',
    icon: 'Calendar',
    filters: [
      {
        field: 'work_date',
        operator: 'equals',
        value: new Date().toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'pending_approval',
    label: '승인 대기',
    icon: 'Clock',
    filters: [
      {
        field: 'status',
        operator: 'equals',
        value: 'submitted',
      },
    ],
  },
  {
    id: 'has_issues',
    label: '특이사항 있음',
    icon: 'AlertTriangle',
    filters: [
      {
        field: 'issues',
        operator: 'contains',
        value: '',
      },
    ],
  },
  {
    id: 'high_workers',
    label: '대규모 작업 (10명↑)',
    icon: 'Users',
    filters: [
      {
        field: 'total_workers',
        operator: 'gte',
        value: 10,
      },
    ],
  },
  {
    id: 'high_npc1000',
    label: 'NPC-1000 대량 사용 (1t↑)',
    icon: 'Package',
    filters: [
      {
        field: 'npc1000_used',
        operator: 'gte',
        value: 1000,
      },
    ],
  },
  {
    id: 'this_week',
    label: '이번 주',
    icon: 'Calendar',
    filters: [
      {
        field: 'work_date',
        operator: 'gte',
        value: getStartOfWeek().toISOString().split('T')[0],
      },
      {
        field: 'work_date',
        operator: 'lte',
        value: getEndOfWeek().toISOString().split('T')[0],
      },
    ],
  },
  {
    id: 'this_month',
    label: '이번 달',
    icon: 'Calendar',
    filters: [
      {
        field: 'work_date',
        operator: 'gte',
        value: getStartOfMonth().toISOString().split('T')[0],
      },
      {
        field: 'work_date',
        operator: 'lte',
        value: getEndOfMonth().toISOString().split('T')[0],
      },
    ],
  },
]

export const dailyReportSearchConfig: DailyReportSearchConfig = {
  fields: dailyReportSearchFields,
  defaultSort: { field: 'work_date', order: 'desc' },
  quickFilters: dailyReportQuickFilters,
}

// Helper functions for date calculations
function getStartOfWeek(): Date {
  const date = new Date()
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(date.setDate(diff))
}

function getEndOfWeek(): Date {
  const date = getStartOfWeek()
  return new Date(date.setDate(date.getDate() + 6))
}

function getStartOfMonth(): Date {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getEndOfMonth(): Date {
  const date = new Date()
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}
