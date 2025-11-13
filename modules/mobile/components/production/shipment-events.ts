export const SHIPMENT_ITEMS_TOTAL_EVENT = 'shipment-items-total'

export type ShipmentItemsTotalEventDetail = {
  total: number
}

export function dispatchShipmentTotal(total: number) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<ShipmentItemsTotalEventDetail>(SHIPMENT_ITEMS_TOTAL_EVENT, {
      detail: { total },
    })
  )
}
