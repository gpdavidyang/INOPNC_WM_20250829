'use client'

import React from 'react'
import DataTable, { type Column } from '@/components/admin/DataTable'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DetailTablesClient({
  versions,
  history,
}: {
  versions: any[]
  history: any[]
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>버전</CardTitle>
          <CardDescription>최신순</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            data={versions}
            rowKey={(v: any) => v.id}
            stickyHeader
            emptyMessage="버전 정보가 없습니다."
            columns={([
              { key: 'version', header: '버전', sortable: true },
              { key: 'title', header: '제목', sortable: true },
              { key: 'author', header: '작성자', sortable: true },
              { key: 'created_at_str', header: '생성일', sortable: true },
              { key: 'latest_label', header: '최신', sortable: true },
            ] as Column<any>[])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>변경 이력</CardTitle>
          <CardDescription>최근 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<any>
            data={history}
            rowKey={(h: any) => h.id}
            stickyHeader
            emptyMessage="이력이 없습니다."
            columns={([
              { key: 'changed_at_str', header: '일시', sortable: true },
              { key: 'change_type', header: '변경', sortable: true },
              { key: 'summary', header: '요약', sortable: false },
              { key: 'user_label', header: '사용자', sortable: true },
            ] as Column<any>[])}
          />
        </CardContent>
      </Card>
    </>
  )
}
