'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { 
  AppError, 
  ErrorType, 
  validateSupabaseResponse, 
  logError 
} from '@/lib/error-handling'

// Get all materials
export async function getMaterials() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('materials' as any)
      .select(`
        *,
        category:material_categories(id, name)
      `)
      .eq('is_active', true)
      .order('name')

    validateSupabaseResponse(data, error)

    return { success: true, data }
  } catch (error: any) {
    logError(error, 'getMaterials')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '자재 목록을 불러오는데 실패했습니다.' 
    }
  }
}

// Get material categories
export async function getMaterialCategories() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('material_categories' as any)
      .select('*')
      .order('name')

    validateSupabaseResponse(data, error)

    return { success: true, data }
  } catch (error: any) {
    logError(error, 'getMaterialCategories')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '자재 카테고리를 불러오는데 실패했습니다.' 
    }
  }
}

// Create new material
export async function createMaterial(materialData: {
  code: string
  name: string
  category_id?: string
  unit: string
  specification?: string
  manufacturer?: string
  min_stock_level?: number
  max_stock_level?: number
  unit_price?: number
}) {
  try {
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('materials')
      .insert(materialData as any)
      .select()
      .single() as any)

    if (error) throw error

    revalidatePath('/dashboard/materials')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update material
export async function updateMaterial(id: string, updates: Partial<{
  name: string
  category_id?: string
  unit: string
  specification?: string
  manufacturer?: string
  min_stock_level?: number
  max_stock_level?: number
  unit_price?: number
  is_active: boolean
}>) {
  try {
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('materials')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single() as any)

    if (error) throw error

    revalidatePath('/dashboard/materials')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get material inventory for a site
export async function getMaterialInventory(siteId: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('material_inventory' as any)
      .select(`
        *,
        material:materials(id, name, code, specification, unit, min_stock_level)
      `)
      .eq('site_id', siteId)
      .order('material_id')

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get NPC-1000 inventory across all sites
export async function getNPC1000Inventory(siteId?: string) {
  try {
    const supabase = createClient()
    
    // First get the NPC-1000 material ID
    const { data: npcMaterial } = await supabase
      .from('materials' as any)
      .select('id')
      .eq('code', 'NPC-1000')
      .single()

    if (!npcMaterial) {
      return { success: false, error: 'NPC-1000 material not found' }
    }

    let query = supabase
      .from('material_inventory' as any)
      .select(`
        *,
        material:materials(name, code, specification, unit),
        site:sites(id, name, address)
      `)
      .eq('material_id', (npcMaterial as any).id)

    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    const { data, error } = await query.order('site_id')

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update material stock (for adjustments)
export async function updateMaterialStock(
  siteId: string,
  materialId: string,
  newStock: number,
  notes?: string
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Get current stock
    const { data: currentInventory } = await supabase
      .from('material_inventory' as any)
      .select('current_stock')
      .eq('site_id', siteId)
      .eq('material_id', materialId)
      .single()

    const currentStock = (currentInventory as any)?.current_stock || 0
    const difference = newStock - currentStock

    // Create adjustment transaction
    const { error: transactionError } = await supabase
      .from('material_transactions' as any)
      .insert({
        transaction_type: 'adjustment',
        site_id: siteId,
        material_id: materialId,
        quantity: Math.abs(difference),
        notes: notes || `Stock adjustment: ${currentStock} → ${newStock}`,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: user.id
      })

    if (transactionError) throw transactionError

    // The trigger will automatically update the inventory

    revalidatePath('/dashboard/materials')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create material transaction
export async function createMaterialTransaction(transactionData: {
  transaction_type: 'in' | 'out' | 'transfer' | 'adjustment' | 'return'
  site_id: string
  material_id: string
  quantity: number
  unit_price?: number
  reference_type?: string
  reference_id?: string
  from_site_id?: string
  to_site_id?: string
  notes?: string
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // For transfers, set up the sites correctly
    if (transactionData.transaction_type === 'transfer') {
      transactionData.from_site_id = transactionData.site_id
      transactionData.site_id = transactionData.to_site_id!
    }

    const { data, error } = await supabase
      .from('material_transactions' as any)
      .insert({
        ...transactionData,
        transaction_date: new Date().toISOString().split('T')[0],
        created_by: user.id,
        total_price: transactionData.unit_price ? transactionData.unit_price * transactionData.quantity : undefined
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/materials')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get material transactions
export async function getMaterialTransactions(filters: {
  site_id?: string
  material_id?: string
  date_from?: string
  date_to?: string
  transaction_type?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('material_transactions' as any)
      .select(`
        *,
        material:materials(name, code, specification, unit),
        site:sites(name),
        from_site:from_site_id(name),
        to_site:to_site_id(name),
        creator:created_by(full_name),
        approver:approved_by(full_name)
      `)

    if (filters.site_id) {
      query = query.or(`site_id.eq.${filters.site_id},from_site_id.eq.${filters.site_id},to_site_id.eq.${filters.site_id}`)
    }
    if (filters.material_id) {
      query = query.eq('material_id', filters.material_id)
    }
    if (filters.transaction_type) {
      query = query.eq('transaction_type', filters.transaction_type)
    }
    if (filters.date_from) {
      query = query.gte('transaction_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('transaction_date', filters.date_to)
    }

    const { data, error } = await query
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create material request
export async function createMaterialRequest(requestData: {
  site_id: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  needed_by?: string
  notes?: string
  items: Array<{
    material_id: string
    requested_quantity: number
    notes?: string
  }>
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Generate request number
    const timestamp = Date.now().toString().slice(-6)
    const request_number = `MR-${new Date().getFullYear()}-${timestamp}`

    // Create request
    const { data: request, error: requestError } = await supabase
      .from('material_requests' as any)
      .insert({
        request_number,
        site_id: requestData.site_id,
        requested_by: user.id,
        priority: requestData.priority || 'normal',
        needed_by: requestData.needed_by,
        notes: requestData.notes
      })
      .select()
      .single()

    if (requestError) throw requestError

    // Create request items
    const { error: itemsError } = await (supabase
      .from('material_request_items')
      .insert(
        requestData.items.map((item: any) => ({
          request_id: (request as any).id,
          material_id: item.material_id,
          requested_quantity: item.requested_quantity,
          notes: item.notes
        })) as any
      ) as any)

    if (itemsError) throw itemsError

    revalidatePath('/dashboard/materials/requests')
    return { success: true, data: request }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Get material requests
export async function getMaterialRequests(filters: {
  site_id?: string
  status?: string
  date_from?: string
  date_to?: string
}) {
  try {
    const supabase = createClient()
    
    let query = supabase
      .from('material_requests' as any)
      .select(`
        *,
        site:sites(name),
        requester:requested_by(full_name),
        approver:approved_by(full_name),
        items:material_request_items(
          *,
          material:materials(name, code, specification, unit)
        )
      `)

    if (filters.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update material request status
export async function updateMaterialRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected' | 'fulfilled' | 'cancelled',
  notes?: string
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const updates: any = {
      status,
      notes: notes ? `${notes}\n\n---\nStatus update` : undefined
    }

    if (status === 'approved' || status === 'rejected') {
      updates.approved_by = user.id
      updates.approved_at = new Date().toISOString()
    } else if (status === 'fulfilled') {
      updates.fulfilled_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('material_requests' as any)
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/materials/requests')
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}