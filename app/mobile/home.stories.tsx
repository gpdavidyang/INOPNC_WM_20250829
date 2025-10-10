import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MobileLayout } from '@/modules/mobile/components/layout/MobileLayout'
import StatsCard from '@/components/ui/stats-card'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const meta: Meta = {
  title: 'Mobile Pages/Home',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <MobileLayout>
      <div className="px-4 pb-28 space-y-4">
        <header className="pt-6">
          <h1 className="text-xl font-semibold">현장 홈</h1>
        </header>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="작업일지" value={12} unit="count" />
          <StatsCard label="현장 수" value={3} unit="site" />
          <StatsCard label="인원" value={21} unit="person" />
          <StatsCard label="진행률" value={76} unit="percent" decimals={0} />
        </div>

        {/* Quick actions */}
        <Card>
          <CardContent className="p-4 grid grid-cols-2 gap-3">
            <Button className="w-full">작업일지 작성</Button>
            <Button variant="outline" className="w-full">
              사진 업로드
            </Button>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  ),
}
