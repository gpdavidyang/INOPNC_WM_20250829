'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface MaterialEntry {
  material_name: string
  quantity: number
  unit: string
  notes?: string
}

export interface SaveWorklogPayload {
  site_id: string
  work_date: string
  status: 'draft' | 'submitted'
  work_description: string
  total_workers: number
  member_types: string[]
  processes: string[]
  work_types: string[]
  location: {
    block?: string
    dong?: string
    unit?: string
  }
  main_manpower: number
  additional_manpower: Array<{
    name: string
    manpower: number
  }>
  notes?: string
  safety_notes?: string
  materials?: MaterialEntry[]
}

async function postWorklog(payload: SaveWorklogPayload) {
  const response = await fetch('/api/mobile/daily-reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await response.json()

  if (!response.ok || result?.error) {
    throw new Error(result?.error || '작업일지 저장에 실패했습니다.')
  }

  return result.data
}

export function useCreateWorklog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: postWorklog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worklogs'] })
      queryClient.invalidateQueries({ queryKey: ['worklog-calendar'] })
    },
  })
}
