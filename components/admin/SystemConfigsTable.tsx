'use client'

import { DataTable } from '@/components/admin/DataTable'
import { Badge } from '@/components/ui/badge'

export default function SystemConfigsTable({ configs }: { configs: any[] }) {
  return (
    <DataTable
      data={configs}
      rowKey={(c: any) => `${c.category}:${c.setting_key}`}
      emptyMessage="표시할 설정이 없습니다."
      stickyHeader
      columns={[
        {
          key: 'category',
          header: '카테고리',
          sortable: true,
          width: '140px',
          render: (c: any) => (
            <span className="font-semibold text-slate-700">{c?.category || '-'}</span>
          ),
        },
        {
          key: 'setting_key',
          header: '키(Key)',
          sortable: true,
          width: '240px',
          render: (c: any) => (
            <span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">
              {c?.setting_key || '-'}
            </span>
          ),
        },
        {
          key: 'setting_value',
          header: '설정 값',
          render: (c: any) => {
            const val =
              typeof c?.setting_value === 'object'
                ? JSON.stringify(c.setting_value)
                : String(c?.setting_value ?? '')
            return (
              <span
                className="max-w-[500px] truncate inline-block text-sm text-slate-500 font-medium"
                title={val}
              >
                {val}
              </span>
            )
          },
        },
        {
          key: 'is_public',
          header: '공개여부',
          width: '100px',
          align: 'center',
          render: (c: any) => (
            <Badge
              variant={c?.is_public ? 'success' : 'secondary'}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            >
              {c?.is_public ? '공개' : '비공개'}
            </Badge>
          ),
        },
        {
          key: 'updated_at',
          header: '최종 수정일',
          width: '140px',
          render: (r: any) => (
            <span className="text-xs text-slate-400 font-medium">
              {r?.updated_at || r?.created_at
                ? new Date(r.updated_at || r.created_at).toLocaleDateString('ko-KR')
                : '-'}
            </span>
          ),
        },
      ]}
    />
  )
}
