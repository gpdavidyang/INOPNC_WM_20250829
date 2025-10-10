import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const meta: Meta = {
  title: 'Mobile Pages/Notifications',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important'>('all')
      const list = [
        {
          id: '1',
          title: '작업 배정',
          message: 'A동 3층 균열 보수 작업이 배정되었습니다.',
          type: 'assignment',
          time: '09:12',
          read: false,
          important: false,
        },
        {
          id: '2',
          title: '안전 교육',
          message: '고소 작업 안전 교육을 수강하세요.',
          type: 'safety',
          time: '어제',
          read: false,
          important: true,
        },
        {
          id: '3',
          title: '자재 입고',
          message: '철근(12mm) 30개 입고 완료',
          type: 'materials',
          time: '2일 전',
          read: true,
          important: false,
        },
      ]
      const filtered = list.filter(n =>
        activeTab === 'all' ? true : activeTab === 'unread' ? !n.read : n.important
      )
      const color = (t: string) =>
        t === 'assignment'
          ? 'bg-blue-50'
          : t === 'safety'
            ? 'bg-red-50'
            : t === 'materials'
              ? 'bg-green-50'
              : 'bg-gray-50'
      const icon = (t: string) =>
        t === 'assignment' ? '👤' : t === 'safety' ? '⚠️' : t === 'materials' ? '📦' : '🔔'
      const unread = list.filter(n => !n.read).length
      const important = list.filter(n => n.important).length
      return (
        <MobileLayout>
          <div className="px-4 pb-28 space-y-4">
            <header className="pt-6">
              <h1 className="text-xl font-semibold">알림</h1>
            </header>
            <Card>
              <CardContent className="p-3 grid grid-cols-3 gap-2">
                <Button
                  variant={activeTab === 'all' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('all')}
                >
                  전체 ({list.length})
                </Button>
                <Button
                  variant={activeTab === 'unread' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('unread')}
                >
                  읽지 않음 {unread > 0 && <span className="ml-1">({unread})</span>}
                </Button>
                <Button
                  variant={activeTab === 'important' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('important')}
                >
                  중요 ({important})
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-2">
              {filtered.map(n => (
                <Card key={n.id} className={!n.read ? 'border-l-4 border-l-blue-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color(n.type)}`}
                      >
                        <span className="text-lg">{icon(n.type)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`text-sm ${!n.read ? 'font-bold' : 'font-medium'}`}>
                            {n.title}
                          </h4>
                          {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className={`text-xs ${!n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                      </div>
                      <Button variant="ghost" className="text-sm px-2 py-1 h-auto">
                        ⋯
                      </Button>
                    </div>
                  </CardContent>
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
