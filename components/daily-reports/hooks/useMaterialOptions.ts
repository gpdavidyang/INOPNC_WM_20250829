'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MaterialOptionItem } from '../types'
import { isSelectableMaterial, normalizeMaterialKeyword } from '../utils/builders'

const DEFAULT_MATERIAL_KEYWORD = 'npc1000'

export const useMaterialOptions = (
  materials: any[],
  mapMaterialToOption: (m: any) => MaterialOptionItem
) => {
  const [materialOptions, setMaterialOptions] = useState<MaterialOptionItem[]>([])

  useEffect(() => {
    const fromProps = Array.isArray(materials) ? materials.map(mapMaterialToOption) : []
    setMaterialOptions(prev => {
      if (
        prev.length === fromProps.length &&
        prev.every((item, i) => item.id === fromProps[i].id)
      ) {
        return prev
      }
      return fromProps
    })
  }, [materials, mapMaterialToOption])

  useEffect(() => {
    let ignore = false
    const loadMaterials = async () => {
      const endpoints = [
        {
          url: '/api/admin/materials/active',
          normalize: (json: any) =>
            json?.success && Array.isArray(json.data)
              ? json.data.filter((item: any) => {
                  if (typeof item?.is_deleted === 'boolean' && item.is_deleted) return false
                  return isSelectableMaterial(item)
                })
              : [],
        },
        {
          url: '/api/mobile/materials',
          normalize: (json: any) =>
            json?.success && Array.isArray(json.data)
              ? json.data.filter((item: any) => item && item.id)
              : [],
        },
      ]

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint.url, { credentials: 'include', cache: 'no-store' })
          if (!res.ok) continue
          const json = await res.json().catch(() => null)
          const rows = endpoint.normalize(json)
          if (!rows.length) continue
          const mapped = rows.map(mapMaterialToOption)
          if (ignore) return
          setMaterialOptions(mapped)
          return
        } catch (error) {
          console.warn(`[useMaterialOptions] fetch failed`, error)
        }
      }
    }

    loadMaterials()
    return () => {
      ignore = true
    }
  }, [mapMaterialToOption])

  const getDefaultOption = useCallback(() => {
    if (!materialOptions.length) return null
    const match = materialOptions.find(option => {
      const nameToken = normalizeMaterialKeyword(option.name)
      const codeToken = normalizeMaterialKeyword(option.code)
      return (
        nameToken.includes(DEFAULT_MATERIAL_KEYWORD) ||
        (codeToken ? codeToken.includes(DEFAULT_MATERIAL_KEYWORD) : false)
      )
    })
    return match ?? materialOptions[0]
  }, [materialOptions])

  return {
    materialOptions,
    getDefaultOption,
  }
}
