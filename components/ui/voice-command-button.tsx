/* eslint-disable */
'use client'

import * as React from 'react'
export function VoiceCommandButton({ active = false }: { active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-full border px-4 py-2 text-sm ${active ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
    >
      Voice command {active ? 'ON' : 'OFF'}
    </button>
  )
}
