'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import {
  validateRequired,
  validateDate,
  validateNumber,
  withRetry,
} from '@/lib/utils/error-handling'
import {
  logAuditTrail,
  recordMetric,
  PerformanceTimer,
  MetricNames,
} from '@/lib/utils/logging'
import type { ProductionRecord } from '@/types/materials'
import type { Database } from '@/types/database'
import {
  withAdminAuth,
  type AdminActionResult,
  AdminErrors,
  resolveAdminError,
  requireRestrictedOrgId,
} from './common'

type AdminSupabaseClient = SupabaseClient<Database>

type SupabaseProductionRow = {
  id: string
  production_date: string
  quantity_produced: number | string | null
  unit_cost: number | string | null
  total_cost: number | string | null
  notes?: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  creator?: {
    organization_id?: string | null
    full_name?: string | null
  } | null
}

type ProductionRecordWithMeta = ProductionRecord & {
  creator_name?: string | null
  creator?: {
    organization_id?: string | null
    full_name?: string | null
  } | null
}

interface ProductionHistoryFilters {
  start_date?: string
  end_date?: string
  limit?: number
}

interface DailyProductionSummary {
  date: string
  records: ProductionRecordWithMeta[]
  stats: {
    total_produced: number
    total_cost: number
    avg_unit_cost: number
    record_count: number
  }
  headquarters_inventory: Record<string, unknown> | null
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

function mapProductionRecord(row: SupabaseProductionRow): ProductionRecordWithMeta {
  const quantity = roundToTwo(toNumber(row.quantity_produced))
  const unitCost = roundToTwo(toNumber(row.unit_cost))
  const totalCostValue = row.total_cost !== null && row.total_cost !== undefined
    ? toNumber(row.total_cost)
    : quantity * unitCost

  return {
    id: row.id,
    production_date: row.production_date,
    quantity_produced: quantity,
    unit_cost: unitCost,
    total_cost: roundToTwo(totalCostValue),
    notes: row.notes ?? null,
    created_by: row.created_by ?? '',
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    creator_name: row.creator?.full_name ?? null,
    creator: row.creator ?? null,
  }
}

async function ensureProductionAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  id: string
): Promise<ProductionRecordWithMeta> {
  const { data, error } = await supabase
    .from('production_records')
    .select(
      `
      *,
      creator:profiles!production_records_created_by_fkey(organization_id, full_name)
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    console.error('Production record not found or failed to load:', error)
    throw new AppError('생산 기록을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  const organizationId = (data as SupabaseProductionRow).creator?.organization_id ?? undefined
  await assertOrgAccess(auth, organizationId)

  return mapProductionRecord(data as SupabaseProductionRow)
}

function buildAnalyticsKey(dateString: string, period: 'week' | 'month' | 'year'): string {
  const [year, month, day] = dateString.split('-')

  switch (period) {
    case 'week':
      return `${year}-${month}-${day}`
    case 'year':
      return year
    case 'month':
    default:
      return `${year}-${month}`
  }
}

function getAnalyticsStartDate(period: 'week' | 'month' | 'year'): string {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (period === 'week') {
    now.setDate(now.getDate() - 7)
  } else if (period === 'month') {
    now.setMonth(now.getMonth() - 6)
  } else {
    now.setFullYear(now.getFullYear() - 3)
  }

  return now.toISOString().split('T')[0]!
}

function buildProductionAnalytics(
  rows: SupabaseProductionRow[],
  period: 'week' | 'month' | 'year'
) {
  const buckets = new Map<string, { totalQuantity: number; totalCost: number; days: Set<string> }>()

  rows.forEach(row => {
    if (!row.production_date) {
      return
    }

    const key = buildAnalyticsKey(row.production_date, period)
    const quantity = toNumber(row.quantity_produced)
    const totalCost = row.total_cost !== null && row.total_cost !== undefined
      ? toNumber(row.total_cost)
      : quantity * toNumber(row.unit_cost)

    const bucket = buckets.get(key) ?? { totalQuantity: 0, totalCost: 0, days: new Set<string>() }
    bucket.totalQuantity += quantity
    bucket.totalCost += totalCost
    bucket.days.add(row.production_date)
    buckets.set(key, bucket)
  })

  return Array.from(buckets.entries())
    .map(([key, value]) => {
      const avgUnitCost = value.totalQuantity > 0 ? value.totalCost / value.totalQuantity : 0
      return {
        month: key,
        total_produced: roundToTwo(value.totalQuantity),
        total_cost: roundToTwo(value.totalCost),
        avg_unit_cost: roundToTwo(avgUnitCost),
        production_days: value.days.size,
      }
    })
    .sort((a, b) => (a.month < b.month ? 1 : -1))
}

export async function createProductionRecord(data: {
  production_date: string
  quantity_produced: number
  unit_cost?: number
  notes?: string
}): Promise<AdminActionResult<ProductionRecordWithMeta>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth
    const timer = new PerformanceTimer(MetricNames.PRODUCTION_RECORD, {
      operation: 'create',
      admin_id: auth.userId,
    })

    try {
      const requiredValidation = validateRequired(data, ['production_date', 'quantity_produced'])
      if (requiredValidation) {
        return { success: false, error: requiredValidation.error }
      }

      const dateValidation = validateDate(data.production_date, '생산일자')
      if (dateValidation) {
        return { success: false, error: dateValidation.error }
      }

      const quantityValidation = validateNumber(data.quantity_produced, '생산량', { min: 0.01 })
      if (quantityValidation) {
        return { success: false, error: quantityValidation.error }
      }

      if (data.unit_cost !== undefined) {
        const costValidation = validateNumber(data.unit_cost, '단가', { min: 0 })
        if (costValidation) {
          return { success: false, error: costValidation.error }
        }
      }

      const unitCost = roundToTwo(data.unit_cost ?? 0)
      const totalCost = roundToTwo(data.quantity_produced * unitCost)

      const inserted = await withRetry(async () => {
        const { data: insertedRow, error } = await supabase
          .from('production_records')
          .insert({
            production_date: data.production_date,
            quantity_produced: data.quantity_produced,
            unit_cost: unitCost,
            total_cost: totalCost,
            notes: data.notes,
            created_by: auth.userId,
          })
          .select(
            `
            *,
            creator:profiles!production_records_created_by_fkey(organization_id, full_name)
          `
          )
          .single()

        if (error || !insertedRow) {
          throw error ?? new AppError('생산 기록을 추가할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
        }

        return insertedRow as SupabaseProductionRow
      }, 2, 1000)

      const record = mapProductionRecord(inserted)

      await logAuditTrail({
        tableName: 'production_records',
        operation: 'INSERT',
        recordId: record.id,
        adminId: auth.userId,
        newValues: {
          production_date: record.production_date,
          quantity_produced: record.quantity_produced,
          unit_cost: record.unit_cost,
          total_cost: record.total_cost,
        },
        operationType: 'production',
        description: `생산 기록 생성: ${record.quantity_produced} (${record.production_date})`,
      })

      await recordMetric({
        metricName: 'production_quantity',
        metricType: 'gauge',
        value: record.quantity_produced,
        unit: 'units',
        tags: {
          date: record.production_date,
          user_id: auth.userId,
        },
      })

      revalidatePath('/dashboard/admin/materials')
      return { success: true, data: record }
    } catch (error) {
      console.error('Error in createProductionRecord:', error)
      return { success: false, error: resolveAdminError(error, AdminErrors.UNKNOWN_ERROR) }
    } finally {
      await timer.stop().catch(() => undefined)
    }
  })
}

export async function updateProductionRecord(
  id: string,
  updates: Partial<{
    production_date: string
    quantity_produced: number
    unit_cost: number
    notes: string
  }>
): Promise<AdminActionResult<ProductionRecordWithMeta>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const existing = await ensureProductionAccessible(supabase, auth, id)

      if (updates.production_date !== undefined) {
        const dateValidation = validateDate(updates.production_date, '생산일자')
        if (dateValidation) {
          return { success: false, error: dateValidation.error }
        }
      }

      if (updates.quantity_produced !== undefined) {
        const quantityValidation = validateNumber(updates.quantity_produced, '생산량', { min: 0.01 })
        if (quantityValidation) {
          return { success: false, error: quantityValidation.error }
        }
      }

      if (updates.unit_cost !== undefined) {
        const costValidation = validateNumber(updates.unit_cost, '단가', { min: 0 })
        if (costValidation) {
          return { success: false, error: costValidation.error }
        }
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.production_date !== undefined) {
        updateData.production_date = updates.production_date
      }
      if (updates.quantity_produced !== undefined) {
        updateData.quantity_produced = updates.quantity_produced
      }
      if (updates.unit_cost !== undefined) {
        updateData.unit_cost = roundToTwo(updates.unit_cost)
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes
      }

      if (
        updateData.quantity_produced !== undefined ||
        updateData.unit_cost !== undefined
      ) {
        const quantity = updateData.quantity_produced !== undefined
          ? toNumber(updateData.quantity_produced as number)
          : existing.quantity_produced
        const unitCost = updateData.unit_cost !== undefined
          ? toNumber(updateData.unit_cost as number)
          : existing.unit_cost
        updateData.total_cost = roundToTwo(quantity * unitCost)
      }

      const { data: updatedRow, error } = await supabase
        .from('production_records')
        .update(updateData)
        .eq('id', id)
        .select(
          `
          *,
          creator:profiles!production_records_created_by_fkey(organization_id, full_name)
        `
        )
        .single()

      if (error || !updatedRow) {
        console.error('Error updating production record:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const updatedRecord = mapProductionRecord(updatedRow as SupabaseProductionRow)

      await logAuditTrail({
        tableName: 'production_records',
        operation: 'UPDATE',
        recordId: id,
        adminId: auth.userId,
        oldValues: {
          production_date: existing.production_date,
          quantity_produced: existing.quantity_produced,
          unit_cost: existing.unit_cost,
          total_cost: existing.total_cost,
        },
        newValues: updateData,
        operationType: 'production',
        description: `생산 기록 수정: ${existing.production_date} → ${updatedRecord.production_date}`,
      })

      revalidatePath('/dashboard/admin/materials')
      return { success: true, data: updatedRecord }
    } catch (error) {
      console.error('Error in updateProductionRecord:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function deleteProductionRecord(id: string): Promise<AdminActionResult> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const existing = await ensureProductionAccessible(supabase, auth, id)

      const { error } = await supabase
        .from('production_records')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting production record:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      await logAuditTrail({
        tableName: 'production_records',
        operation: 'DELETE',
        recordId: id,
        adminId: auth.userId,
        oldValues: {
          production_date: existing.production_date,
          quantity_produced: existing.quantity_produced,
          unit_cost: existing.unit_cost,
          total_cost: existing.total_cost,
        },
        operationType: 'production',
        description: `생산 기록 삭제: ${existing.production_date} (${existing.quantity_produced})`,
      })

      revalidatePath('/dashboard/admin/materials')
      return { success: true }
    } catch (error) {
      console.error('Error in deleteProductionRecord:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function getProductionHistory(
  filters?: ProductionHistoryFilters
): Promise<AdminActionResult<ProductionRecordWithMeta[]>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      let query = supabase
        .from('production_records')
        .select(
          `
          *,
          creator:profiles!production_records_created_by_fkey(organization_id, full_name)
        `
        )
        .order('production_date', { ascending: false })

      if (filters?.start_date) {
        query = query.gte('production_date', filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte('production_date', filters.end_date)
      }
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (auth.isRestricted) {
        const restrictedOrgId = requireRestrictedOrgId(auth)
        query = query.eq('creator.organization_id', restrictedOrgId)
      }

      const { data, error } = await query

      if (error) {
        throw new AppError('생산 이력을 불러오는데 실패했습니다.', ErrorType.SERVER_ERROR, 500)
      }

      const records = (data || []).map(row => mapProductionRecord(row as SupabaseProductionRow))
      return { success: true, data: records }
    } catch (error) {
      console.error('Error in getProductionHistory:', error)
      return { success: false, error: resolveAdminError(error, AdminErrors.DATABASE_ERROR) }
    }
  })
}

export async function getProductionAnalytics(
  period: 'week' | 'month' | 'year' = 'month'
): Promise<AdminActionResult<Array<{
  month: string
  total_produced: number
  avg_unit_cost: number
  total_cost: number
  production_days: number
}>>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const startDate = getAnalyticsStartDate(period)

      let query = supabase
        .from('production_records')
        .select(
          `
          production_date,
          quantity_produced,
          unit_cost,
          total_cost,
          creator:profiles!production_records_created_by_fkey(organization_id)
        `
        )
        .gte('production_date', startDate)

      if (auth.isRestricted) {
        const restrictedOrgId = requireRestrictedOrgId(auth)
        query = query.eq('creator.organization_id', restrictedOrgId)
      }

      const { data, error } = await query

      if (error) {
        throw new AppError('생산 분석 데이터를 불러오는데 실패했습니다.', ErrorType.SERVER_ERROR, 500)
      }

      const analytics = buildProductionAnalytics((data || []) as SupabaseProductionRow[], period)
      return { success: true, data: analytics }
    } catch (error) {
      console.error('Error in getProductionAnalytics:', error)
      return { success: false, error: resolveAdminError(error, AdminErrors.UNKNOWN_ERROR) }
    }
  })
}

export async function getDailyProductionStatus(
  date?: string
): Promise<AdminActionResult<DailyProductionSummary>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const targetDate = (date || new Date().toISOString().split('T')[0]!)

      let query = supabase
        .from('production_records')
        .select(
          `
          *,
          creator:profiles!production_records_created_by_fkey(organization_id, full_name)
        `
        )
        .eq('production_date', targetDate)
        .order('created_at', { ascending: false })

      if (auth.isRestricted) {
        const restrictedOrgId = requireRestrictedOrgId(auth)
        query = query.eq('creator.organization_id', restrictedOrgId)
      }

      const { data: dailyRows, error } = await query

      if (error) {
        throw new AppError('일일 생산 현황을 불러오는데 실패했습니다.', ErrorType.SERVER_ERROR, 500)
      }

      const records = (dailyRows || []).map(row => mapProductionRecord(row as SupabaseProductionRow))

      let headquartersInventory: Record<string, unknown> | null = null
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('v_inventory_status')
        .select('*')

      if (inventoryError) {
        console.error('Error fetching headquarters inventory:', inventoryError)
      } else if (Array.isArray(inventoryData)) {
        const restrictedOrgId = auth.isRestricted ? requireRestrictedOrgId(auth) : null
        headquartersInventory = inventoryData.find(item => {
          const locationMatches = (item as { location?: string }).location === '본사'

          if (!restrictedOrgId) {
            return locationMatches
          }

          const organizationId = (item as { organization_id?: string | null }).organization_id ?? null
          return locationMatches && organizationId === restrictedOrgId
        }) ?? null
      }

      const totalProduced = records.reduce((sum, record) => sum + record.quantity_produced, 0)
      const totalCost = records.reduce((sum, record) => sum + record.total_cost, 0)
      const avgUnitCost = totalProduced > 0 ? totalCost / totalProduced : 0

      return {
        success: true,
        data: {
          date: targetDate,
          records,
          stats: {
            total_produced: roundToTwo(totalProduced),
            total_cost: roundToTwo(totalCost),
            avg_unit_cost: roundToTwo(avgUnitCost),
            record_count: records.length,
          },
          headquarters_inventory: headquartersInventory,
        },
      }
    } catch (error) {
      console.error('Error in getDailyProductionStatus:', error)
      return { success: false, error: resolveAdminError(error, AdminErrors.UNKNOWN_ERROR) }
    }
  })
}
