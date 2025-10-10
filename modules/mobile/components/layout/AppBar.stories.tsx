import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { AppBar } from './AppBar'

const meta: Meta<typeof AppBar> = {
  title: 'Mobile/AppBar',
  component: AppBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    titleText: { control: 'text' },
    showLabels: { control: 'boolean' },
    notificationCountOverride: { control: { type: 'number', min: 0, max: 120 } },
  },
  args: {
    titleText: 'INOPNC',
    showLabels: true,
    notificationCountOverride: 3,
  },
}

export default meta
type Story = StoryObj<typeof AppBar>

export const Default: Story = {
  render: args => (
    <div id="device-frame" className="p-4">
      <style>{`
        /* Place AppBar inside a phone shell for Docs/Canvas clarity */
        #device-frame .phone-shell { position: relative; width: 390px; height: 844px; border-radius: 24px; overflow: hidden; border: 1px solid #e5e7eb; background: #fff; }
        #device-frame .phone-shell .scroll { height: 760px; margin: 16px; border-radius: 12px; background: #f5f7fb; border: 1px dashed #d1d5db; }
        #device-frame header.app-header { position: absolute !important; top: 0; left: 0; right: 0; }
      `}</style>
      <div className="phone-shell">
        <div className="scroll" />
        <AppBar {...args} />
      </div>
    </div>
  ),
}

export const CompactDark: Story = {
  args: {
    titleText: '현장 관리',
    showLabels: false,
    notificationCountOverride: 12,
  },
  render: args => (
    <div id="device-frame" className="p-4">
      <style>{`
        #device-frame .phone-shell { position: relative; width: 390px; height: 844px; border-radius: 24px; overflow: hidden; border: 1px solid #1f2937; background: #0f172a; }
        #device-frame .phone-shell .scroll { height: 760px; margin: 16px; border-radius: 12px; background: #111827; border: 1px dashed #374151; }
        #device-frame header.app-header { position: absolute !important; top: 0; left: 0; right: 0; }
      `}</style>
      <div className="phone-shell" data-theme="dark">
        <div className="scroll" />
        <AppBar {...args} />
      </div>
    </div>
  ),
}
