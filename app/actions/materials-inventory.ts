'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

type Success<T> = { success: true; data: T }
type Failure = { success: false; error: string; data?: null }

export async function getMaterialsData(params: {
  siteId: string
  materialId?: string
  code?: string
  codeLike?: string
  limit?: number
}): Promise<Success<{ inventory: any[]; transactions: any[] }> | Failure> {
  try {
    const supabase = await createClient()

    // Build inventory query
    let inventoryQuery = supabase
      .from('material_inventory')
      .select(
        `
        current_stock,
        reserved_stock,
        available_stock,
        last_updated,
        materials!inner(
          id,
          code,
          name,
          unit,
          unit_price
        )
      `
      )
      .eq('site_id', params.siteId)

    if (params.materialId) {
      inventoryQuery = inventoryQuery.eq('material_id', params.materialId)
    } else if (params.code) {
      inventoryQuery = inventoryQuery.eq('materials.code', params.code)
    } else if (params.codeLike) {
      inventoryQuery = inventoryQuery.like('materials.code', params.codeLike)
    }

    const { data: inventoryData, error: inventoryError } = await inventoryQuery

    if (inventoryError) {
      console.error('[getMaterialsData] Inventory query error:', inventoryError)
      return { success: false, error: inventoryError.message }
    }

    // Build transactions query
    let txQuery = supabase
      .from('material_transactions')
      .select(
        `
        transaction_type,
        quantity,
        transaction_date,
        created_at,
        notes,
        materials!inner(
          id,
          code,
          name
        )
      `
      )
      .eq('site_id', params.siteId)
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 100)

    if (params.materialId) {
      txQuery = txQuery.eq('material_id', params.materialId)
    } else if (params.code) {
      txQuery = txQuery.eq('materials.code', params.code)
    } else if (params.codeLike) {
      txQuery = txQuery.like('materials.code', params.codeLike)
    }

    const { data: transactions, error: transactionsError } = await txQuery

    if (transactionsError) {
      console.error('[getMaterialsData] Transactions query error:', transactionsError)
      // Keep returning inventory while logging error for transactions
    }

    return {
      success: true,
      data: {
        inventory: inventoryData || [],
        transactions: transactions || [],
      },
    }
  } catch (error) {
    console.error('[getMaterialsData] Server error:', error)
    return { success: false, error: 'Server error', data: null }
  }
}

export async function getSitesForMaterials() {
  try {
    const supabase = await createClient()
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      return { success: false, error: 'Authentication required', data: [] }
    }

    const { data: userSites, error } = await supabase
      .from('user_sites')
      .select(
        `
        site_id,
        sites!inner(
          id,
          name,
          status
        )
      `
      )
      .eq('user_id', auth.userId)
      .eq('sites.status', 'active')

    if (error) {
      console.error('[getSitesForMaterials] Sites query error:', error)
      return { success: false, error: error.message, data: [] }
    }

    const sites =
      userSites?.map((us: any) => ({
        id: us.sites?.id || us.site_id,
        name: us.sites?.name || 'Unknown Site',
      })) || []

    return { success: true, data: sites }
  } catch (error) {
    console.error('[getSitesForMaterials] Server error:', error)
    return { success: false, error: 'Server error', data: [] }
  }
}

export async function createMaterialRequest(params: {
  siteId: string
  materialId?: string
  materialCode?: string
  qty: number
  requestDate?: string
  unitId?: string
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const auth = await getAuthForClient(supabase)
    if (!auth) return { success: false, error: 'Authentication required' }

    let materialId = params.materialId
    if (!materialId && params.materialCode) {
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .select('id')
        .eq('code', params.materialCode)
        .single()
      if (materialError || !material) {
        return { success: false, error: 'Material not found' }
      }
      materialId = material.id
    }

    if (!materialId) return { success: false, error: 'Material is required' }

    const timestamp = Date.now().toString().slice(-6)
    const request_number = `MR-${new Date().getFullYear()}-${timestamp}`

    const { data: request, error } = await supabase
      .from('material_requests')
      .insert({
        request_number,
        site_id: params.siteId,
        requested_by: auth.userId,
        status: 'pending',
        notes: params.notes,
        requested_at: params.requestDate
          ? new Date(params.requestDate).toISOString()
          : new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[createMaterialRequest] Create request error:', error)
      return { success: false, error: error.message }
    }

    const { error: itemError } = await supabase.from('material_request_items').insert({
      request_id: request.id,
      material_id: materialId,
      requested_quantity: params.qty,
      unit_id: params.unitId ?? null,
      notes: params.notes,
    })

    if (itemError) {
      console.error('[createMaterialRequest] Create request item error:', itemError)
      return { success: false, error: itemError.message }
    }

    return { success: true, data: request }
  } catch (error) {
    console.error('[createMaterialRequest] Server error:', error)
    return { success: false, error: 'Server error' }
  }
}

export async function recordInventoryTransaction(params: {
  siteId: string
  materialId?: string
  materialCode?: string
  transactionType: 'in' | 'out'
  quantity: number
  transactionDate: string
  notes?: string
}) {
  try {
    const supabase = await createClient()
    const auth = await getAuthForClient(supabase)
    if (!auth) return { success: false, error: 'Authentication required' }

    let materialId = params.materialId
    if (!materialId && params.materialCode) {
      const { data: material, error: materialError } = await supabase
        .from('materials')
        .select('id')
        .eq('code', params.materialCode)
        .single()
      if (materialError || !material) {
        return { success: false, error: `Material not found: ${params.materialCode}` }
      }
      materialId = material.id
    }

    if (!materialId) return { success: false, error: 'Material is required' }

    const transactionData = {
      site_id: params.siteId,
      material_id: materialId,
      transaction_type: params.transactionType,
      quantity: params.quantity,
      transaction_date: new Date(params.transactionDate).toISOString().split('T')[0],
      notes: params.notes,
      created_by: auth.userId,
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('material_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('[recordInventoryTransaction] Insert error:', transactionError)
      return { success: false, error: transactionError.message }
    }

    // Update inventory row
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('current_stock')
      .eq('site_id', params.siteId)
      .eq('material_id', materialId)
      .single()

    if (inventoryError && (inventoryError as any).code === 'PGRST116') {
      // Row not found → create
      const { error: createError } = await supabase.from('material_inventory').insert({
        site_id: params.siteId,
        material_id: materialId,
        current_stock: params.transactionType === 'in' ? params.quantity : 0,
        reserved_stock: 0,
        last_updated: new Date().toISOString(),
      })
      if (createError) {
        console.error('[recordInventoryTransaction] Create inventory error:', createError)
        return { success: false, error: createError.message }
      }
    } else if (inventoryError) {
      console.error('[recordInventoryTransaction] Inventory select error:', inventoryError)
      return { success: false, error: inventoryError.message }
    } else {
      const current = parseFloat((inventory as any).current_stock) || 0
      const next =
        params.transactionType === 'in'
          ? current + params.quantity
          : Math.max(0, current - params.quantity)
      const { error: updateError } = await supabase
        .from('material_inventory')
        .update({ current_stock: next, last_updated: new Date().toISOString() })
        .eq('site_id', params.siteId)
        .eq('material_id', materialId)
      if (updateError) {
        console.error('[recordInventoryTransaction] Inventory update error:', updateError)
        return { success: false, error: updateError.message }
      }
    }

    return { success: true, data: transaction }
  } catch (error) {
    console.error('[recordInventoryTransaction] Server error:', error)
    return { success: false, error: 'Server error' }
  }
}
