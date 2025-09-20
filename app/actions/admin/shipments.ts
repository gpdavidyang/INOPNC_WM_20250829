import { createClient } from "@/lib/supabase/server"
import { getAuthForClient, type SimpleAuth } from "@/lib/auth/ultra-simple"
'use server'

type AdminAuthResult = { auth: SimpleAuth; role: string | null } | { error: string }

async function requireAdminAuth(supabase: ReturnType<typeof createClient>): Promise<AdminAuthResult> {
  const auth = await getAuthForClient(supabase)
  if (!auth) {
    return { error: '인증이 필요합니다.' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.userId)
    .single()

  if (error) {
    console.error('관리자 권한 확인 중 오류:', error)
    return { error: '사용자 정보를 확인할 수 없습니다.' }
  }

  if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
    return { error: '관리자 권한이 필요합니다.' }
  }

  return { auth, role: profile.role }
}


// 출고 처리
export async function processShipment(data: {
  site_id: string
  material_request_id?: string
  quantity_shipped: number
  planned_delivery_date?: string
  tracking_number?: string
  carrier?: string
  notes?: string
}) {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    const { auth } = adminContext

    // 입력값 검증
    if (!data.site_id || data.quantity_shipped <= 0) {
      return { success: false, error: '올바른 출고 정보를 입력해주세요.' }
    }

    // 현장 존재 확인
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('name')
      .eq('id', data.site_id)
      .single()

    if (siteError || !site) {
      return { success: false, error: '존재하지 않는 현장입니다.' }
    }

    // 본사 재고 확인
    const { data: inventory, error: inventoryError } = await supabase
      .from('v_inventory_status')
      .select('*')
      .eq('location', '본사')
      .single()

    if (inventoryError || !inventory) {
      return { success: false, error: '본사 재고 정보를 확인할 수 없습니다.' }
    }

    if (inventory.current_stock < data.quantity_shipped) {
      return { 
        success: false, 
        error: `본사 재고가 부족합니다. (현재: ${inventory.current_stock}말, 요청: ${data.quantity_shipped}말)` 
      }
    }

    // 출고 기록 생성
    const { data: shipmentRecord, error } = await supabase
      .from('shipment_records')
      .insert({
        shipment_date: new Date().toISOString().split('T')[0],
        site_id: data.site_id,
        material_request_id: data.material_request_id,
        quantity_shipped: data.quantity_shipped,
        planned_delivery_date: data.planned_delivery_date,
        tracking_number: data.tracking_number,
        carrier: data.carrier,
        notes: data.notes,
        status: 'preparing',
        created_by: auth.userId
      })
      .select(`
        *,
        sites!inner(name)
      `)
      .single()

    if (error) {
      console.error('Error creating shipment record:', error)
      return { success: false, error: '출고 기록 생성에 실패했습니다.' }
    }

    revalidatePath('/dashboard/admin/materials')
    return { success: true, data: shipmentRecord }

  } catch (error) {
    console.error('Error in processShipment:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 출고 상태 업데이트
export async function updateShipmentStatus(id: string, status: 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled') {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    // 상태별 추가 업데이트 데이터
    const updateData: unknown = { 
      status, 
      updated_at: new Date().toISOString() 
    }

    if (status === 'delivered') {
      updateData.actual_delivery_date = new Date().toISOString().split('T')[0]
    }

    // 출고 상태 업데이트
    const { data: shipmentRecord, error } = await supabase
      .from('shipment_records')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        sites!inner(name)
      `)
      .single()

    if (error) {
      console.error('Error updating shipment status:', error)
      return { success: false, error: '출고 상태 업데이트에 실패했습니다.' }
    }

    // 관련 요청의 상태도 업데이트
    if (shipmentRecord.material_request_id && status === 'delivered') {
      await supabase
        .from('material_requests')
        .update({ status: 'delivered' })
        .eq('id', shipmentRecord.material_request_id)
    }

    revalidatePath('/dashboard/admin/materials')
    return { success: true, data: shipmentRecord }

  } catch (error) {
    console.error('Error in updateShipmentStatus:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 출고 정보 수정
export async function updateShipmentInfo(id: string, updates: Partial<{
  planned_delivery_date: string
  tracking_number: string
  carrier: string
  notes: string
}>) {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    // 수정할 데이터 준비
    const updateData: unknown = { updated_at: new Date().toISOString() }
    if (updates.planned_delivery_date !== undefined) updateData.planned_delivery_date = updates.planned_delivery_date
    if (updates.tracking_number !== undefined) updateData.tracking_number = updates.tracking_number
    if (updates.carrier !== undefined) updateData.carrier = updates.carrier
    if (updates.notes !== undefined) updateData.notes = updates.notes

    // 출고 정보 수정
    const { data: shipmentRecord, error } = await supabase
      .from('shipment_records')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        sites!inner(name)
      `)
      .single()

    if (error) {
      console.error('Error updating shipment info:', error)
      return { success: false, error: '출고 정보 수정에 실패했습니다.' }
    }

    revalidatePath('/dashboard/admin/materials')
    return { success: true, data: shipmentRecord }

  } catch (error) {
    console.error('Error in updateShipmentInfo:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 출고 이력 조회
export async function getShipmentHistory(site_id?: string, filters?: {
  start_date?: string
  end_date?: string
  status?: string
  limit?: number
}) {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    // 쿼리 구성
    let query = supabase
      .from('shipment_records')
      .select(`
        *,
        sites!inner(name),
        material_requests(request_number, notes),
        profiles!shipment_records_created_by_fkey(full_name)
      `)
      .order('shipment_date', { ascending: false })

    // 필터 적용
    if (site_id) {
      query = query.eq('site_id', site_id)
    }
    if (filters?.start_date) {
      query = query.gte('shipment_date', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('shipment_date', filters.end_date)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: shipmentRecords, error } = await query

    if (error) {
      console.error('Error fetching shipment history:', error)
      return { success: false, error: '출고 이력을 불러오는데 실패했습니다.' }
    }

    return { success: true, data: shipmentRecords || [] }

  } catch (error) {
    console.error('Error in getShipmentHistory:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 출고 분석 데이터 조회
export async function getShipmentAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    // 뷰에서 출고 분석 데이터 조회
    const { data: analytics, error } = await supabase
      .from('v_shipment_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Error fetching shipment analytics:', error)
      return { success: false, error: '출고 분석 데이터를 불러오는데 실패했습니다.' }
    }

    return { success: true, data: analytics || [] }

  } catch (error) {
    console.error('Error in getShipmentAnalytics:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 대기 중인 출고 요청 조회
export async function getPendingShipmentRequests() {
  try {
    const supabase = createClient()

    // 사용자 인증 및 권한 확인
    const adminContext = await requireAdminAuth(supabase)
    if ('error' in adminContext) {
      return { success: false, error: adminContext.error }
    }

    // 처리되지 않은 자재 요청 조회
    const { data: pendingRequests, error } = await supabase
      .from('material_requests')
      .select(`
        *,
        sites!inner(name, address),
        profiles!material_requests_requested_by_fkey(full_name, email)
      `)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending requests:', error)
      return { success: false, error: '대기 중인 요청을 불러오는데 실패했습니다.' }
    }

    // 긴급도별 분류
    const urgentRequests = pendingRequests?.filter((req: unknown) => req.urgency === 'emergency') || []
    const highPriorityRequests = pendingRequests?.filter((req: unknown) => req.urgency === 'urgent') || []
    const normalRequests = pendingRequests?.filter((req: unknown) => req.urgency === 'normal') || []

    return {
      success: true,
      data: {
        all: pendingRequests || [],
        urgent: urgentRequests,
        high_priority: highPriorityRequests,
        normal: normalRequests,
        total_count: pendingRequests?.length || 0
      }
    }

  } catch (error) {
    console.error('Error in getPendingShipmentRequests:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 배송 추적
export async function trackDelivery(tracking_number: string) {
  try {
    const supabase = await createClient()
    
    // 추적번호로 출고 기록 조회
    const { data: shipment, error } = await supabase
      .from('shipment_records')
      .select(`
        *,
        sites!inner(name, address),
        material_requests(request_number, notes)
      `)
      .eq('tracking_number', tracking_number)
      .single()

    if (error || !shipment) {
      return { success: false, error: '추적번호를 찾을 수 없습니다.' }
    }

    // 배송 상태 정보 구성
    const trackingInfo = {
      tracking_number: shipment.tracking_number,
      carrier: shipment.carrier,
      status: shipment.status,
      shipment_date: shipment.shipment_date,
      planned_delivery_date: shipment.planned_delivery_date,
      actual_delivery_date: shipment.actual_delivery_date,
      site_name: shipment.sites.name,
      site_address: shipment.sites.address,
      quantity_shipped: shipment.quantity_shipped,
      notes: shipment.notes
    }

    return { success: true, data: trackingInfo }

  } catch (error) {
    console.error('Error in trackDelivery:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}
