import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { BrandTabs, BrandTabsList, BrandTabsTrigger, BrandTabsContent } from './brand-tabs'
import { Layers, FolderKanban, Wrench } from 'lucide-react'

const meta: Meta<typeof BrandTabs> = {
  title: 'Mobile/BrandTabs',
  component: BrandTabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    defaultValue: 'overview',
  },
}

export default meta
type Story = StoryObj<typeof BrandTabs>

export const Default: Story = {
  render: args => (
    <BrandTabs {...args}>
      <BrandTabsList className="w-[360px]">
        <BrandTabsTrigger value="overview">개요</BrandTabsTrigger>
        <BrandTabsTrigger value="docs">문서</BrandTabsTrigger>
        <BrandTabsTrigger value="tools">도구</BrandTabsTrigger>
      </BrandTabsList>
      <BrandTabsContent value="overview">개요 콘텐츠</BrandTabsContent>
      <BrandTabsContent value="docs">문서 콘텐츠</BrandTabsContent>
      <BrandTabsContent value="tools">도구 콘텐츠</BrandTabsContent>
    </BrandTabs>
  ),
}

export const WithIcons: Story = {
  render: args => (
    <BrandTabs {...args}>
      <BrandTabsList className="w-[360px]">
        <BrandTabsTrigger value="overview" className="inline-flex items-center gap-1">
          <Layers className="h-4 w-4" /> 개요
        </BrandTabsTrigger>
        <BrandTabsTrigger value="docs" className="inline-flex items-center gap-1">
          <FolderKanban className="h-4 w-4" /> 문서
        </BrandTabsTrigger>
        <BrandTabsTrigger value="tools" className="inline-flex items-center gap-1">
          <Wrench className="h-4 w-4" /> 도구
        </BrandTabsTrigger>
      </BrandTabsList>
      <BrandTabsContent value="overview">개요 콘텐츠</BrandTabsContent>
      <BrandTabsContent value="docs">문서 콘텐츠</BrandTabsContent>
      <BrandTabsContent value="tools">도구 콘텐츠</BrandTabsContent>
    </BrandTabs>
  ),
}
