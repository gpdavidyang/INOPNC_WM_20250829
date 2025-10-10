import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import PillTabLinks from './pill-tab-links'

const meta: Meta<typeof PillTabLinks> = {
  title: 'Mobile/PillTabLinks',
  component: PillTabLinks,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: {
    items: [
      { key: 'all', label: '전체', href: '/mobile/docs?f=all' },
      { key: 'mine', label: '내 문서', href: '/mobile/docs?f=mine' },
      { key: 'shared', label: '공유', href: '/mobile/docs?f=shared' },
    ],
    activeKey: 'all',
    fill: true,
  },
}

export default meta
type Story = StoryObj<typeof PillTabLinks>

export const Default: Story = {}

export const ActiveMiddle: Story = {
  args: {
    activeKey: 'mine',
  },
}
