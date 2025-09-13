'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ProductionRecord, ProductionAnalytics } from '@/types/materials'
import { 
  handleError, 
  validateRequired, 
  validateNumber, 
  validateDate,
  createSuccessResponse,
  createErrorResponse,
  ErrorCodes,
  withRetry,
  ApiResponse
} from '@/lib/utils/error-handling'
import { 
  logAuditTrail, 
  recordMetric, 
  PerformanceTimer,
  MetricNames,
  ErrorTypes 
} from '@/lib/utils/logging'
import { requireAdminAuth, isAuthError } from '@/lib/utils/auth'

// 생산 기록 생성
export async function createProductionRecord(data: {
  production_date: string
  quantity_produced: number
  unit_cost?: number
  notes?: string
}): Promise<ApiResponse<ProductionRecord>> {
  const timer = new PerformanceTimer(MetricNames.PRODUCTION_RECORD, {
    operation: 'create'
  })

  try {
    // 입력값 검증
    const validationError = validateRequired(data, ['production_date', 'quantity_produced'])
    if (validationError) return validationError

    const dateValidation = validateDate(data.production_date, '생산일자')
    if (dateValidation) return dateValidation

    const quantityValidation = validateNumber(data.quantity_produced, '생산량', { min: 0.01 })
    if (quantityValidation) return quantityValidation

    if (data.unit_cost !== undefined) {
      const costValidation = validateNumber(data.unit_cost, '단가', { min: 0 })
      if (costValidation) return costValidation
    }

    // 인증 및 권한 확인
    const authResult = await requireAdminAuth()
    if (isAuthError(authResult)) {
      return createErrorResponse(authResult.error || '인증 실패', ErrorCodes.UNAUTHORIZED)
    }
    const { user, profile } = authResult

    const supabase = await createClient()
    const total_cost = (data.quantity_produced * (data.unit_cost || 0))

    // 재시도 가능한 데이터베이스 작업
    const result = await withRetry(async () => {
      const { data: productionRecord, error } = await supabase
        .from('production_records')
        .insert({
          production_date: data.production_date,
          quantity_produced: data.quantity_produced,
          unit_cost: data.unit_cost || 0,
          total_cost: total_cost,
          notes: data.notes,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      return productionRecord
    }, 2, 1000)

    // 감사 로그 기록
    await logAuditTrail({
      tableName: 'production_records',
      operation: 'INSERT',
      recordId: result.id,
      newValues: {
        production_date: data.production_date,
        quantity_produced: data.quantity_produced,
        unit_cost: data.unit_cost || 0,
        total_cost: total_cost
      },
      operationType: 'production',
      description: `생산 기록 생성: ${data.quantity_produced}개 생산 (${data.production_date})`
    })

    // 성능 메트릭 기록
    await recordMetric({
      metricName: 'production_quantity',
      metricType: 'gauge',
      value: data.quantity_produced,
      unit: 'units',
      tags: {
        date: data.production_date,
        user_id: user.id
      }
    })

    await timer.stop()
    revalidatePath('/dashboard/admin/materials')
    return createSuccessResponse(result)

  } catch (error) {
    await timer.stop()
    return handleError(error)
  }
}

// 생산 기록 수정
export async function updateProductionRecord(id: string, updates: Partial<{
  production_date: string
  quantity_produced: number
  unit_cost: number
  notes: string
}>) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 수정할 데이터 준비
    const updateData: any = { updated_at: new Date().toISOString() }
    if (updates.production_date !== undefined) updateData.production_date = updates.production_date
    if (updates.quantity_produced !== undefined) updateData.quantity_produced = updates.quantity_produced
    if (updates.unit_cost !== undefined) updateData.unit_cost = updates.unit_cost
    if (updates.notes !== undefined) updateData.notes = updates.notes

    // 생산 기록 수정
    const { data: productionRecord, error } = await supabase
      .from('production_records')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating production record:', error)
      return { success: false, error: '생산 기록 수정에 실패했습니다.' }
    }

    revalidatePath('/dashboard/admin/materials')
    return { success: true, data: productionRecord }

  } catch (error) {
    console.error('Error in updateProductionRecord:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 생산 기록 삭제
export async function deleteProductionRecord(id: string) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 생산 기록 삭제
    const { error } = await supabase
      .from('production_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting production record:', error)
      return { success: false, error: '생산 기록 삭제에 실패했습니다.' }
    }

    revalidatePath('/dashboard/admin/materials')
    return { success: true }

  } catch (error) {
    console.error('Error in deleteProductionRecord:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 생산 이력 조회
export async function getProductionHistory(filters?: {
  start_date?: string
  end_date?: string
  limit?: number
}) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 쿼리 구성
    let query = supabase
      .from('production_records')
      .select(`
        *,
        profiles!production_records_created_by_fkey(full_name)
      `)
      .order('production_date', { ascending: false })

    // 필터 적용
    if (filters?.start_date) {
      query = query.gte('production_date', filters.start_date)
    }
    if (filters?.end_date) {
      query = query.lte('production_date', filters.end_date)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: productionRecords, error } = await query

    if (error) {
      console.error('Error fetching production history:', error)
      return { success: false, error: '생산 이력을 불러오는데 실패했습니다.' }
    }

    return { success: true, data: productionRecords || [] }

  } catch (error) {
    console.error('Error in getProductionHistory:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 생산 분석 데이터 조회
export async function getProductionAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      return { success: false, error: '관리자 권한이 필요합니다.' }
    }

    // 기간별 집계 쿼리
    const { data: analytics, error } = await supabase.rpc('get_production_analytics')

    if (error) {
      console.error('Error fetching production analytics:', error)
      
      // 폴백: 뷰에서 직접 조회
      const { data: fallbackData, error: viewError } = await supabase
        .from('v_production_summary')
        .select('*')
        .order('month', { ascending: false })
        .limit(12)

      if (viewError) {
        return { success: false, error: '생산 분석 데이터를 불러오는데 실패했습니다.' }
      }

      return { success: true, data: fallbackData || [] }
    }

    return { success: true, data: analytics || [] }

  } catch (error) {
    console.error('Error in getProductionAnalytics:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}

// 일일 생산 현황 조회
export async function getDailyProductionStatus(date?: string) {
  try {
    const supabase = await createClient()
    
    // 사용자 인증 및 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: '인증이 필요합니다.' }
    }

    const targetDate = date || new Date().toISOString().split('T')[0]

    // 해당 날짜 생산 기록 조회
    const { data: dailyProduction, error } = await supabase
      .from('production_records')
      .select('*')
      .eq('production_date', targetDate)

    if (error) {
      console.error('Error fetching daily production:', error)
      return { success: false, error: '일일 생산 현황을 불러오는데 실패했습니다.' }
    }

    // 본사 현재 재고 조회
    const { data: inventory, error: inventoryError } = await supabase
      .from('v_inventory_status')
      .select('*')
      .eq('location', '본사')
      .single()

    if (inventoryError) {
      console.error('Error fetching headquarters inventory:', inventoryError)
    }

    // 통계 계산
    const totalProduced = dailyProduction?.reduce((sum: number, record: any) => sum + Number(record.quantity_produced), 0) || 0
    const totalCost = dailyProduction?.reduce((sum: number, record: any) => sum + Number(record.total_cost || 0), 0) || 0
    const avgUnitCost = totalProduced > 0 ? totalCost / totalProduced : 0

    return {
      success: true,
      data: {
        date: targetDate,
        records: dailyProduction || [],
        stats: {
          total_produced: totalProduced,
          total_cost: totalCost,
          avg_unit_cost: avgUnitCost,
          record_count: dailyProduction?.length || 0
        },
        headquarters_inventory: inventory || null
      }
    }

  } catch (error) {
    console.error('Error in getDailyProductionStatus:', error)
    return { success: false, error: '서버 오류가 발생했습니다.' }
  }
}