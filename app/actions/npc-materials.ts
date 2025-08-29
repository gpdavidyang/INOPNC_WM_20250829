'use server'

import { createClient } from '@/lib/supabase/server'

export async function getNPCMaterialsData(siteId: string) {
  try {
    const supabase = createClient()
    
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
      console.error('Inventory query error:', inventoryError)
      return { success: false, error: inventoryError.message, data: null }
    }
    
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
      console.error('Transactions query error:', transactionsError)
    }
    
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
    const supabase = createClient()
    
    const { data: sites, error } = await supabase
      .from('sites')
      .select('id, name')
      .order('name')
    
    if (error) {
      console.error('Sites query error:', error)
      return { success: false, error: error.message, data: [] }
    }
    
    return { success: true, data: sites || [] }
    
  } catch (error) {
    console.error('Error fetching sites:', error)
    return { success: false, error: 'Server error', data: [] }
  }
}