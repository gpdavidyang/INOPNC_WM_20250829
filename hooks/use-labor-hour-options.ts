'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WorkOptionSetting } from '@/types'
import {
  FALLBACK_LABOR_HOUR_OPTIONS,
  normalizeLaborHourOptions,
} from '@/lib/labor/labor-hour-options'

let cachedLaborHourOptions: number[] | null = null
let pendingLoad: Promise<number[]> | null = null

const fetchLaborHourOptions = async (): Promise<number[]> => {
  const response = await fetch('/api/mobile/work-options?option_type=labor_hour', {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('공수 옵션을 불러오지 못했습니다.')
  }
  const data = (await response.json().catch(() => [])) as WorkOptionSetting[]
  const numericValues = data
    .filter(option => option.option_type === 'labor_hour' && option.is_active !== false)
    .map(option => Number(option.option_value))
    .filter(value => Number.isFinite(value))

  const normalized = normalizeLaborHourOptions(
    numericValues.length > 0 ? numericValues : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
  )
  cachedLaborHourOptions = normalized
  return normalized
}

const loadLaborHourOptions = async (): Promise<number[]> => {
  if (cachedLaborHourOptions) {
    return cachedLaborHourOptions
  }
  if (!pendingLoad) {
    pendingLoad = fetchLaborHourOptions().finally(() => {
      pendingLoad = null
    })
  }
  return pendingLoad
}

export function useLaborHourOptions() {
  const [options, setOptions] = useState<number[]>(
    cachedLaborHourOptions ?? Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
  )
  const [loading, setLoading] = useState(!cachedLaborHourOptions)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const values = await loadLaborHourOptions()
      setOptions(values)
    } catch (err) {
      console.error('[useLaborHourOptions] failed to load options', err)
      setError(err instanceof Error ? err.message : '공수 옵션을 불러오지 못했습니다.')
      setOptions(Array.from(FALLBACK_LABOR_HOUR_OPTIONS))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (cachedLaborHourOptions) {
      setOptions(cachedLaborHourOptions)
      setLoading(false)
      return
    }
    fetchOptions().catch(() => void 0)
  }, [fetchOptions])

  const refetch = useCallback(async () => {
    cachedLaborHourOptions = null
    await fetchOptions()
  }, [fetchOptions])

  return { options, loading, error, refetch }
}
