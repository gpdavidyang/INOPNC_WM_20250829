'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthForClient } from '@/lib/auth/ultra-simple'

export async function getNPCMaterialsData(siteId: string) {
  try {
    // console.log('[getNPCMaterialsData] Called with siteId:', siteId)

    const supabase = await createClient()

    // Get NPC materials and their inventory for this site
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('material_inventory')
      .select(
        `
        current_stock,
        reserved_stock,
        available_stock,
        last_updated,
        materials!inner(
          code,
          name,
          unit,
          unit_price
        )
      `
      )
      .eq('site_id', siteId)
      .like('materials.code', 'NPC-%')

    if (inventoryError) {
      console.error('[getNPCMaterialsData] Inventory query error:', inventoryError)
      return { success: false, error: inventoryError.message, data: null }
    }

    // console.log('[getNPCMaterialsData] Inventory data:', inventoryData)

    // Get material transactions for this site and NPC materials
    const { data: transactions, error: transactionsError } = await supabase
      .from('material_transactions')
      .select(
        `
        transaction_type,
        quantity,
        created_at,
        materials!inner(
          code,
          name
        )
      `
      )
      .eq('site_id', siteId)
      .like('materials.code', 'NPC-%')
      .order('created_at', { ascending: false })
      .limit(100)

    if (transactionsError) {
      console.error('[getNPCMaterialsData] Transactions query error:', transactionsError)
    }

    // console.log('[getNPCMaterialsData] Transactions data:', transactions)

    return {
      success: true,
      data: {
        inventory: inventoryData || [],
        transactions: transactions || [],
      },
    }
  } catch (error) {
    console.error('Error fetching NPC materials data:', error)
    return { success: false, error: 'Server error', data: null }
  }
}

export async function getSitesForMaterials() {
  try {
    // console.log('[getSitesForMaterials] Called')

    const supabase = await createClient()

    // Get current user
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      console.error('[getSitesForMaterials] User not authenticated')
      return { success: false, error: 'Authentication required', data: [] }
    }

    // console.log('[getSitesForMaterials] User ID:', auth.userId)

    // Get sites assigned to the user
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

    // console.log('[getSitesForMaterials] User sites data:', userSites)

    // Transform data to expected format
    const sites =
      userSites?.map((us: unknown) => ({
        id: us.sites?.id || us.site_id,
        name: us.sites?.name || 'Unknown Site',
      })) || []

    // console.log('[getSitesForMaterials] Transformed sites:', sites)

    return { success: true, data: sites }
  } catch (error) {
    console.error('Error fetching sites:', error)
    return { success: false, error: 'Server error', data: [] }
  }
}

export async function createMaterialRequest(data: {
  siteId: string
  materialCode: string
  requestedQuantity: number
  requestDate: string
  notes?: string
}) {
  try {
    const supabase = await createClient()

    // Get user info
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      return { success: false, error: 'Authentication required' }
    }

    // Get material ID from code
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id')
      .eq('code', data.materialCode)
      .single()

    if (materialError || !material) {
      console.error('Error finding material:', materialError)
      return { success: false, error: 'Material not found' }
    }

    // Generate request number
    const timestamp = Date.now().toString().slice(-6)
    const request_number = `MR-${new Date().getFullYear()}-${timestamp}`

    // Create material request
    const { data: request, error } = await supabase
      .from('material_requests')
      .insert({
        request_number,
        site_id: data.siteId,
        requested_by: auth.userId,
        status: 'pending',
        notes: data.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating material request:', error)
      return { success: false, error: error.message }
    }

    // Create material request item
    const { error: itemError } = await supabase.from('material_request_items').insert({
      request_id: request.id,
      material_id: material.id,
      requested_quantity: data.requestedQuantity,
      notes: data.notes,
    })

    if (itemError) {
      console.error('Error creating material request item:', itemError)
      return { success: false, error: itemError.message }
    }

    return { success: true, data: request }
  } catch (error) {
    console.error('Error in createMaterialRequest:', error)
    return { success: false, error: 'Server error' }
  }
}

export async function recordInventoryTransaction(data: {
  siteId: string
  materialCode: string
  transactionType: 'in' | 'out'
  quantity: number
  transactionDate: string
  notes?: string
}) {
  try {
    console.log('[recordInventoryTransaction] Input data:', data)

    const supabase = await createClient()

    // Get user info
    const auth = await getAuthForClient(supabase)
    if (!auth) {
      console.error('[recordInventoryTransaction] Authentication error: missing auth context')
      return { success: false, error: 'Authentication required' }
    }

    console.log('[recordInventoryTransaction] User ID:', auth.userId)

    // Get material ID from code
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id')
      .eq('code', data.materialCode)
      .single()

    if (materialError || !material) {
      console.error('[recordInventoryTransaction] Material error:', materialError)
      return { success: false, error: `Material not found: ${data.materialCode}` }
    }

    console.log('[recordInventoryTransaction] Material ID:', material.id)

    // Create transaction
    const transactionData = {
      site_id: data.siteId,
      material_id: material.id,
      transaction_type: data.transactionType,
      quantity: data.quantity,
      transaction_date: new Date(data.transactionDate).toISOString().split('T')[0], // Ensure proper date format
      notes: data.notes,
      created_by: auth.userId,
    }

    console.log('[recordInventoryTransaction] Transaction data:', transactionData)

    const { data: transaction, error: transactionError } = await supabase
      .from('material_transactions')
      .insert(transactionData)
      .select()
      .single()

    if (transactionError) {
      console.error('[recordInventoryTransaction] Transaction error:', transactionError)
      return { success: false, error: transactionError.message }
    }

    console.log('[recordInventoryTransaction] Transaction created:', transaction.id)

    // Update inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('current_stock')
      .eq('site_id', data.siteId)
      .eq('material_id', material.id)
      .single()

    console.log('[recordInventoryTransaction] Existing inventory:', inventory, inventoryError)

    if (inventoryError && inventoryError.code === 'PGRST116') {
      // Create new inventory record if doesn't exist (PGRST116 = no rows returned)
      const newInventoryData = {
        site_id: data.siteId,
        material_id: material.id,
        current_stock: data.transactionType === 'in' ? data.quantity : 0,
        reserved_stock: 0,
        last_updated: new Date().toISOString(),
      }

      console.log('[recordInventoryTransaction] Creating new inventory:', newInventoryData)

      const { error: createError } = await supabase
        .from('material_inventory')
        .insert(newInventoryData)

      if (createError) {
        console.error('[recordInventoryTransaction] Create inventory error:', createError)
        return { success: false, error: createError.message }
      }
    } else if (inventoryError) {
      // Other types of inventory errors
      console.error('[recordInventoryTransaction] Inventory query error:', inventoryError)
      return { success: false, error: inventoryError.message }
    } else {
      // Update existing inventory
      const currentStockValue = parseFloat(inventory.current_stock) || 0
      const newStock =
        data.transactionType === 'in'
          ? currentStockValue + data.quantity
          : Math.max(0, currentStockValue - data.quantity)

      console.log(
        '[recordInventoryTransaction] Updating inventory, current:',
        currentStockValue,
        'new:',
        newStock
      )

      const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
          current_stock: newStock,
          last_updated: new Date().toISOString(),
        })
        .eq('site_id', data.siteId)
        .eq('material_id', material.id)

      if (updateError) {
        console.error('[recordInventoryTransaction] Update inventory error:', updateError)
        return { success: false, error: updateError.message }
      }
    }

    return { success: true, data: transaction }
  } catch (error) {
    console.error('Error in recordInventoryTransaction:', error)
    return { success: false, error: 'Server error' }
  }
}
