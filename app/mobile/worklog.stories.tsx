import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const meta: Meta = {
  title: 'Mobile Pages/Worklog',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [date, setDate] = useState('2025-10-10')
      const [keyword, setKeyword] = useState('')
      const logs = [
        {
          id: 'w1',
          date: '2025-10-10',
          site: 'A아파트',
          summary: '균열 보수 및 자재 반입',
          members: 6,
        },
        { id: 'w2', date: '2025-10-09', site: 'B물류센터', summary: '철근 가공/설치', members: 8 },
        { id: 'w3', date: '2025-10-08', site: 'INOPNC 본사', summary: '도장 1차 시공', members: 4 },
      ]
      return (
        <MobileLayout>
          <div className="px-4 pb-28 space-y-4">
            <header className="pt-6">
              <h1 className="text-xl font-semibold">작업 일지</h1>
            </header>
            {/* Filters */}
            <Card>
              <CardContent className="p-3 grid grid-cols-2 gap-2">
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <Input
                  placeholder="키워드"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
              </CardContent>
            </Card>
            {/* List */}
            <div className="space-y-2">
              {logs
                .filter(
                  l => l.date >= date && (l.site.includes(keyword) || l.summary.includes(keyword))
                )
                .map(l => (
                  <Card key={l.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.site}</div>
                        <div className="text-sm text-gray-600">
                          {l.date} · {l.summary}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">인원</div>
                        <div className="text-lg font-semibold">{l.members}명</div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
            {/* CTA */}
            <div className="h-16" />
            <div className="fixed bottom-20 left-0 right-0 px-4">
              <Button className="w-full">새 작업일지 작성</Button>
            </div>
          </div>
        </MobileLayout>
      )
    }
    return <Demo />
  },
}
