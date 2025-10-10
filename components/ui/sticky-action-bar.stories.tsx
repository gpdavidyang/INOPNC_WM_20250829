import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import StickyActionBar from './sticky-action-bar'
import { Button } from './button'

const meta: Meta<typeof StickyActionBar> = {
  title: 'Mobile/StickyActionBar',
  component: StickyActionBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof StickyActionBar>

export const PageBottom: Story = {
  render: () => (
    <div className="min-h-[900px] p-4">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">폼 제출 플로우</h1>
        <p className="text-sm text-gray-600">
          하단에 고정된 액션 바로 저장/제출 버튼을 배치합니다.
        </p>
        <div className="h-[700px] rounded-xl border bg-gray-50" />
      </div>
      <StickyActionBar>
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Button variant="secondary" className="flex-1">
            임시 저장
          </Button>
          <Button className="flex-1">제출</Button>
        </div>
      </StickyActionBar>
    </div>
  ),
}

export const CardBottom: Story = {
  render: () => (
    <div className="p-4">
      <div className="mx-auto max-w-md rounded-xl border">
        <div className="p-4 space-y-3">
          <h2 className="text-lg font-semibold">카드 내부 액션 바</h2>
          <p className="text-sm text-gray-600">
            카드 내용이 길어질 때 푸터 영역에 sticky로 액션을 고정합니다.
          </p>
          <div className="h-[300px] rounded-md border bg-gray-50" />
        </div>
        <StickyActionBar position="card">
          <div className="flex items-center gap-3">
            <Button variant="secondary" className="flex-1">
              취소
            </Button>
            <Button className="flex-1">저장</Button>
          </div>
        </StickyActionBar>
      </div>
    </div>
  ),
}
