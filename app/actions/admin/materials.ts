'use server'

import type { SupabaseClient } from '@supabase/supabase-js'
import { assertOrgAccess, type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import type { MaterialInventoryItem, MaterialRequestData } from '@/types/materials'
import type { MaterialPriorityValue } from '@/lib/materials/priorities'
import { INVENTORY_SORT_COLUMNS, type InventorySortKey } from '@/lib/admin/materials/constants'
import { hasProductionItemsTable } from '@/lib/materials/production-support'
import { withAdminAuth, AdminErrors, type AdminActionResult } from './common'

type AdminSupabaseClient = SupabaseClient<Database>

async function getSiteOrganization(
  supabase: AdminSupabaseClient,
  siteId?: string | null
): Promise<string | undefined> {
  if (!siteId) {
    return undefined
  }

  const { data, error } = await supabase
    .from('sites')
    .select('organization_id')
    .eq('id', siteId)
    .single()

  if (error || !data) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.NOT_FOUND, 404)
  }

  return data.organization_id ?? undefined
}

async function ensureSiteAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  siteId?: string | null
): Promise<void> {
  if (!auth.isRestricted || !siteId) {
    return
  }

  const organizationId = await getSiteOrganization(supabase, siteId)
  await assertOrgAccess(auth, organizationId)
}

async function filterRecordsByOrg<T>(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  records: T[],
  getSiteId: (record: T) => string | null | undefined,
  getOrgId?: (record: T) => string | null | undefined
): Promise<T[]> {
  if (!auth.isRestricted || records.length === 0) {
    return records
  }

  const siteIdsToLookup = new Set<string>()
  const orgMap = new Map<string, string | undefined>()

  for (const record of records) {
    const siteId = getSiteId(record)
    if (!siteId) continue

    const orgId = getOrgId?.(record)
    if (orgId !== undefined && orgId !== null) {
      orgMap.set(siteId, orgId ?? undefined)
    } else {
      siteIdsToLookup.add(siteId)
    }
  }

  if (siteIdsToLookup.size > 0) {
    const { data, error } = await supabase
      .from('sites')
      .select('id, organization_id')
      .in('id', Array.from(siteIdsToLookup))

    if (error) {
      throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
    }

    for (const site of data || []) {
      orgMap.set(site.id, site.organization_id ?? undefined)
    }
  }

  for (const [, organizationId] of orgMap) {
    await assertOrgAccess(auth, organizationId)
  }

  return records.filter(record => {
    const siteId = getSiteId(record)
    if (!siteId) {
      return false
    }
    return orgMap.get(siteId) === auth.restrictedOrgId
  })
}

async function ensureMaterialInventoryAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  materialIds: string[]
): Promise<void> {
  if (!auth.isRestricted || materialIds.length === 0) {
    return
  }

  const { data, error } = await supabase
    .from('material_inventory')
    .select('id, site_id')
    .in('id', materialIds)

  if (error) {
    throw new AppError('자재 재고를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = data || []
  const filtered = await filterRecordsByOrg(supabase, auth, records, record => record.site_id)

  if (filtered.length !== records.length) {
    throw new AppError('자재 재고에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureMaterialRequestAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  requestIds: string[]
): Promise<void> {
  if (!auth.isRestricted || requestIds.length === 0) {
    return
  }

  const { data, error } = await supabase
    .from('material_requests')
    .select('id, site_id')
    .in('id', requestIds)

  if (error) {
    throw new AppError('자재 요청을 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = data || []
  const filtered = await filterRecordsByOrg(supabase, auth, records, record => record.site_id)

  if (filtered.length !== records.length) {
    throw new AppError('자재 요청에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureProductionAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  productionIds: string[]
): Promise<void> {
  if (!auth.isRestricted || productionIds.length === 0) {
    return
  }

  const { data, error } = await supabase
    .from('material_productions')
    .select('id, site_id')
    .in('id', productionIds)

  if (error) {
    throw new AppError('생산 기록을 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = data || []
  const filtered = await filterRecordsByOrg(supabase, auth, records, record => record.site_id)

  if (filtered.length !== records.length) {
    throw new AppError('생산 기록에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function ensureShipmentAccess(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth,
  shipmentIds: string[]
): Promise<void> {
  if (!auth.isRestricted || shipmentIds.length === 0) {
    return
  }

  const { data, error } = await supabase
    .from('material_shipments')
    .select('id, site_id')
    .in('id', shipmentIds)

  if (error) {
    throw new AppError('출고 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = data || []
  const filtered = await filterRecordsByOrg(supabase, auth, records, record => record.site_id)

  if (filtered.length !== records.length) {
    throw new AppError('출고 정보에 접근할 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  }
}

async function getAccessibleSiteIds(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth
): Promise<string[]> {
  if (!auth.isRestricted) {
    return []
  }

  const { data, error } = await supabase
    .from('sites')
    .select('id')
    .eq('organization_id', auth.restrictedOrgId)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  return (data || []).map(site => site.id)
}

export interface MaterialWithStats extends MaterialInventoryItem {
  total_requests?: number
  recent_transactions?: number
  cost_trend?: 'up' | 'down' | 'stable'
}

export interface MaterialInventorySummary {
  total_materials: number
  tracked_sites: number
  out_of_stock_items: number
  total_stock_quantity: number
}

export interface AdminInventoryRecord extends MaterialInventoryItem {
  site_name?: string
  updated_at?: string | null
}

export interface NPC1000Summary {
  total_sites: number
  total_incoming: number
  total_used: number
  total_remaining: number
  efficiency_rate: number
  low_stock_sites: number
}

export interface MaterialProduction {
  id: string
  site_id: string
  material_id: string
  production_number: string
  produced_quantity: number
  production_date: string
  batch_number: string | null
  quality_status: 'pending' | 'approved' | 'rejected'
  quality_notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface MaterialShipment {
  id: string
  shipment_number: string
  site_id: string | null
  partner_company_id: string | null
  request_id: string | null
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  carrier: string | null
  tracking_number: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  total_amount: number
  shipment_date: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ShipmentItem {
  id: string
  shipment_id: string
  material_id: string
  quantity: number
  unit_price: number | null
  total_price: number | null
}

/**
 * Get all materials with inventory status (admin view)
 */
export async function getMaterials(
  page = 1,
  limit = 10,
  search = '',
  status?: 'normal' | 'low' | 'out_of_stock',
  site_id?: string
): Promise<AdminActionResult<{ materials: MaterialWithStats[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let query = supabase
        .from('material_inventory')
        .select(
          `
          *,
          material_requests!left(count),
          material_transactions!left(count)
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(
          `material_name.ilike.%${search}%,material_code.ilike.%${search}%,specification.ilike.%${search}%`
        )
      }

      // Apply status filter
      if (status) {
        if (status === 'low') {
          query = query.lt('current_stock', 'minimum_stock')
        } else if (status === 'out_of_stock') {
          query = query.eq('current_stock', 0)
        } else if (status === 'normal') {
          query = query.gte('current_stock', 'minimum_stock')
        }
      }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              materials: [],
              total: 0,
              pages: 0,
            },
          }
        }
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching materials:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      const materials = data || []
      const visibleMaterials = auth.isRestricted
        ? await filterRecordsByOrg(supabase, auth, materials, material => material.site_id)
        : materials

      // Transform the data to include stats
      const transformedMaterials =
        visibleMaterials.map((material: unknown) => ({
          ...material,
          total_requests: material.material_requests?.[0]?.count || 0,
          recent_transactions: material.material_transactions?.[0]?.count || 0,
          cost_trend: 'stable' as const, // TODO: Calculate based on transaction history
          status:
            material.current_stock === 0
              ? 'out_of_stock'
              : material.current_stock < (material.minimum_stock || 0)
                ? 'low'
                : 'normal',
        })) || []

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          materials: transformedMaterials,
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('Materials fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Summarize material inventory across all accessible sites/materials
 */
export async function getMaterialInventorySummary(): Promise<
  AdminActionResult<MaterialInventorySummary>
> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              total_materials: 0,
              tracked_sites: 0,
              out_of_stock_items: 0,
              total_stock_quantity: 0,
            },
          }
        }
      }

      const selectColumns = 'id, site_id, material_id, current_stock'

      let query = supabase.from('material_inventory').select(selectColumns, { count: 'exact' })

      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching material inventory summary:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const records = data || []

      const materialIds = new Set<string>()
      const siteIds = new Set<string>()
      let outOfStock = 0
      let totalStock = 0

      records.forEach(record => {
        if (record.material_id) {
          materialIds.add(record.material_id as unknown as string)
        }
        if (record.site_id) {
          siteIds.add(record.site_id as unknown as string)
        }
        const stock = Number(record.current_stock ?? 0)

        totalStock += stock
        if (stock <= 0) {
          outOfStock += 1
        }
      })

      return {
        success: true,
        data: {
          total_materials: materialIds.size,
          tracked_sites: siteIds.size,
          out_of_stock_items: outOfStock,
          total_stock_quantity: totalStock,
        },
      }
    } catch (error) {
      console.error('Material inventory summary fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * List material inventory records with optional filtering
 */
export async function getMaterialInventoryList(
  page = 1,
  limit = 10,
  search = '',
  site_id?: string,
  material_id?: string,
  sort_by?: InventorySortKey,
  sort_order?: 'asc' | 'desc'
): Promise<AdminActionResult<{ items: AdminInventoryRecord[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let query = supabase.from('material_inventory').select(
        `
          *,
          materials:materials!material_inventory_material_id_fkey(
            id,
            name,
            code,
            unit,
            specification
          ),
          sites:sites!material_inventory_site_id_fkey(
            id,
            name,
            organization_id
          )
        `,
        { count: 'exact' }
      )

      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      if (material_id) {
        query = query.eq('material_id', material_id)
      }

      const trimmedSearch = search.trim()
      if (trimmedSearch) {
        const safe = trimmedSearch.replace(/[,()]/g, ' ').trim()
        if (safe) {
          const pattern = `*${safe.replace(/\s+/g, '*')}*`
          query = query.or(
            [
              `materials.name.ilike.${pattern}`,
              `materials.code.ilike.${pattern}`,
              `sites.name.ilike.${pattern}`,
            ].join(',')
          )
        }
      }

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              items: [],
              total: 0,
              pages: 0,
            },
          }
        }
      }

      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const resolvedSort: InventorySortKey =
        sort_by && INVENTORY_SORT_COLUMNS[sort_by] ? sort_by : 'updated_at'
      const ascending = sort_order === 'asc'
      const sortConfig = INVENTORY_SORT_COLUMNS[resolvedSort]

      query = query.order(sortConfig.column, {
        ascending,
        nullsFirst: sortConfig.nullsFirst,
        foreignTable: sortConfig.foreignTable,
      })

      if (resolvedSort !== 'updated_at') {
        query = query.order('updated_at', { ascending: false, nullsFirst: true })
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching material inventory list:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      const mapped: AdminInventoryRecord[] = (data || []).map((record: any) => {
        const currentStock = Number(record.current_stock ?? 0)
        const status = currentStock <= 0 ? 'out_of_stock' : 'normal'

        return {
          id: record.id,
          site_id: record.site_id,
          material_id: record.material_id,
          material_name:
            record.material_name || record.materials?.name || record.material_code || '',
          material_code: record.material_code || record.materials?.code || '',
          specification: record.specification || record.materials?.specification || null,
          unit: record.unit || record.materials?.unit || '',
          current_stock: currentStock,
          last_purchase_date: record.last_purchase_date || null,
          last_purchase_price:
            record.last_purchase_price !== null && record.last_purchase_price !== undefined
              ? Number(record.last_purchase_price)
              : null,
          storage_location: record.storage_location || null,
          status,
          site_name: record.sites?.name || '',
          updated_at: record.updated_at || null,
        }
      })

      const total = count || 0
      const pages = Math.ceil(total / limit)

      return {
        success: true,
        data: {
          items: mapped,
          total,
          pages,
        },
      }
    } catch (error) {
      console.error('Material inventory list fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get material requests with admin oversight
 */
export async function getMaterialRequests(
  page = 1,
  limit = 10,
  search = '',
  site_id?: string,
  materialName?: string,
  priority?: MaterialPriorityValue,
  status?: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled'
): Promise<AdminActionResult<{ requests: MaterialRequestData[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, site_id)

      let query = supabase
        .from('material_requests')
        .select(
          `
          *,
          requester:profiles!material_requests_requested_by_fkey(full_name),
          approver:profiles!material_requests_approved_by_fkey(full_name),
          sites:sites!material_requests_site_id_fkey(id,name),
          material_request_items(
            id,
            material_id,
            requested_quantity,
            approved_quantity,
            notes,
            materials:materials!material_request_items_material_id_fkey(id, name, code, specification, unit)
          )
        `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`request_number.ilike.%${search}%,notes.ilike.%${search}%`)
      }

      const trimmedMaterialName = (materialName || '').trim().toLowerCase()
      const requiresMaterialFilter = trimmedMaterialName.length > 0

      if (priority) {
        query = query.eq('priority', priority)
      }
      if (status) {
        query = query.eq('status', status)
      }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted && !site_id) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              requests: [],
              total: 0,
              pages: 0,
            },
          }
        }
      }

      if (!requiresMaterialFilter) {
        const offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)
      }

      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching material requests:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR,
        }
      }

      let rows = data || []
      const visibleRequests = auth.isRestricted
        ? await filterRecordsByOrg(supabase, auth, rows, request => request.site_id)
        : rows
      rows = visibleRequests

      if (requiresMaterialFilter) {
        rows = rows.filter((request: any) => {
          const rawItems = Array.isArray(request.material_request_items)
            ? request.material_request_items
            : []
          return rawItems.some((item: any) => {
            const candidate =
              item?.materials?.name ||
              item?.materials?.code ||
              item?.material_name ||
              item?.material_code ||
              ''
            return candidate.toLowerCase().includes(trimmedMaterialName)
          })
        })
      }

      const normalizedRows =
        rows.map((request: any) => {
          const rawItems = Array.isArray(request.material_request_items)
            ? request.material_request_items
            : []
          const mappedItems = rawItems.map((item: any) => ({
            id: item.id,
            material_id: item.material_id,
            requested_quantity: item.requested_quantity,
            approved_quantity: item.approved_quantity,
            delivered_quantity: item.delivered_quantity,
            unit_price: item.unit_price,
            notes: item.notes,
            material_name: item.materials?.name || null,
            material_code: item.materials?.code || null,
            specification: item.materials?.specification || null,
            unit: item.materials?.unit || null,
          }))

          const normalizedRequestDate =
            request.request_date || request.requested_at || request.created_at || null

          return {
            ...request,
            request_date: normalizedRequestDate,
            items: mappedItems,
            material_request_items: mappedItems,
          }
        }) || []

      const total = requiresMaterialFilter ? normalizedRows.length : count || 0
      const pages = Math.ceil(total / limit)
      const pagedRows =
        requiresMaterialFilter && normalizedRows.length > 0
          ? normalizedRows.slice((page - 1) * limit, (page - 1) * limit + limit)
          : normalizedRows

      return {
        success: true,
        data: {
          requests: pagedRows,
          total,
          pages,
        },
      }
    } catch (error) {
      console.error('Material requests fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Process material request approvals (bulk operation)
 */
export async function processMaterialRequestApprovals(
  requestIds: string[],
  action: 'approve' | 'reject',
  comments?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureMaterialRequestAccess(supabase, auth, requestIds)

      const status = action === 'approve' ? 'approved' : 'cancelled'

      const { error } = await supabase
        .from('material_requests')
        .update({
          status,
          approved_by: action === 'approve' ? profile.id : null,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          notes: comments
            ? comments + (status === 'cancelled' ? ' (관리자 거부)' : ' (관리자 승인)')
            : null,
        })
        .in('id', requestIds)

      if (error) {
        console.error('Error processing material request approvals:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const actionText = action === 'approve' ? '승인' : '거부'
      return {
        success: true,
        message: `${requestIds.length}개 자재 요청이 ${actionText}되었습니다.`,
      }
    } catch (error) {
      console.error('Material request approval processing error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get NPC-1000 usage summary across all sites
 */
export async function getNPC1000Summary(): Promise<AdminActionResult<NPC1000Summary>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Get latest NPC-1000 data from daily reports
      const { data: npcData, error } = await supabase
        .from('daily_reports')
        .select(
          `
          site_id,
          npc1000_incoming,
          npc1000_used,
          npc1000_remaining,
          work_date,
          sites(name, organization_id)
        `
        )
        .not('npc1000_remaining', 'is', null)
        .not('site_id', 'is', null)
        .order('work_date', { ascending: false })

      if (error) {
        console.error('Error fetching NPC-1000 data:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const accessibleNpcData = npcData
        ? await filterRecordsByOrg(
            supabase,
            auth,
            npcData,
            item => item.site_id,
            item => item.sites?.organization_id ?? undefined
          )
        : []

      // Calculate summary stats
      const siteData = new Map<string, any>()

      // Get latest data per site
      accessibleNpcData.forEach((item: unknown) => {
        if (!siteData.has(item.site_id)) {
          siteData.set(item.site_id, item)
        }
      })

      const sites = Array.from(siteData.values())
      const totalIncoming = sites.reduce((sum, site) => sum + (site.npc1000_incoming || 0), 0)
      const totalUsed = sites.reduce((sum, site) => sum + (site.npc1000_used || 0), 0)
      const totalRemaining = sites.reduce((sum, site) => sum + (site.npc1000_remaining || 0), 0)
      const efficiencyRate = totalIncoming > 0 ? (totalUsed / totalIncoming) * 100 : 0
      const lowStockSites = sites.filter(site => (site.npc1000_remaining || 0) < 50).length

      const summary: NPC1000Summary = {
        total_sites: sites.length,
        total_incoming: totalIncoming,
        total_used: totalUsed,
        total_remaining: totalRemaining,
        efficiency_rate: Math.round(efficiencyRate * 100) / 100,
        low_stock_sites: lowStockSites,
      }

      return {
        success: true,
        data: summary,
      }
    } catch (error) {
      console.error('NPC-1000 summary fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get detailed NPC-1000 data by site
 */
export async function getNPC1000BySite(
  page = 1,
  limit = 10,
  search = ''
): Promise<
  AdminActionResult<{
    sites: Array<{
      site_id: string
      site_name: string
      latest_date: string
      incoming: number
      used: number
      remaining: number
      efficiency: number
      status: 'normal' | 'low' | 'critical'
    }>
    total: number
    pages: number
  }>
> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      // Get latest NPC-1000 data grouped by site
      const { data: npcData, error } = await supabase.rpc('get_latest_npc1000_by_site')

      if (error) {
        console.error('Error fetching NPC-1000 by site:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const accessibleData = npcData
        ? await filterRecordsByOrg(supabase, auth, npcData, item => item.site_id)
        : []

      let filteredData = accessibleData

      // Apply search filter
      if (search.trim()) {
        filteredData = filteredData.filter((item: unknown) =>
          item.site_name.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Transform and add status
      const transformedData = filteredData.map((item: unknown) => ({
        ...item,
        efficiency: item.incoming > 0 ? Math.round((item.used / item.incoming) * 10000) / 100 : 0,
        status: item.remaining < 20 ? 'critical' : item.remaining < 50 ? 'low' : 'normal',
      }))

      // Apply pagination
      const total = transformedData.length
      const totalPages = Math.ceil(total / limit)
      const offset = (page - 1) * limit
      const paginatedData = transformedData.slice(offset, offset + limit)

      return {
        success: true,
        data: {
          sites: paginatedData,
          total,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('NPC-1000 by site fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update material inventory (bulk stock adjustment)
 */
export async function updateMaterialInventory(
  materialIds: string[],
  adjustments: { [materialId: string]: { quantity: number; notes?: string } }
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureMaterialInventoryAccess(supabase, auth, materialIds)

      const updates = []
      const transactions = []

      for (const materialId of materialIds) {
        const adjustment = adjustments[materialId]
        if (!adjustment) continue

        updates.push({
          id: materialId,
          current_stock: adjustment.quantity,
          updated_at: new Date().toISOString(),
        })

        transactions.push({
          material_id: materialId,
          transaction_type: 'adjustment',
          quantity: adjustment.quantity,
          transaction_date: new Date().toISOString(),
          notes: adjustment.notes || '관리자 재고 조정',
          created_by: profile.id,
        })
      }

      // Update inventory levels
      for (const update of updates) {
        const { error } = await supabase
          .from('material_inventory')
          .update(update)
          .eq('id', update.id)

        if (error) {
          console.error('Error updating material inventory:', error)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }
      }

      // Record transactions
      if (transactions.length > 0) {
        const { error: transactionError } = await supabase
          .from('material_transactions')
          .insert(transactions)

        if (transactionError) {
          console.error('Error recording material transactions:', transactionError)
          // Don't fail the entire operation for transaction logging issues
        }
      }

      return {
        success: true,
        message: `${materialIds.length}개 자재의 재고가 조정되었습니다.`,
      }
    } catch (error) {
      console.error('Material inventory update error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get material production records
 */
export async function getMaterialProductions(
  page = 1,
  limit = 10,
  siteId?: string,
  status?: 'pending' | 'approved' | 'rejected',
  startDate?: string,
  endDate?: string
): Promise<AdminActionResult<{ productions: MaterialProduction[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, siteId)

      const supportsProductionItems = await hasProductionItemsTable(supabase)
      const selectColumns = ['*', 'sites!site_id(name)', 'materials!material_id(name, code)']

      if (supportsProductionItems) {
        selectColumns.push(`
          material_production_items(
            id,
            produced_quantity,
            order_quantity,
            notes,
            materials:materials!material_production_items_material_id_fkey(name, code, unit)
          )
        `)
      }

      let query = supabase
        .from('material_productions')
        .select(selectColumns.join(',\n'), { count: 'exact' })
        .order('production_date', { ascending: false })

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      if (status) {
        query = query.eq('quality_status', status)
      }

      if (startDate) {
        query = query.gte('production_date', startDate)
      }

      if (endDate) {
        query = query.lte('production_date', endDate)
      }

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted && !siteId) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              productions: [],
              total: 0,
              pages: 0,
            },
          }
        }
      }

      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching productions:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const productions = data || []
      const visibleProductions = auth.isRestricted
        ? await filterRecordsByOrg(supabase, auth, productions, production => production.site_id)
        : productions

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          productions: visibleProductions,
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('Productions fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Create material production record
 */
export async function createMaterialProduction(
  productionData: Omit<MaterialProduction, 'id' | 'created_at' | 'updated_at' | 'created_by'>
): Promise<AdminActionResult<MaterialProduction>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, productionData.site_id)

      const { data: production, error } = await supabase
        .from('material_productions')
        .insert({
          ...productionData,
          created_by: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating production:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: production,
        message: '생산 기록이 생성되었습니다.',
      }
    } catch (error) {
      console.error('Production creation error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update production quality status
 */
export async function updateProductionQuality(
  productionId: string,
  qualityStatus: 'approved' | 'rejected',
  qualityNotes?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureProductionAccess(supabase, auth, [productionId])

      const { error } = await supabase
        .from('material_productions')
        .update({
          quality_status: qualityStatus,
          quality_notes: qualityNotes,
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', productionId)

      if (error) {
        console.error('Error updating production quality:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `생산품질이 ${qualityStatus === 'approved' ? '승인' : '거절'}되었습니다.`,
      }
    } catch (error) {
      console.error('Production quality update error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Get material shipments
 */
export async function getMaterialShipments(
  page = 1,
  limit = 10,
  siteId?: string,
  status?: 'preparing' | 'shipped' | 'delivered' | 'cancelled',
  startDate?: string,
  endDate?: string
): Promise<AdminActionResult<{ shipments: MaterialShipment[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, siteId)

      let query = supabase
        .from('material_shipments')
        .select(
          `
          *,
          sites!site_id(name),
          creator:profiles!created_by(name),
          billing_method:payment_methods!material_shipments_billing_method_id_fkey(name),
          shipping_method:payment_methods!material_shipments_shipping_method_id_fkey(name),
          freight_method:payment_methods!material_shipments_freight_charge_method_id_fkey(name),
          shipment_items(
            id,
            material_id,
            quantity,
            unit_price,
            total_price,
            materials(name, code, unit)
          ),
          payments:material_payments(amount)
        `,
          { count: 'exact' }
        )
        .order('shipment_date', { ascending: false })

      if (siteId) {
        query = query.eq('site_id', siteId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (startDate) {
        query = query.gte('shipment_date', startDate)
      }

      if (endDate) {
        query = query.lte('shipment_date', endDate)
      }

      let restrictedSiteIds: string[] | null = null
      if (auth.isRestricted && !siteId) {
        restrictedSiteIds = await getAccessibleSiteIds(supabase, auth)

        if (restrictedSiteIds.length === 0) {
          return {
            success: true,
            data: {
              shipments: [],
              total: 0,
              pages: 0,
            },
          }
        }
      }

      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      if (restrictedSiteIds) {
        query = query.in('site_id', restrictedSiteIds)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching shipments:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const shipments = data || []
      const visibleShipments = auth.isRestricted
        ? await filterRecordsByOrg(supabase, auth, shipments, shipment => shipment.site_id)
        : shipments

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          shipments: visibleShipments,
          total: count || 0,
          pages: totalPages,
        },
      }
    } catch (error) {
      console.error('Shipments fetch error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Create material shipment
 */
export async function createMaterialShipment(
  shipmentData: Omit<
    MaterialShipment,
    'id' | 'created_at' | 'updated_at' | 'created_by' | 'shipment_number'
  >,
  items: Omit<ShipmentItem, 'id' | 'shipment_id'>[]
): Promise<AdminActionResult<MaterialShipment>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureSiteAccess(supabase, auth, shipmentData.site_id)

      // Generate shipment number
      const shipmentNumber = `SH${Date.now()}`

      const { data: shipment, error: shipmentError } = await supabase
        .from('material_shipments')
        .insert({
          ...shipmentData,
          shipment_number: shipmentNumber,
          created_by: profile.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (shipmentError) {
        console.error('Error creating shipment:', shipmentError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Create shipment items
      if (items.length > 0) {
        const { error: itemsError } = await supabase.from('shipment_items').insert(
          items.map(item => ({
            ...item,
            shipment_id: shipment.id,
          }))
        )

        if (itemsError) {
          console.error('Error creating shipment items:', itemsError)
          return { success: false, error: AdminErrors.DATABASE_ERROR }
        }
      }

      return {
        success: true,
        data: shipment,
        message: '출고가 생성되었습니다.',
      }
    } catch (error) {
      console.error('Shipment creation error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(
  shipmentId: string,
  status: 'preparing' | 'shipped' | 'delivered' | 'cancelled',
  trackingNumber?: string,
  actualDelivery?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureShipmentAccess(supabase, auth, [shipmentId])

      const updateData: unknown = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (trackingNumber) {
        updateData.tracking_number = trackingNumber
      }

      if (actualDelivery) {
        updateData.actual_delivery = actualDelivery
      }

      const { error } = await supabase
        .from('material_shipments')
        .update(updateData)
        .eq('id', shipmentId)

      if (error) {
        console.error('Error updating shipment status:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `출고 상태가 ${status}로 업데이트되었습니다.`,
      }
    } catch (error) {
      console.error('Shipment status update error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Update shipment delivery method (carrier)
 */
export async function updateShipmentDeliveryMethod(
  shipmentId: string,
  deliveryMethod: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth
      await ensureShipmentAccess(supabase, auth, [shipmentId])

      const normalized = (() => {
        const raw = String(deliveryMethod || '').toLowerCase()
        if (raw === '택배' || raw === 'courier') return 'courier'
        if (raw === '화물' || raw === 'freight' || raw === 'cargo') return 'freight'
        return raw || 'other'
      })()

      const { error } = await supabase
        .from('material_shipments')
        .update({ carrier: normalized, updated_at: new Date().toISOString() })
        .eq('id', shipmentId)

      if (error) {
        console.error('Error updating shipment delivery method:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return { success: true }
    } catch (error) {
      console.error('Shipment delivery method update error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}

/**
 * Process material request (approve/reject with quantity adjustments)
 */
export async function processMaterialRequest(
  requestId: string,
  action: 'approved' | 'rejected',
  approvedQuantity?: number,
  rejectionReason?: string,
  notes?: string
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth

      await ensureMaterialRequestAccess(supabase, auth, [requestId])

      const updateData: unknown = {
        status: action,
        approved_by: profile.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (action === 'approved' && approvedQuantity !== undefined) {
        updateData.approved_quantity = approvedQuantity
      }

      if (action === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      if (notes) {
        updateData.notes = notes
      }

      const { error } = await supabase
        .from('material_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) {
        console.error('Error processing material request:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        message: `자재 요청이 ${action === 'approved' ? '승인' : '거절'}되었습니다.`,
      }
    } catch (error) {
      console.error('Material request processing error:', error)
      return {
        success: false,
        error: error instanceof AppError ? error.message : AdminErrors.UNKNOWN_ERROR,
      }
    }
  })
}
