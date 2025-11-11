'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import {
  withAdminAuth,
  type AdminActionResult,
  AdminErrors,
  requireRestrictedOrgId,
  resolveAdminError,
} from './common'

type AdminSupabaseClient = SupabaseClient<Database>

type ShipmentStatus = 'preparing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled'

type ShipmentRecord = Database['public']['Tables']['shipment_records']['Row']

type ProcessShipmentInput = {
  site_id: string
  material_request_id?: string
  quantity_shipped: number
  planned_delivery_date?: string
  tracking_number?: string
  carrier?: string
  notes?: string
}

async function ensureSiteAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteId?: string | null
) {
  if (!auth.isRestricted || !siteId) {
    return
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)

  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  const organizationId = (data as { organization_id?: string | null }).organization_id ?? undefined
  await assertOrgAccess(auth, organizationId)

  if (organizationId !== restrictedOrgId) {
    throw new AppError('현장에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureShipmentAccessible(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  shipmentId: string
) {
  const { data, error } = await supabase
    .from('shipment_records')
    .select('id, site_id, site:sites(organization_id)')
    .eq('id', shipmentId)
    .single()

  if (error || !data) {
    throw new AppError('출고 기록을 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  await ensureSiteAccessible(supabase, auth, data.site_id ?? undefined)

  return data as { site_id: string | null; site?: { organization_id?: string | null } | null }
}

async function getAccessibleSiteIds(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth
): Promise<string[] | null> {
  if (!auth.isRestricted) {
    return null
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('organization_id', restrictedOrgId)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  return (data || []).map(site => (site as { id: string }).id)
}

function buildAnalytics(series: ShipmentRecord[], period: 'week' | 'month' | 'year') {
  const bucketKey = (date: string) => {
    const [year, month, day] = date.split('-')
    switch (period) {
      case 'week':
        return `${year}-${month}-${day}`
      case 'year':
        return `${year}`
      case 'month':
      default:
        return `${year}-${month}`
    }
  }

  const buckets = new Map<string, { total_quantity: number; shipments: number }>()

  series.forEach(record => {
    if (!record.shipment_date) {
      return
    }
    const key = bucketKey(record.shipment_date)
    const current = buckets.get(key) ?? { total_quantity: 0, shipments: 0 }
    current.total_quantity += record.quantity_shipped ?? 0
    current.shipments += 1
    buckets.set(key, current)
  })

  return Array.from(buckets.entries())
    .map(([periodKey, value]) => ({ period: periodKey, ...value }))
    .sort((a, b) => (a.period < b.period ? 1 : -1))
}

export async function processShipment(
  data: ProcessShipmentInput
): Promise<AdminActionResult<ShipmentRecord>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      if (!data.site_id || data.quantity_shipped <= 0) {
        return { success: false, error: AdminErrors.VALIDATION_ERROR }
      }

      await ensureSiteAccessible(supabase, auth, data.site_id)

      const { data: site, error: siteError } = await supabase
        .from('sites')
        .select('name')
        .eq('id', data.site_id)
        .single()

      if (siteError || !site) {
        return { success: false, error: '존재하지 않는 현장입니다.' }
      }

      const { data: inventory, error: inventoryError } = await supabase
        .from('v_inventory_status')
        .select('*')
        .eq('location', '본사')
        .single()

      if (inventoryError || !inventory) {
        return { success: false, error: '본사 재고 정보를 확인할 수 없습니다.' }
      }

      if ((inventory as { current_stock?: number }).current_stock! < data.quantity_shipped) {
        return {
          success: false,
          error: `본사 재고가 부족합니다. (현재: ${(inventory as { current_stock?: number }).current_stock}말, 요청: ${data.quantity_shipped}말)`,
        }
      }

      if (data.material_request_id) {
        const { data: request } = await supabase
          .from('material_requests')
          .select('site_id')
          .eq('id', data.material_request_id)
          .single()

        if (request?.site_id) {
          await ensureSiteAccessible(supabase, auth, request.site_id)
        }
      }

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
          created_by: auth.userId,
        })
        .select('*')
        .single()

      if (error) {
        console.error('Error creating shipment record:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      revalidatePath('/dashboard/admin/materials')
      return { success: true, data: shipmentRecord as ShipmentRecord }
    } catch (error) {
      console.error('Error in processShipment:', error)
      return {
        success: false,
        error: resolveAdminError(error),
      }
    }
  })
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus
): Promise<AdminActionResult<ShipmentRecord>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      await ensureShipmentAccessible(supabase, auth, id)

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString().split('T')[0]
      }

      const { data: shipmentRecord, error } = await supabase
        .from('shipment_records')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error || !shipmentRecord) {
        console.error('Error updating shipment status:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (shipmentRecord.material_request_id && status === 'delivered') {
        await supabase
          .from('material_requests')
          .update({ status: 'delivered' })
          .eq('id', shipmentRecord.material_request_id)
      }

      revalidatePath('/dashboard/admin/materials')
      return { success: true, data: shipmentRecord as ShipmentRecord }
    } catch (error) {
      console.error('Error in updateShipmentStatus:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function updateShipmentInfo(
  id: string,
  updates: Partial<{
    planned_delivery_date: string
    tracking_number: string
    carrier: string
    notes: string
  }>
): Promise<AdminActionResult<ShipmentRecord>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      await ensureShipmentAccessible(supabase, auth, id)

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (updates.planned_delivery_date !== undefined)
        updateData.planned_delivery_date = updates.planned_delivery_date
      if (updates.tracking_number !== undefined)
        updateData.tracking_number = updates.tracking_number
      if (updates.carrier !== undefined) updateData.carrier = updates.carrier
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { data: shipmentRecord, error } = await supabase
        .from('shipment_records')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single()

      if (error || !shipmentRecord) {
        console.error('Error updating shipment info:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      revalidatePath('/dashboard/admin/materials')
      return { success: true, data: shipmentRecord as ShipmentRecord }
    } catch (error) {
      console.error('Error in updateShipmentInfo:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function getShipmentHistory(
  site_id?: string,
  filters?: {
    start_date?: string
    end_date?: string
    status?: string
    limit?: number
  }
): Promise<AdminActionResult<ShipmentRecord[]>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

      if (site_id) {
        await ensureSiteAccessible(supabase, auth, site_id)
      }

      if (auth.isRestricted && (!accessibleSiteIds || accessibleSiteIds.length === 0)) {
        return { success: true, data: [] }
      }

      let query = supabase
        .from('shipment_records')
        .select(
          `
          *,
          sites!inner(name, organization_id),
          material_requests(request_number, notes),
          profiles:profiles!shipment_records_created_by_fkey(full_name)
        `
        )
        .order('shipment_date', { ascending: false })

      if (site_id) {
        query = query.eq('site_id', site_id)
      } else if (accessibleSiteIds) {
        query =
          accessibleSiteIds.length > 0
            ? query.in('site_id', accessibleSiteIds)
            : query.eq('site_id', '__none__')
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
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const filteredRecords = auth.isRestricted
        ? (shipmentRecords || []).filter(
            record => record.sites?.organization_id === requireRestrictedOrgId(auth)
          )
        : shipmentRecords || []

      return { success: true, data: filteredRecords as ShipmentRecord[] }
    } catch (error) {
      console.error('Error in getShipmentHistory:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function getShipmentAnalytics(
  period: 'week' | 'month' | 'year' = 'month'
): Promise<
  AdminActionResult<Array<{ period: string; total_quantity: number; shipments: number }>>
> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

      let seriesQuery = supabase
        .from('shipment_records')
        .select('id, site_id, shipment_date, quantity_shipped')
        .order('shipment_date', { ascending: false })

      if (accessibleSiteIds) {
        if (accessibleSiteIds.length === 0) {
          return { success: true, data: [] }
        }
        seriesQuery = seriesQuery.in('site_id', accessibleSiteIds)
      }

      const { data: records, error } = await seriesQuery

      if (error) {
        console.error('Error fetching shipment analytics:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const analytics = buildAnalytics(records || [], period)
      return { success: true, data: analytics }
    } catch (error) {
      console.error('Error in getShipmentAnalytics:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function getPendingShipmentRequests(): Promise<AdminActionResult<any>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const accessibleSiteIds = await getAccessibleSiteIds(supabase, auth)

      if (auth.isRestricted && (!accessibleSiteIds || accessibleSiteIds.length === 0)) {
        return {
          success: true,
          data: {
            all: [],
            urgent: [],
            high_priority: [],
            normal: [],
            total_count: 0,
          },
        }
      }

      let query = supabase
        .from('material_requests')
        .select(
          `
          *,
          sites!inner(name, address, organization_id),
          profiles:profiles!material_requests_requested_by_fkey(full_name, email)
        `
        )
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: true })

      if (accessibleSiteIds) {
        query = query.in('site_id', accessibleSiteIds)
      }

      const { data: pendingRequests, error } = await query

      if (error) {
        console.error('Error fetching pending requests:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const filteredRequests = auth.isRestricted
        ? (pendingRequests || []).filter(
            request => request.sites?.organization_id === requireRestrictedOrgId(auth)
          )
        : pendingRequests || []

      const urgentRequests = filteredRequests.filter(request => request.priority === 'urgent')
      const highPriorityRequests = filteredRequests.filter(request => request.priority === 'high')
      const normalRequests = filteredRequests.filter(request => {
        const priority = (request.priority || 'normal') as string
        return priority === 'normal' || priority === 'low' || priority === ''
      })

      return {
        success: true,
        data: {
          all: filteredRequests,
          urgent: urgentRequests,
          high_priority: highPriorityRequests,
          normal: normalRequests,
          total_count: filteredRequests.length,
        },
      }
    } catch (error) {
      console.error('Error in getPendingShipmentRequests:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}

export async function trackDelivery(tracking_number: string): Promise<AdminActionResult<any>> {
  return withAdminAuth(async (supabase, profile) => {
    const auth = profile.auth

    try {
      const { data: shipment, error } = await supabase
        .from('shipment_records')
        .select(
          `
          *,
          sites!inner(id, name, address, organization_id),
          material_requests(request_number, notes)
        `
        )
        .eq('tracking_number', tracking_number)
        .single()

      if (error || !shipment) {
        return { success: false, error: '추적번호를 찾을 수 없습니다.' }
      }

      await ensureSiteAccessible(supabase, auth, shipment.site_id ?? shipment.sites?.id)

      const trackingInfo = {
        tracking_number: shipment.tracking_number,
        carrier: shipment.carrier,
        status: shipment.status,
        shipment_date: shipment.shipment_date,
        planned_delivery_date: shipment.planned_delivery_date,
        actual_delivery_date: shipment.actual_delivery_date,
        site_name: shipment.sites?.name,
        site_address: shipment.sites?.address,
        quantity_shipped: shipment.quantity_shipped,
        notes: shipment.notes,
      }

      return { success: true, data: trackingInfo }
    } catch (error) {
      console.error('Error in trackDelivery:', error)
      return { success: false, error: resolveAdminError(error) }
    }
  })
}
