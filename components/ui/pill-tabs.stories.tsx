import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { PillTabs, PillTabsList, PillTabsTrigger, PillTabsContent } from './pill-tabs'
import { Home, FileText, Settings } from 'lucide-react'

const meta: Meta<typeof PillTabs> = {
  title: 'Mobile/PillTabs',
  component: PillTabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    defaultValue: 'home',
  },
}

export default meta
type Story = StoryObj<typeof PillTabs>

export const Default: Story = {
  render: args => (
    <PillTabs {...args}>
      <PillTabsList fill className="w-[360px]">
        <PillTabsTrigger value="home">홈</PillTabsTrigger>
        <PillTabsTrigger value="docs">문서</PillTabsTrigger>
        <PillTabsTrigger value="settings">설정</PillTabsTrigger>
      </PillTabsList>
      <PillTabsContent value="home">홈 콘텐츠</PillTabsContent>
      <PillTabsContent value="docs">문서 콘텐츠</PillTabsContent>
      <PillTabsContent value="settings">설정 콘텐츠</PillTabsContent>
    </PillTabs>
  ),
}

export const WithIcons: Story = {
  render: args => (
    <PillTabs {...args}>
      <PillTabsList fill className="w-[360px]">
        <PillTabsTrigger value="home" className="inline-flex items-center gap-1">
          <Home className="h-4 w-4" /> 홈
        </PillTabsTrigger>
        <PillTabsTrigger value="docs" className="inline-flex items-center gap-1">
          <FileText className="h-4 w-4" /> 문서
        </PillTabsTrigger>
        <PillTabsTrigger value="settings" className="inline-flex items-center gap-1">
          <Settings className="h-4 w-4" /> 설정
        </PillTabsTrigger>
      </PillTabsList>
      <PillTabsContent value="home">홈 콘텐츠</PillTabsContent>
      <PillTabsContent value="docs">문서 콘텐츠</PillTabsContent>
      <PillTabsContent value="settings">설정 콘텐츠</PillTabsContent>
    </PillTabs>
  ),
}
