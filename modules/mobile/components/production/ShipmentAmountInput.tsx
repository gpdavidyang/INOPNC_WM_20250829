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
  const [autoValue, setAutoValue] = useState<number>(defaultValue)
  const [manualOverride, setManualOverride] = useState<boolean>(false)

  const handleAutoUpdate = useCallback(
    (total: number) => {
      setAutoValue(total)
      if (manualOverride) return
      setValue(total)
    },
    [manualOverride]
  )

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
    setManualOverride(true)
    setValue(Number.isFinite(next) ? next : 0)
  }

  const handleResetOverride = () => {
    setManualOverride(false)
    setValue(autoValue)
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-muted-foreground">출고금액(원)</label>
        {manualOverride && (
          <button
            type="button"
            onClick={handleResetOverride}
            className="text-xs text-primary hover:underline"
          >
            자동 계산값으로 재설정
          </button>
        )}
      </div>
      <input
        type="number"
        min="0"
        step="1"
        name={name}
        value={Number.isFinite(value) ? value : 0}
        onChange={handleChange}
        className="w-full rounded border px-3 py-2"
      />
    </div>
  )
}

export default ShipmentAmountInput
