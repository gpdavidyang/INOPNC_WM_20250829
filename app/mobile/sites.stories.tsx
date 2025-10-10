import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const meta: Meta = {
  title: 'Mobile Pages/Sites',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [q, setQ] = useState('')
      const sites = [
        { id: 'a', name: 'INOPNC 본사 리모델링', location: '서울 서초구', progress: 62 },
        { id: 'b', name: 'A아파트 신축 공사', location: '성남 분당구', progress: 45 },
        { id: 'c', name: 'B물류센터 증축', location: '용인 처인구', progress: 78 },
      ]
      return (
        <MobileLayout>
          <div className="px-4 pb-28 space-y-4">
            <header className="pt-6">
              <h1 className="text-xl font-semibold">현장 목록</h1>
            </header>
            <Card>
              <CardContent className="p-3">
                <Input placeholder="현장명 검색" value={q} onChange={e => setQ(e.target.value)} />
              </CardContent>
            </Card>
            <div className="space-y-2">
              {sites
                .filter(s => s.name.includes(q))
                .map(s => (
                  <Card key={s.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-sm text-gray-600">{s.location}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">진행률</div>
                        <div className="text-lg font-semibold text-blue-600">{s.progress}%</div>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        </MobileLayout>
      )
    }
    return <Demo />
  },
}
