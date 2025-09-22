// Mock data for NPC Material Management System
// This provides realistic sample data for all 3 tabs while database tables are being set up

export interface MockProductionData {
  id: string;
  production_date: string;
  production_amount: number;
  shipment_amount: number;
  balance_amount: number;
  notes: string;
  created_at: string;
}

export interface MockShipmentData {
  id: string;
  shipment_date: string;
  site_id: string;
  site_name: string;
  amount: number;
  delivery_status: 'pending' | 'shipped' | 'delivered';
  delivery_method: 'parcel' | 'freight';
  invoice_confirmed: boolean;
  tax_invoice_issued: boolean;
  payment_confirmed: boolean;
  shipping_cost: number;
  tracking_number: string | null;
  notes: string;
  created_at: string;
}

export interface MockRequestData {
  id: string;
  request_date: string;
  site_id: string;
  site_name: string;
  requester_name: string;
  requested_amount: number;
  urgency: 'normal' | 'urgent' | 'critical';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  approved_amount: number | null;
  approved_by?: string;
  approved_at?: string;
  notes: string;
  created_at: string;
}

// 생산관리 목업 데이터
export const mockProductionData: MockProductionData[] = [
  {
    id: 'prod-001',
    production_date: '2025-08-20',
    production_amount: 1500,
    shipment_amount: 1200,
    balance_amount: 300,
    notes: 'NPC-1000 첫 번째 생산 배치',
    created_at: '2025-08-20T09:00:00Z'
  },
  {
    id: 'prod-002',
    production_date: '2025-08-21',
    production_amount: 1800,
    shipment_amount: 1500,
    balance_amount: 600,
    notes: 'NPC-1000 두 번째 생산 배치 - 수요 증가로 생산량 확대',
    created_at: '2025-08-21T09:00:00Z'
  },
  {
    id: 'prod-003',
    production_date: '2025-08-22',
    production_amount: 2000,
    shipment_amount: 1700,
    balance_amount: 900,
    notes: 'NPC-1000 세 번째 생산 배치 - 최대 생산량 달성',
    created_at: '2025-08-22T09:00:00Z'
  },
  {
    id: 'prod-004',
    production_date: '2025-08-23',
    production_amount: 1600,
    shipment_amount: 1400,
    balance_amount: 1100,
    notes: 'NPC-1000 네 번째 생산 배치 - 안정적 생산 진행',
    created_at: '2025-08-23T09:00:00Z'
  }
];

// 출고관리 목업 데이터  
export const mockShipmentData: MockShipmentData[] = [
  {
    id: 'ship-001',
    shipment_date: '2025-08-21',
    site_id: 'site-001',
    site_name: '강남 A현장',
    amount: 300,
    delivery_status: 'delivered',
    delivery_method: 'freight',
    invoice_confirmed: true,
    tax_invoice_issued: true,
    payment_confirmed: true,
    shipping_cost: 30000,
    tracking_number: 'TR123456789',
    notes: '강남 A현장으로 NPC-1000 정상 출고 완료',
    created_at: '2025-08-21T10:30:00Z'
  },
  {
    id: 'ship-002',
    shipment_date: '2025-08-22',
    site_id: 'site-002', 
    site_name: '송파 C현장',
    amount: 400,
    delivery_status: 'shipped',
    delivery_method: 'parcel',
    invoice_confirmed: true,
    tax_invoice_issued: false,
    payment_confirmed: false,
    shipping_cost: 40000,
    tracking_number: 'TR123456790',
    notes: '송파 C현장으로 NPC-1000 배송 중',
    created_at: '2025-08-22T11:15:00Z'
  },
  {
    id: 'ship-003',
    shipment_date: '2025-08-23',
    site_id: 'site-003',
    site_name: '서초 B현장',
    amount: 500,
    delivery_status: 'pending',
    delivery_method: 'freight',
    invoice_confirmed: false,
    tax_invoice_issued: false,
    payment_confirmed: false,
    shipping_cost: 50000,
    tracking_number: null,
    notes: '서초 B현장으로 NPC-1000 출고 준비 중',
    created_at: '2025-08-23T14:20:00Z'
  },
  {
    id: 'ship-004',
    shipment_date: '2025-08-20',
    site_id: 'site-004',
    site_name: '마포 D현장',
    amount: 350,
    delivery_status: 'delivered',
    delivery_method: 'freight',
    invoice_confirmed: true,
    tax_invoice_issued: true,
    payment_confirmed: true,
    shipping_cost: 35000,
    tracking_number: 'TR123456788',
    notes: '마포 D현장으로 NPC-1000 출고 완료',
    created_at: '2025-08-20T16:45:00Z'
  }
];

// 출고요청관리 목업 데이터
export const mockRequestData: MockRequestData[] = [
  {
    id: 'req-001',
    request_date: '2025-08-23',
    site_id: 'site-001',
    site_name: '강남 A현장',
    requester_name: '김현장',
    requested_amount: 250,
    urgency: 'normal',
    reason: '정기 자재 보충 요청 - 다음 주 작업량 증가 예정',
    status: 'approved',
    approved_amount: 250,
    approved_by: 'admin',
    approved_at: '2025-08-23T10:00:00Z',
    notes: '강남 A현장 정기 보충 요청 승인',
    created_at: '2025-08-23T09:30:00Z'
  },
  {
    id: 'req-002',
    request_date: '2025-08-23',
    site_id: 'site-002',
    site_name: '송파 C현장',
    requester_name: '이관리',
    requested_amount: 400,
    urgency: 'urgent',
    reason: '긴급 자재 필요 - 추가 공사 발생으로 인한 소모량 증가',
    status: 'pending',
    approved_amount: null,
    notes: '송파 C현장 긴급 요청 - 검토 중',
    created_at: '2025-08-23T11:45:00Z'
  },
  {
    id: 'req-003',
    request_date: '2025-08-23',
    site_id: 'site-003',
    site_name: '서초 B현장',
    requester_name: '박매니저',
    requested_amount: 350,
    urgency: 'critical',
    reason: '매우 긴급 - 기존 재고 부족으로 작업 중단 위험',
    status: 'pending',
    approved_amount: null,
    notes: '서초 B현장 매우긴급 요청 - 즉시 검토 필요',
    created_at: '2025-08-23T13:20:00Z'
  },
  {
    id: 'req-004',
    request_date: '2025-08-22',
    site_id: 'site-004',
    site_name: '마포 D현장',
    requester_name: '최팀장',
    requested_amount: 300,
    urgency: 'normal',
    reason: '월말 정기 자재 요청 - 다음 달 첫 주 작업 준비',
    status: 'fulfilled',
    approved_amount: 300,
    approved_by: 'admin',
    approved_at: '2025-08-22T15:00:00Z',
    notes: '마포 D현장 정기 요청 처리 완료',
    created_at: '2025-08-22T14:30:00Z'
  },
  {
    id: 'req-005',
    request_date: '2025-08-22',
    site_id: 'site-005',
    site_name: '용산 E현장',
    requester_name: '정소장',
    requested_amount: 200,
    urgency: 'urgent',
    reason: '공정 변경으로 인한 추가 자재 필요',
    status: 'rejected',
    approved_amount: null,
    notes: '용산 E현장 요청 거절 - 재고 부족',
    created_at: '2025-08-22T16:15:00Z'
  }
];

// 통계 계산을 위한 헬퍼 함수들
export const getProductionStats = () => {
  const total = mockProductionData.reduce((sum, item) => sum + item.production_amount, 0);
  const shipped = mockProductionData.reduce((sum, item) => sum + item.shipment_amount, 0);
  const balance = mockProductionData.reduce((sum, item) => sum + item.balance_amount, 0);
  
  return {
    totalProduction: total,
    totalShipped: shipped,
    currentBalance: balance,
    productionDays: mockProductionData.length
  };
};

export const getShipmentStats = () => {
  const totalAmount = mockShipmentData.reduce((sum, item) => sum + item.amount, 0);
  const totalCost = mockShipmentData.reduce((sum, item) => sum + item.shipping_cost, 0);
  const delivered = mockShipmentData.filter(item => item.delivery_status === 'delivered').length;
  const pending = mockShipmentData.filter(item => item.delivery_status === 'pending').length;
  
  return {
    totalShipments: mockShipmentData.length,
    totalAmount,
    totalShippingCost: totalCost,
    deliveredCount: delivered,
    pendingCount: pending
  };
};

export const getRequestStats = () => {
  const totalRequests = mockRequestData.length;
  const pending = mockRequestData.filter(item => item.status === 'pending').length;
  const approved = mockRequestData.filter(item => item.status === 'approved').length;
  const fulfilled = mockRequestData.filter(item => item.status === 'fulfilled').length;
  const urgent = mockRequestData.filter(item => item.urgency === 'urgent' || item.urgency === 'critical').length;
  
  return {
    totalRequests,
    pendingCount: pending,
    approvedCount: approved,
    fulfilledCount: fulfilled,
    urgentCount: urgent
  };
};