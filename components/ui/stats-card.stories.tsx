import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import StatsCard from './stats-card'

const meta: Meta<typeof StatsCard> = {
  title: 'Mobile/StatsCard',
  component: StatsCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    label: '오늘 작업 수',
    value: 12,
    unit: 'count',
  },
}

export default meta
type Story = StoryObj<typeof StatsCard>

export const Default: Story = {}

export const WithCurrency: Story = {
  args: {
    label: '총 매출',
    value: 1450000,
    unit: 'won',
    decimals: 0,
    currency: true,
  },
}

export const GridExample: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-3 w-[360px]">
      <StatsCard label="금일 작업" value={18} unit="count" />
      <StatsCard label="현장 수" value={5} unit="site" />
      <StatsCard label="작업자" value={21} unit="person" />
      <StatsCard label="진행률" value={76} unit="percent" decimals={0} />
    </div>
  ),
}
