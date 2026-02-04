'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MaterialOptionItem, MaterialUsageFormEntry } from '../types'
import {
  buildMaterialUsageEntriesFromReport,
  normalizeMaterialKeyword,
  sanitizeUnitLabel,
} from '../utils/builders'

export const useMaterialUsageEntries = (
  mode: 'create' | 'edit',
  reportData: any,
  materialOptions: MaterialOptionItem[],
  getDefaultOption: () => MaterialOptionItem | null,
  DEFAULT_MATERIAL_UNIT: string
) => {
  const [materialUsageEntries, setMaterialUsageEntries] = useState<MaterialUsageFormEntry[]>(() =>
    buildMaterialUsageEntriesFromReport(mode, reportData)
  )

  // Resolve material entries when options load or change
  useEffect(() => {
    if (!materialOptions.length || !materialUsageEntries.length) return
    const defaultOption = getDefaultOption()

    setMaterialUsageEntries(prev => {
      let changed = false
      const next = prev.map(entry => {
        // 1) If already resolved to a known ID in options, skip
        const exists = materialOptions.some(o => o.id === entry.materialId)
        if (exists) return entry

        // 2) Try to resolve ID by code or name matching
        const match = materialOptions.find(
          o =>
            (o.code && (o.code === entry.materialId || o.code === entry.materialCode)) ||
            normalizeMaterialKeyword(o.name) === normalizeMaterialKeyword(entry.materialName)
        )

        if (match) {
          changed = true
          return {
            ...entry,
            materialId: match.id,
            materialCode: match.code,
            materialName: match.name,
            unit: sanitizeUnitLabel(match.unit) ?? entry.unit ?? DEFAULT_MATERIAL_UNIT,
          }
        }

        // 3) If it's a new empty entry and we have a default, fill it
        if (!entry.materialId && !entry.materialName.trim() && defaultOption) {
          changed = true
          return {
            ...entry,
            materialId: defaultOption.id,
            materialCode: defaultOption.code ?? null,
            materialName: defaultOption.name,
            unit: sanitizeUnitLabel(defaultOption.unit) ?? DEFAULT_MATERIAL_UNIT,
          }
        }

        return entry
      })
      return changed ? next : prev
    })
  }, [materialOptions, getDefaultOption, materialUsageEntries.length, DEFAULT_MATERIAL_UNIT])

  const addMaterialEntry = useCallback(() => {
    setMaterialUsageEntries(prev => {
      const defaultOption = getDefaultOption()
      return [
        ...prev,
        {
          id: `material-${Date.now()}`,
          materialId: defaultOption?.id ?? null,
          materialCode: defaultOption?.code ?? null,
          materialName: defaultOption?.name ?? '',
          unit: sanitizeUnitLabel(defaultOption?.unit ?? null) ?? DEFAULT_MATERIAL_UNIT,
          quantity: '',
          notes: '',
        },
      ]
    })
  }, [getDefaultOption, DEFAULT_MATERIAL_UNIT])

  const handleRemoveMaterial = useCallback((id: string) => {
    setMaterialUsageEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return {
    materialUsageEntries,
    setMaterialUsageEntries,
    addMaterialEntry,
    handleRemoveMaterial,
  }
}
