import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { BottomNavigation } from './bottom-navigation'
import { Home, ClipboardList, Folder, User } from 'lucide-react'

const meta: Meta<typeof BottomNavigation> = {
  title: 'Mobile/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    activeIndex: { control: { type: 'number', min: 0, max: 3 } },
    useIcons: { control: 'boolean' },
  },
  args: {
    items: [
      { label: '홈', href: '/mobile' },
      { label: '작업', href: '/mobile/work' },
      { label: '문서함', href: '/mobile/documents' },
      { label: '내 정보', href: '/mobile/profile' },
    ],
    activeIndex: 0,
    useIcons: false,
  },
}

export default meta
type Story = StoryObj<typeof BottomNavigation>

export const Default: Story = {
  render: args => {
    const items = args.items.map((it, i) => ({
      ...it,
      active: i === (args as any).activeIndex,
      icon: (args as any).useIcons ? (
        i === 0 ? (
          <Home className="h-5 w-5" />
        ) : i === 1 ? (
          <ClipboardList className="h-5 w-5" />
        ) : i === 2 ? (
          <Folder className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        )
      ) : undefined,
    }))
    return (
      <div className="min-h-[900px] p-4">
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">모바일 하단 내비게이션</h1>
          <p className="text-sm text-gray-600">스크롤을 내려 고정 위치를 확인해 보세요.</p>
          <div className="h-[700px] rounded-xl border bg-gray-50" />
        </div>
        <BottomNavigation items={items as any} />
      </div>
    )
  },
}

export const WithIcons: Story = {
  args: {
    items: [
      { label: '홈', href: '/mobile', icon: <Home className="h-5 w-5" />, active: true },
      { label: '작업', href: '/mobile/work', icon: <ClipboardList className="h-5 w-5" /> },
      { label: '문서함', href: '/mobile/documents', icon: <Folder className="h-5 w-5" /> },
      { label: '내 정보', href: '/mobile/profile', icon: <User className="h-5 w-5" /> },
    ],
  },
  render: args => (
    <div className="min-h-[900px] p-4">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">아이콘 포함 하단 내비게이션</h1>
        <div className="h-[700px] rounded-xl border bg-gray-50" />
      </div>
      <BottomNavigation {...args} />
    </div>
  ),
}

// Docs-friendly preview that shows the bar inside a phone frame by overriding
// position: fixed -> absolute only within this story scope.
export const InDeviceFrame: Story = {
  name: 'In Device Frame (Docs-friendly)',
  args: {
    items: [
      { label: '홈', href: '/mobile', active: true },
      { label: '작업', href: '/mobile/work' },
      { label: '문서함', href: '/mobile/documents' },
      { label: '내 정보', href: '/mobile/profile' },
    ],
  },
  parameters: { layout: 'centered' },
  render: args => (
    <div id="device-frame" className="p-4">
      <style>{`
        /* Scope override to this story only */
        #device-frame .phone-shell { position: relative; width: 390px; height: 844px; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; background: #fff; }
        #device-frame .phone-shell .scroll { height: 760px; margin: 16px; border-radius: 12px; background: #F6F9FF; border: 1px dashed #d1d5db; }
        #device-frame .phone-shell nav.fixed { position: absolute !important; bottom: 0; left: 0; right: 0; }
      `}</style>
      <div className="phone-shell">
        <div className="px-5 pt-5 text-sm text-gray-600">
          <p className="font-semibold text-gray-900">모바일 하단 내비게이션</p>
          <p>기기 프레임 안에서의 시각적 위치 미리보기</p>
        </div>
        <div className="scroll" />
        <BottomNavigation {...args} />
      </div>
    </div>
  ),
}
