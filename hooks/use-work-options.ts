'use client'

import { useState, useEffect } from 'react'

interface UseWorkOptionsReturn {
  componentTypes: WorkOptionSetting[]
  processTypes: WorkOptionSetting[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useWorkOptions(): UseWorkOptionsReturn {
  const [componentTypes, setComponentTypes] = useState<WorkOptionSetting[]>([])
  const [processTypes, setProcessTypes] = useState<WorkOptionSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOptions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mobile-safe endpoint (workers allowed). Admin pages can also use this.
      const response = await fetch('/api/mobile/work-options')
      if (!response.ok) {
        throw new Error('Failed to fetch work options')
      }

      const data: WorkOptionSetting[] = await response.json()

      // Separate component types and process types
      const components = data
        .filter(opt => opt.option_type === 'component_type')
        .sort((a, b) => a.display_order - b.display_order)

      const processes = data
        .filter(opt => opt.option_type === 'process_type')
        .sort((a, b) => a.display_order - b.display_order)

      setComponentTypes(components)
      setProcessTypes(processes)
    } catch (err) {
      console.error('Error fetching work options:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch work options')

      // Set default values as fallback
      setComponentTypes([
        {
          id: '1',
          option_type: 'component_type',
          option_value: 'slab',
          option_label: '슬라브',
          display_order: 1,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          option_type: 'component_type',
          option_value: 'girder',
          option_label: '거더',
          display_order: 2,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          option_type: 'component_type',
          option_value: 'column',
          option_label: '기둥',
          display_order: 3,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '4',
          option_type: 'component_type',
          option_value: 'other',
          option_label: '기타',
          display_order: 999,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      ])

      setProcessTypes([
        {
          id: '1',
          option_type: 'process_type',
          option_value: 'crack',
          option_label: '균열',
          display_order: 1,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '2',
          option_type: 'process_type',
          option_value: 'surface',
          option_label: '면',
          display_order: 2,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '3',
          option_type: 'process_type',
          option_value: 'finishing',
          option_label: '마감',
          display_order: 3,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
        {
          id: '4',
          option_type: 'process_type',
          option_value: 'other',
          option_label: '기타',
          display_order: 999,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [])

  return {
    componentTypes,
    processTypes,
    loading,
    error,
    refetch: fetchOptions,
  }
}
