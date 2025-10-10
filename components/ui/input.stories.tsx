import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    placeholder: { control: 'text' },
  },
  args: {
    placeholder: '검색어를 입력하세요',
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithValue: Story = {
  args: {
    defaultValue: '샘플 텍스트',
  },
}
