'use client'

import { useEffect, useState } from 'react'
import type { MaterialInventoryEntry } from '../daily-reports/types'

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
          data.data.forEach((item: any) => {
            invMap[item.material_id] = {
              quantity: item.qty_remaining ?? item.current_stock ?? 0,
              unit: item.unit_name || item.unit || '',
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
