'use server'

import { withAdminAuth, AdminActionResult, AdminErrors, validateRequired } from './common'
import { MaterialInventoryItem, MaterialRequestData, MaterialTransactionData, NPC1000Data } from '@/types'

export interface MaterialWithStats extends MaterialInventoryItem {
  total_requests?: number
  recent_transactions?: number
  cost_trend?: 'up' | 'down' | 'stable'
}

export interface NPC1000Summary {
  total_sites: number
  total_incoming: number
  total_used: number
  total_remaining: number
  efficiency_rate: number
  low_stock_sites: number
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
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('material_inventory')
        .select(`
          *,
          material_requests!left(count),
          material_transactions!left(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`material_name.ilike.%${search}%,material_code.ilike.%${search}%,specification.ilike.%${search}%`)
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

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: materials, error, count } = await query

      if (error) {
        console.error('Error fetching materials:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      // Transform the data to include stats
      const transformedMaterials = materials?.map((material: any) => ({
        ...material,
        total_requests: material.material_requests?.[0]?.count || 0,
        recent_transactions: material.material_transactions?.[0]?.count || 0,
        cost_trend: 'stable' as const, // TODO: Calculate based on transaction history
        status: material.current_stock === 0 ? 'out_of_stock' :
                material.current_stock < (material.minimum_stock || 0) ? 'low' : 'normal'
      })) || []

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          materials: transformedMaterials,
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Materials fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
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
  status?: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled',
  site_id?: string
): Promise<AdminActionResult<{ requests: MaterialRequestData[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      let query = supabase
        .from('material_requests')
        .select(`
          *,
          requester:profiles!material_requests_requested_by_fkey(full_name),
          approver:profiles!material_requests_approved_by_fkey(full_name),
          material_request_items(
            id,
            material_id,
            material_name,
            material_code,
            specification,
            unit,
            requested_quantity,
            approved_quantity,
            unit_price,
            total_price,
            supplier_name,
            notes
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`request_number.ilike.%${search}%,notes.ilike.%${search}%`)
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply site filter
      if (site_id) {
        query = query.eq('site_id', site_id)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: requests, error, count } = await query

      if (error) {
        console.error('Error fetching material requests:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      const transformedRequests = requests?.map((request: any) => ({
        ...request,
        items: request.material_request_items || []
      })) || []

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          requests: transformedRequests,
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Material requests fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
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
      const status = action === 'approve' ? 'approved' : 'cancelled'

      const { error } = await supabase
        .from('material_requests')
        .update({
          status,
          approved_by: action === 'approve' ? profile.id : null,
          approved_at: action === 'approve' ? new Date().toISOString() : null,
          notes: comments ? (comments + (status === 'cancelled' ? ' (관리자 거부)' : ' (관리자 승인)')) : null
        })
        .in('id', requestIds)

      if (error) {
        console.error('Error processing material request approvals:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const actionText = action === 'approve' ? '승인' : '거부'
      return {
        success: true,
        message: `${requestIds.length}개 자재 요청이 ${actionText}되었습니다.`
      }
    } catch (error) {
      console.error('Material request approval processing error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get NPC-1000 usage summary across all sites
 */
export async function getNPC1000Summary(): Promise<AdminActionResult<NPC1000Summary>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Get latest NPC-1000 data from daily reports
      const { data: npcData, error } = await supabase
        .from('daily_reports')
        .select(`
          site_id,
          npc1000_incoming,
          npc1000_used,
          npc1000_remaining,
          work_date,
          sites(name)
        `)
        .not('npc1000_remaining', 'is', null)
        .not('site_id', 'is', null)
        .order('work_date', { ascending: false })

      if (error) {
        console.error('Error fetching NPC-1000 data:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Calculate summary stats
      const siteData = new Map<string, any>()
      
      // Get latest data per site
      npcData?.forEach((item: any) => {
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
        low_stock_sites: lowStockSites
      }

      return {
        success: true,
        data: summary
      }
    } catch (error) {
      console.error('NPC-1000 summary fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
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
): Promise<AdminActionResult<{ sites: Array<{ 
  site_id: string; 
  site_name: string; 
  latest_date: string;
  incoming: number; 
  used: number; 
  remaining: number;
  efficiency: number;
  status: 'normal' | 'low' | 'critical';
}>; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Get latest NPC-1000 data grouped by site
      const { data: npcData, error } = await supabase
        .rpc('get_latest_npc1000_by_site')

      if (error) {
        console.error('Error fetching NPC-1000 by site:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      let filteredData = npcData || []

      // Apply search filter
      if (search.trim()) {
        filteredData = filteredData.filter((item: any) => 
          item.site_name.toLowerCase().includes(search.toLowerCase())
        )
      }

      // Transform and add status
      const transformedData = filteredData.map((item: any) => ({
        ...item,
        efficiency: item.incoming > 0 ? Math.round((item.used / item.incoming) * 10000) / 100 : 0,
        status: item.remaining < 20 ? 'critical' : item.remaining < 50 ? 'low' : 'normal'
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
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('NPC-1000 by site fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
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
      const updates = []
      const transactions = []

      for (const materialId of materialIds) {
        const adjustment = adjustments[materialId]
        if (!adjustment) continue

        updates.push({
          id: materialId,
          current_stock: adjustment.quantity,
          updated_at: new Date().toISOString()
        })

        transactions.push({
          material_id: materialId,
          transaction_type: 'adjustment',
          quantity: adjustment.quantity,
          transaction_date: new Date().toISOString(),
          notes: adjustment.notes || '관리자 재고 조정',
          created_by: profile.id
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
        message: `${materialIds.length}개 자재의 재고가 조정되었습니다.`
      }
    } catch (error) {
      console.error('Material inventory update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}