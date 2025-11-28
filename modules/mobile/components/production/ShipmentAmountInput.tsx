'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  SHIPMENT_ITEMS_TOTAL_EVENT,
  type ShipmentItemsTotalEventDetail,
} from '@/modules/mobile/components/production/shipment-events'

type ShipmentAmountInputProps = {
  name: string
  defaultValue?: number
  className?: string
}

export function ShipmentAmountInput({
  name,
  defaultValue = 0,
  className,
}: ShipmentAmountInputProps) {
  const [value, setValue] = useState<number>(defaultValue)

  const handleAutoUpdate = useCallback((total: number) => {
    setValue(total)
  }, [])

  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<ShipmentItemsTotalEventDetail>
      const total = Number(customEvent.detail?.total || 0)
      handleAutoUpdate(total)
    }
    window.addEventListener(SHIPMENT_ITEMS_TOTAL_EVENT, listener as EventListener)
    return () => {
      window.removeEventListener(SHIPMENT_ITEMS_TOTAL_EVENT, listener as EventListener)
    }
  }, [handleAutoUpdate])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value || 0)
    setValue(Number.isFinite(next) ? next : 0)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-muted-foreground">출고금액(원)</label>
      </div>
      <input
        type="number"
        min="0"
        step="1"
        name={name}
        value={Number.isFinite(value) ? value : 0}
        onChange={handleChange}
        readOnly
        className="w-full rounded-lg border px-3 py-2 bg-gray-100 text-gray-700"
      />
      <input type="hidden" name={name} value={Number.isFinite(value) ? value : 0} />
    </div>
  )
}

export default ShipmentAmountInput
