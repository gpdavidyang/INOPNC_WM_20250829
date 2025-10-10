import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'primary',
        'secondary',
        'danger',
        'destructive',
        'ghost',
        'outline',
        'work-action',
        'photo-upload',
      ],
    },
    size: {
      control: { type: 'select' },
      options: ['compact', 'standard', 'field', 'critical', 'full'],
    },
    touchMode: {
      control: { type: 'inline-radio' },
      options: ['normal', 'glove', 'precision'],
    },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'standard',
    touchMode: 'normal',
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {}

export const Variants: Story = {
  render: args => (
    <div className="grid grid-cols-2 gap-3">
      {[
        'primary',
        'secondary',
        'danger',
        'destructive',
        'ghost',
        'outline',
        'work-action',
        'photo-upload',
      ].map(v => (
        <Button key={v} {...args} variant={v as any}>
          {String(v)}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: args => (
    <div className="flex flex-col gap-3 w-full">
      {['compact', 'standard', 'field', 'critical', 'full'].map(s => (
        <Button key={s} {...args} size={s as any}>
          {String(s)}
        </Button>
      ))}
    </div>
  ),
}
