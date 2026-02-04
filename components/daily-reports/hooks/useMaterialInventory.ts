'use client'

import { useEffect, useState } from 'react'
import type { MaterialInventoryEntry } from '../types'

export const useMaterialInventory = (selectedSiteId: string) => {
  const [materialInventory, setMaterialInventory] = useState<
    Record<string, MaterialInventoryEntry>
  >({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedSiteId) {
      setMaterialInventory({})
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/api/admin/sites/${selectedSiteId}/materials/summary`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const invMap: Record<string, MaterialInventoryEntry> = {}
          // The API returns an object { inventory: [...], shipments: [...], stats: {...} }
          const items = Array.isArray(data.data) ? data.data : data.data.inventory || []

          items.forEach((item: any) => {
            const materialId = item.material_id || item.materialId
            if (!materialId) return
            invMap[materialId] = {
              materialId,
              quantity: item.quantity ?? 0,
              unit: item.materials?.unit || item.unit || '',
              status: item.status || 'normal',
              name: item.materials?.name || item.name || '',
            }
          })
          setMaterialInventory(invMap)
        }
      })
      .catch(err => {
        console.error('Inventory fetch error:', err)
        setError('재고 정보를 가져오는 데 실패했습니다.')
      })
      .finally(() => setLoading(false))
  }, [selectedSiteId])

  return {
    materialInventory,
    loading,
    error,
  }
}
