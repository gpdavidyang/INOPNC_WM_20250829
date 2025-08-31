'use server'

import { createClient } from '@/lib/supabase/server'

export async function getNPCMaterialsData(siteId: string) {
  try {
    console.log('[getNPCMaterialsData] Called with siteId:', siteId)
    
    const supabase = await createClient()
    
    // Get NPC materials and their inventory for this site
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('material_inventory')
      .select(`
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
      `)
      .eq('site_id', siteId)
      .like('materials.code', 'NPC-%')
    
    if (inventoryError) {
      console.error('[getNPCMaterialsData] Inventory query error:', inventoryError)
      return { success: false, error: inventoryError.message, data: null }
    }
    
    console.log('[getNPCMaterialsData] Inventory data:', inventoryData)
    
    // Get material transactions for this site and NPC materials
    const { data: transactions, error: transactionsError } = await supabase
      .from('material_transactions')
      .select(`
        transaction_type,
        quantity,
        created_at,
        materials!inner(
          code,
          name
        )
      `)
      .eq('site_id', siteId)
      .like('materials.code', 'NPC-%')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (transactionsError) {
      console.error('[getNPCMaterialsData] Transactions query error:', transactionsError)
    }
    
    console.log('[getNPCMaterialsData] Transactions data:', transactions)
    
    return { 
      success: true, 
      data: {
        inventory: inventoryData || [],
        transactions: transactions || []
      }
    }
    
  } catch (error) {
    console.error('Error fetching NPC materials data:', error)
    return { success: false, error: 'Server error', data: null }
  }
}

export async function getSitesForMaterials() {
  try {
    console.log('[getSitesForMaterials] Called')
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[getSitesForMaterials] User not authenticated:', userError)
      return { success: false, error: 'Authentication required', data: [] }
    }
    
    console.log('[getSitesForMaterials] User ID:', user.id)
    
    // Get sites assigned to the user
    const { data: userSites, error } = await supabase
      .from('user_sites')
      .select(`
        site_id,
        sites!inner(
          id,
          name,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('sites.status', 'active')
    
    if (error) {
      console.error('[getSitesForMaterials] Sites query error:', error)
      return { success: false, error: error.message, data: [] }
    }
    
    console.log('[getSitesForMaterials] User sites data:', userSites)
    
    // Transform data to expected format
    const sites = userSites?.map((us: any) => ({
      id: us.sites?.id || us.site_id,
      name: us.sites?.name || 'Unknown Site'
    })) || []
    
    console.log('[getSitesForMaterials] Transformed sites:', sites)
    
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Create material request
    const { data: request, error } = await supabase
      .from('material_requests')
      .insert({
        site_id: data.siteId,
        material_code: data.materialCode,
        requested_quantity: data.requestedQuantity,
        request_date: data.requestDate,
        notes: data.notes,
        requested_by: user.id,
        status: 'pending'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating material request:', error)
      return { success: false, error: error.message }
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
    const supabase = await createClient()
    
    // Get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }
    
    // Get material ID from code
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id')
      .eq('code', data.materialCode)
      .single()
    
    if (materialError || !material) {
      return { success: false, error: 'Material not found' }
    }
    
    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('material_transactions')
      .insert({
        site_id: data.siteId,
        material_id: material.id,
        transaction_type: data.transactionType,
        quantity: data.quantity,
        transaction_date: data.transactionDate,
        notes: data.notes,
        created_by: user.id
      })
      .select()
      .single()
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { success: false, error: transactionError.message }
    }
    
    // Update inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('material_inventory')
      .select('current_stock')
      .eq('site_id', data.siteId)
      .eq('material_id', material.id)
      .single()
    
    if (inventoryError) {
      // Create new inventory record if doesn't exist
      const { error: createError } = await supabase
        .from('material_inventory')
        .insert({
          site_id: data.siteId,
          material_id: material.id,
          current_stock: data.transactionType === 'in' ? data.quantity : 0,
          available_stock: data.transactionType === 'in' ? data.quantity : 0,
          reserved_stock: 0,
          last_updated: new Date().toISOString()
        })
      
      if (createError) {
        console.error('Error creating inventory:', createError)
        return { success: false, error: createError.message }
      }
    } else {
      // Update existing inventory
      const newStock = data.transactionType === 'in' 
        ? (inventory.current_stock || 0) + data.quantity
        : Math.max(0, (inventory.current_stock || 0) - data.quantity)
      
      const { error: updateError } = await supabase
        .from('material_inventory')
        .update({
          current_stock: newStock,
          available_stock: newStock,
          last_updated: new Date().toISOString()
        })
        .eq('site_id', data.siteId)
        .eq('material_id', material.id)
      
      if (updateError) {
        console.error('Error updating inventory:', updateError)
        return { success: false, error: updateError.message }
      }
    }
    
    return { success: true, data: transaction }
    
  } catch (error) {
    console.error('Error in recordInventoryTransaction:', error)
    return { success: false, error: 'Server error' }
  }
}