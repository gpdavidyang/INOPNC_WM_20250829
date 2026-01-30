export type TabType = 'request' | 'production' | 'shipping'

export interface BaseItem {
  id: string
  site: string // 현장명
  date: string // 날짜
  material: string // 자재명
}

// 1. 주문요청 데이터 타입
export interface RequestData extends BaseItem {
  type: 'request'
  partner?: string // 거래처 (optional)
  qty: number // 주문수량
  priority: 'low' | 'normal' | 'high' | 'urgent' // 긴급도
  memo?: string // 메모
}

// 2. 생산정보 데이터 타입
export interface ProductionData extends BaseItem {
  type: 'production'
  partner: string // 자재거래처
  productionQty: number // 생산수량
  additionalMaterial?: string // 추가자재
}

// 3. 출고배송 데이터 타입
export interface ShippingData extends BaseItem {
  type: 'shipping'
  partner: string // 거래처
  status: 'waiting' | 'done' // 상태
  totalQty: number // 총 수량
  amount: number // 금액
  tags: string[] // 월말청구, 화물 등 태그
}

export type AnyItem = RequestData | ProductionData | ShippingData

export interface ToastState {
  show: boolean
  message: string
}

export interface KPIData {
  label: string
  value: string
  color?: string // Highlight color
}
