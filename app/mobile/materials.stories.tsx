import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const meta: Meta = {
  title: 'Mobile Pages/Materials',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'history'>('inventory')
      const [searchQuery, setSearchQuery] = useState('')
      const materials = [
        {
          id: 1,
          name: '시멘트',
          category: 'concrete',
          currentStock: 250,
          unit: 'kg',
          status: 'sufficient',
        },
        {
          id: 2,
          name: '철근 (12mm)',
          category: 'steel',
          currentStock: 45,
          unit: '개',
          status: 'low',
        },
        {
          id: 3,
          name: '벽돌',
          category: 'masonry',
          currentStock: 8,
          unit: '팔레트',
          status: 'critical',
        },
      ]
      const getStatus = (s: string) =>
        s === 'sufficient' ? 'tag3' : s === 'low' ? 'tag1' : 'danger'
      const getIcon = (c: string) => (c === 'concrete' ? '🏗️' : c === 'steel' ? '⚙️' : '📦')

      return (
        <MobileLayout>
          <div className="px-4 pb-28 space-y-4">
            <header className="pt-6">
              <h1 className="text-xl font-semibold">자재 관리</h1>
            </header>
            <Card>
              <CardContent className="p-3 grid grid-cols-3 gap-3">
                <Button
                  variant={activeTab === 'inventory' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('inventory')}
                >
                  재고
                </Button>
                <Button
                  variant={activeTab === 'requests' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('requests')}
                >
                  요청
                </Button>
                <Button
                  variant={activeTab === 'history' ? 'primary' : 'outline'}
                  onClick={() => setActiveTab('history')}
                >
                  기록
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <Input
                  placeholder="자재명 검색..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </CardContent>
            </Card>
            {activeTab === 'inventory' && (
              <div className="space-y-3">
                {materials
                  .filter(m => m.name.includes(searchQuery))
                  .map(m => (
                    <Card key={m.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{getIcon(m.category)}</div>
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-sm text-gray-600">
                              재고 {m.currentStock}
                              {m.unit}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full border">
                          {getStatus(m.status)}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </MobileLayout>
      )
    }
    return <Demo />
  },
}
