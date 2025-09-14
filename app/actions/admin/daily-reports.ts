'use server'


interface DailyReportsFilter {
  site?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  component_name?: string
  work_process?: string
  work_section?: string
  page?: number
  itemsPerPage?: number
  sortField?: string
  sortDirection?: 'asc' | 'desc'
}

export async function getDailyReports(filters: DailyReportsFilter = {}) {
  return withAdminAuth(async (supabase) => {
    const { 
      site, 
      status, 
      dateFrom, 
      dateTo, 
      search,
      component_name,
      work_process,
      work_section,
      page = 1, 
      itemsPerPage = 20,
      sortField = 'work_date',
      sortDirection = 'desc'
    } = filters

    let query = supabase
      .from('daily_reports')
      .select(`
        *,
        sites!inner(
          name, 
          address,
          work_process,
          work_section,
          component_name,
          manager_name,
          safety_manager_name
        )
      `, { count: 'exact' })

    // Apply filters
    if (site) {
      query = query.eq('site_id', site)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (dateFrom) {
      query = query.gte('work_date', dateFrom)
    }
    if (dateTo) {
      query = query.lte('work_date', dateTo)
    }
    if (search) {
      // Search in daily_reports fields and joined sites fields
      query = query.or(`
        member_name.ilike.%${search}%,
        process_type.ilike.%${search}%,
        issues.ilike.%${search}%,
        component_name.ilike.%${search}%,
        work_process.ilike.%${search}%,
        work_section.ilike.%${search}%,
        sites.name.ilike.%${search}%,
        sites.address.ilike.%${search}%,
        sites.manager_name.ilike.%${search}%,
        sites.safety_manager_name.ilike.%${search}%
      `.replace(/\s+/g, ''))
    }
    if (component_name) {
      query = query.ilike('component_name', `%${component_name}%`)
    }
    if (work_process) {
      query = query.ilike('work_process', `%${work_process}%`)
    }
    if (work_section) {
      query = query.ilike('work_section', `%${work_section}%`)
    }

    // Apply sorting
    const ascending = sortDirection === 'asc'
    switch (sortField) {
      case 'site_name':
        query = query.order('sites(name)', { ascending })
        break
      case 'work_date':
        query = query.order('work_date', { ascending })
        break
      case 'member_name':
        query = query.order('member_name', { ascending })
        break
      case 'total_workers':
        query = query.order('total_workers', { ascending })
        break
      case 'total_manhours':
        // Since total_manhours is calculated after query, we'll sort manually in the client
        // For now, sort by total_workers as a fallback
        query = query.order('total_workers', { ascending })
        break
      case 'status':
        query = query.order('status', { ascending })
        break
      case 'created_at':
        query = query.order('created_at', { ascending })
        break
      case 'component_name':
        query = query.order('component_name', { ascending, nullsFirst: false })
        break
      case 'work_process':
        query = query.order('work_process', { ascending, nullsFirst: false })
        break
      case 'work_section':
        query = query.order('work_section', { ascending, nullsFirst: false })
        break
      default:
        query = query.order('work_date', { ascending: false })
    }
    
    // Add secondary sort for stability
    if (sortField !== 'created_at') {
      query = query.order('created_at', { ascending: false })
    }

    // Pagination
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    const { data, error, count } = await query
      .range(from, to)

    if (error) throw error

    // Enrich with additional data
    const enrichedReports = await Promise.all(
      (data || []).map(async (report: unknown) => {
        try {
          // Get profile data
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone, role, last_login_at')
            .eq('id', report.created_by)
            .single()
          
          // Get worker details count
          const { count: workerCount } = await supabase
            .from('daily_report_workers')
            .select('id', { count: 'exact', head: true })
            .eq('daily_report_id', report.id)
          
          // Get total manhours from worker_assignments
          const { data: workerAssignments } = await supabase
            .from('work_records')
            .select('labor_hours')
            .eq('daily_report_id', report.id)
          
          const totalManhours = workerAssignments 
            ? workerAssignments.reduce((sum: number, w: unknown) => sum + (Number(w.labor_hours) || 0), 0)
            : 0
          
          // Get documents count for that day
          const { count: documentCount } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', report.site_id)
            .gte('created_at', `${report.work_date}T00:00:00`)
            .lt('created_at', `${report.work_date}T23:59:59`)
          
          return {
            ...report,
            profiles: profile,
            worker_details_count: workerCount || 0,
            daily_documents_count: documentCount || 0,
            total_manhours: totalManhours
          }
        } catch (err) {
          // If profile not found, continue without it
          return {
            ...report,
            profiles: null,
            worker_details_count: 0,
            daily_documents_count: 0,
            total_manhours: 0
          }
        }
      })
    )

    // Sort by total_manhours if needed (since it's calculated after the query)
    const finalReports = sortField === 'total_manhours' 
      ? enrichedReports.sort((a, b) => {
          const aValue = a.total_manhours || 0
          const bValue = b.total_manhours || 0
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        })
      : enrichedReports

    return {
      success: true,
      data: {
        reports: finalReports,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / itemsPerPage),
        currentPage: page
      }
    }
  })
}

export async function getDailyReportById(id: string) {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('daily_reports')
      .select(`
        *,
        sites(name, address)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Get profile separately
    let profile = null
    if (data?.created_by) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.created_by)
          .single()
        profile = profileData
      } catch (err) {
        // Profile not found, continue without it
      }
    }

    // Get worker details
    let workers = []
    try {
      const { data: workerData } = await supabase
        .from('daily_report_workers')
        .select('*')
        .eq('daily_report_id', id)
        .order('created_at', { ascending: true })
      workers = workerData || []
    } catch (err) {
      console.error('Error fetching workers:', err)
      // Continue without workers
    }

    return {
      success: true,
      data: {
        ...data,
        profiles: profile,
        workers: workers,
        worker_details_count: workers.length
      }
    }
  })
}

export async function createDailyReport(reportData: unknown) {
  return withAdminAuth(async (supabase) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { worker_ids, ...reportFields } = reportData

    // Create the daily report
    const { data, error } = await supabase
      .from('daily_reports')
      .insert({
        ...reportFields,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // If worker IDs provided, add worker details
    if (worker_ids && worker_ids.length > 0 && data) {
      const workerDetails = worker_ids.map((worker_id: string) => ({
        daily_report_id: data.id,
        worker_id,
        created_at: new Date().toISOString()
      }))

      await supabase
        .from('worker_details')
        .insert(workerDetails)
    }

    return {
      success: true,
      data
    }
  })
}

export async function updateDailyReport(id: string, updates: unknown) {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('daily_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      data
    }
  })
}

export async function deleteDailyReport(id: string) {
  return withAdminAuth(async (supabase) => {
    const { error } = await supabase
      .from('daily_reports')
      .delete()
      .eq('id', id)

    if (error) throw error

    return {
      success: true,
      message: '작업일지가 삭제되었습니다.'
    }
  })
}

export async function getSites() {
  return withAdminAuth(async (supabase) => {
    const { data, error } = await supabase
      .from('sites')
      .select('id, name')
      .eq('status', 'active')
      .order('name')

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  })
}