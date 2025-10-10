import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from './card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    elevation: { control: { type: 'select' }, options: ['sm', 'md', 'lg', 'xl'] },
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'prominent', 'section-header', 'work-card'],
    },
    premium: { control: 'boolean' },
  },
  args: {
    elevation: 'sm',
    variant: 'default',
    premium: false,
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: args => (
    <Card {...args} className="w-full">
      <CardHeader>
        <CardTitle>작업 현황</CardTitle>
        <CardDescription>오늘의 작업 진행 상황 요약</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-600">
          콘텐츠 영역입니다. 폰트, 간격, 색상을 조정해 보세요.
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-gray-500">업데이트: 2분 전</div>
      </CardFooter>
    </Card>
  ),
}

export const Variants: Story = {
  render: args => (
    <div className="grid gap-4 w-full">
      {(['default', 'elevated', 'prominent', 'section-header', 'work-card'] as const).map(v => (
        <Card key={v} {...args} variant={v}>
          <CardHeader>
            <CardTitle>{v}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">이 변형의 시각적 스타일을 확인하세요.</div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}
