'use server'

import type { AsyncState, ApiResponse } from '@/types/utils'

// Get all equipment
export async function getEquipment(filters?: {
  site_id?: string
  category_id?: string
  status?: string
}) {
  try {
    const supabase = createClient()
    
    let query = (supabase
      .from('equipment')
      .select(`
        *,
        category:equipment_categories(id, name),
        site:sites(id, name)
      `)
      .eq('is_active', true)) as unknown
    
    if (filters?.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query.order('name')

    validateSupabaseResponse(data, error)

    return { success: true, data }
  } catch (error: unknown) {
    logError(error, 'getEquipment')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '장비 목록을 불러오는데 실패했습니다.' 
    }
  }
}

// Get equipment categories
export async function getEquipmentCategories() {
  try {
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('equipment_categories')
      .select('*')
      .order('name') as unknown)

    validateSupabaseResponse(data, error)

    return { success: true, data }
  } catch (error: unknown) {
    logError(error, 'getEquipmentCategories')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '장비 카테고리를 불러오는데 실패했습니다.' 
    }
  }
}

// Create equipment checkout
export async function createEquipmentCheckout(checkoutData: {
  equipment_id: string
  site_id: string
  expected_return_date?: string
  purpose?: string
  condition_out?: string
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Check if equipment is available
    const { data: equipment, error: equipmentError } = await (supabase
      .from('equipment')
      .select('status')
      .eq('id', checkoutData.equipment_id)
      .single() as unknown)

    if (equipmentError || !equipment) {
      throw new Error('장비를 찾을 수 없습니다.')
    }

    // Cast to any to bypass type issues
    const equipmentData = equipment as unknown
    if (equipmentData.status !== 'available') {
      throw new Error('장비가 사용 가능한 상태가 아닙니다.')
    }

    const { data, error } = await (supabase
      .from('equipment_checkouts')
      .insert({
        ...checkoutData,
        checked_out_by: user.id,
        checked_out_at: new Date().toISOString()
      } as unknown)
      .select()
      .single() as unknown)

    if (error) throw error

    revalidatePath('/dashboard/equipment')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Return equipment (check in)
export async function returnEquipment(
  checkoutId: string,
  returnData: {
    condition_in: string
    damage_notes?: string
  }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await (supabase
      .from('equipment_checkouts')
      .update({
        actual_return_date: new Date().toISOString().split('T')[0],
        checked_in_by: user.id,
        checked_in_at: new Date().toISOString(),
        condition_in: returnData.condition_in,
        damage_notes: returnData.damage_notes
      } as unknown)
      .eq('id', checkoutId) as unknown)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/equipment')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get equipment checkouts
export async function getEquipmentCheckouts(filters?: {
  equipment_id?: string
  site_id?: string
  active_only?: boolean
  date_from?: string
  date_to?: string
}) {
  try {
    const supabase = createClient()
    
    let query = (supabase
      .from('equipment_checkouts')
      .select(`
        *,
        equipment:equipment_id(id, code, name),
        checked_out_user:checked_out_by(id, full_name),
        checked_in_user:checked_in_by(id, full_name),
        site:sites(id, name)
      `)) as unknown

    if (filters?.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id)
    }
    if (filters?.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters?.active_only) {
      query = query.is('actual_return_date', null)
    }
    if (filters?.date_from) {
      query = query.gte('checked_out_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('checked_out_at', filters.date_to)
    }

    const { data, error } = await query
      .order('checked_out_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Create equipment maintenance record
export async function createEquipmentMaintenance(maintenanceData: {
  equipment_id: string
  maintenance_type: string
  scheduled_date: string
  description?: string
  cost?: number
  next_maintenance_date?: string
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await (supabase
      .from('equipment_maintenance')
      .insert(maintenanceData as unknown)
      .select()
      .single() as unknown)

    if (error) throw error

    revalidatePath('/dashboard/equipment')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Update equipment maintenance
export async function updateEquipmentMaintenance(
  maintenanceId: string,
  updates: {
    completed_date?: string
    performed_by?: string
    cost?: number
    description?: string
    status?: string
  }
) {
  try {
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('equipment_maintenance')
      .update(updates as unknown)
      .eq('id', maintenanceId)
      .select()
      .single() as unknown)

    if (error) throw error

    revalidatePath('/dashboard/equipment')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get equipment maintenance records
export async function getEquipmentMaintenance(filters?: {
  equipment_id?: string
  status?: string
  date_from?: string
  date_to?: string
}) {
  try {
    const supabase = createClient()
    
    let query = (supabase
      .from('equipment_maintenance')
      .select(`
        *,
        equipment:equipment_id(id, code, name),
        performed_by_user:performed_by(id, full_name)
      `)) as unknown

    if (filters?.equipment_id) {
      query = query.eq('equipment_id', filters.equipment_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.date_from) {
      query = query.gte('scheduled_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('scheduled_date', filters.date_to)
    }

    const { data, error } = await query
      .order('scheduled_date', { ascending: false })
      .limit(100)

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get worker skills
export async function getWorkerSkills() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('worker_skills' as unknown)
      .select('*')
      .order('category, name')

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get worker skill assignments
export async function getWorkerSkillAssignments(workerId?: string) {
  try {
    const supabase = createClient()
    
    let query = (supabase
      .from('worker_skill_assignments')
      .select(`
        *,
        worker:profiles!worker_id(id, full_name),
        skill:worker_skills(id, name, category)
      `)) as unknown

    if (workerId) {
      query = query.eq('worker_id', workerId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Create or update worker skill assignment
export async function upsertWorkerSkillAssignment(assignmentData: {
  worker_id: string
  skill_id: string
  proficiency_level?: string
  certified?: boolean
  certification_date?: string
  certification_expiry?: string
  hourly_rate?: number
  overtime_rate?: number
}) {
  try {
    const supabase = createClient()
    
    const { data, error } = await (supabase
      .from('worker_skill_assignments')
      .upsert(assignmentData as unknown)
      .select()
      .single() as unknown)

    if (error) throw error

    revalidatePath('/dashboard/workers')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Create resource allocation
export async function createResourceAllocation(allocationData: {
  allocation_type: 'worker' | 'equipment'
  resource_id: string
  site_id: string
  daily_report_id?: string
  allocated_date: string
  start_time?: string
  end_time?: string
  hours_worked?: number
  hourly_rate?: number
  overtime_rate?: number
  task_description?: string
  notes?: string
}) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error('Unauthorized')

    // Calculate hours and costs
    let calculatedData: unknown = {
      ...allocationData,
      created_by: user.id
    }

    if (allocationData.hours_worked && allocationData.hourly_rate) {
      const regularHours = Math.min(allocationData.hours_worked, 8)
      const overtimeHours = Math.max(0, allocationData.hours_worked - 8)
      const overtimeRate = allocationData.overtime_rate || allocationData.hourly_rate * 1.5
      
      calculatedData.regular_hours = regularHours
      calculatedData.overtime_hours = overtimeHours
      calculatedData.total_cost = (regularHours * allocationData.hourly_rate) + 
                                  (overtimeHours * overtimeRate)
    }

    const { data, error } = await (supabase
      .from('resource_allocations')
      .insert(calculatedData as unknown)
      .select()
      .single() as unknown)

    if (error) throw error

    revalidatePath('/dashboard/resources')
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get resource allocations
export async function getResourceAllocations(filters?: {
  allocation_type?: string
  resource_id?: string
  site_id?: string
  daily_report_id?: string
  date_from?: string
  date_to?: string
}) {
  try {
    const supabase = createClient()
    
    let query = (supabase
      .from('resource_allocations')
      .select(`
        *,
        site:sites(id, name),
        created_by_user:created_by(id, full_name),
        approved_by_user:approved_by(id, full_name)
      `)) as unknown

    if (filters?.allocation_type) {
      query = query.eq('allocation_type', filters.allocation_type)
    }
    if (filters?.resource_id) {
      query = query.eq('resource_id', filters.resource_id)
    }
    if (filters?.site_id) {
      query = query.eq('site_id', filters.site_id)
    }
    if (filters?.daily_report_id) {
      query = query.eq('daily_report_id', filters.daily_report_id)
    }
    if (filters?.date_from) {
      query = query.gte('allocated_date', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('allocated_date', filters.date_to)
    }

    const { data, error } = await query
      .order('allocated_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(100)

    if (error) throw error

    // Fetch worker/equipment details based on allocation type
    if (data && data.length > 0) {
      const workerAllocations = data.filter((a: unknown) => a.allocation_type === 'worker')
      const equipmentAllocations = data.filter((a: unknown) => a.allocation_type === 'equipment')

      // Get worker details
      if (workerAllocations.length > 0) {
        const workerIds = Array.from(new Set(workerAllocations.map((a: unknown) => a.resource_id)))
        const { data: workers } = await supabase
          .from('profiles' as unknown)
          .select('id, full_name')
          .in('id', workerIds)

        const workersMap = new Map(workers?.map((w: unknown) => [w.id, w]))
        workerAllocations.forEach((a: unknown) => {
          a.worker = workersMap.get(a.resource_id)
        })
      }

      // Get equipment details
      if (equipmentAllocations.length > 0) {
        const equipmentIds = Array.from(new Set(equipmentAllocations.map((a: unknown) => a.resource_id)))
        const { data: equipment } = await supabase
          .from('equipment' as unknown)
          .select('id, code, name')
          .in('id', equipmentIds)

        const equipmentMap = new Map(equipment?.map((e: Event) => [e.id, e]))
        equipmentAllocations.forEach((a: unknown) => {
          a.equipment = equipmentMap.get(a.resource_id)
        })
      }
    }

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}

// Get equipment stats
export async function getEquipmentStats(siteId?: string) {
  try {
    const supabase = createClient()
    
    let baseQuery = (supabase.from('equipment').select('status', { count: 'exact' }) as unknown)
    if (siteId) {
      baseQuery = baseQuery.eq('site_id', siteId)
    }

    const [
      totalResult,
      availableResult,
      inUseResult,
      maintenanceResult,
      damagedResult
    ] = await Promise.all([
      baseQuery,
      baseQuery.eq('status', 'available'),
      baseQuery.eq('status', 'in_use'),
      baseQuery.eq('status', 'maintenance'),
      baseQuery.eq('status', 'damaged')
    ])

    // Get active checkouts
    let checkoutsQuery = supabase
      .from('equipment_checkouts' as unknown)
      .select('id', { count: 'exact' })
      .is('actual_return_date', null)
    
    if (siteId) {
      checkoutsQuery = checkoutsQuery.eq('site_id', siteId)
    }

    const activeCheckoutsResult = await checkoutsQuery

    // Get overdue returns
    const today = new Date().toISOString().split('T')[0]
    let overdueQuery = supabase
      .from('equipment_checkouts' as unknown)
      .select('id', { count: 'exact' })
      .is('actual_return_date', null)
      .lt('expected_return_date', today)
    
    if (siteId) {
      overdueQuery = overdueQuery.eq('site_id', siteId)
    }

    const overdueResult = await overdueQuery

    // Get upcoming maintenance
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const upcomingMaintenanceResult = await supabase
      .from('equipment_maintenance' as unknown)
      .select('id', { count: 'exact' })
      .eq('status', 'scheduled')
      .lte('scheduled_date', nextWeek.toISOString().split('T')[0])

    return {
      success: true,
      data: {
        totalEquipment: totalResult.count || 0,
        availableEquipment: availableResult.count || 0,
        inUseEquipment: inUseResult.count || 0,
        maintenanceEquipment: maintenanceResult.count || 0,
        damagedEquipment: damagedResult.count || 0,
        activeCheckouts: activeCheckoutsResult.count || 0,
        overdueReturns: overdueResult.count || 0,
        upcomingMaintenance: upcomingMaintenanceResult.count || 0
      }
    }
  } catch (error: unknown) {
    return { success: false, error: error.message }
  }
}