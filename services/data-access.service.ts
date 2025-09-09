import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types'

/**
 * Data Access Service
 * Centralizes data access logic with role-based filtering
 * Only customer_manager role has partner_company_id based filtering
 */
export class DataAccessService {
  private supabase: ReturnType<typeof createClient>
  private profile: Profile | null = null

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Initialize the service with user profile
   */
  async initialize(userId: string): Promise<void> {
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    this.profile = profile
  }

  /**
   * Get sites based on user role
   * - customer_manager: only partner company sites
   * - others: all sites they have access to
   */
  async getSites() {
    if (!this.profile) throw new Error('Service not initialized')

    // Customer managers only see their partner company's sites
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      return this.supabase
        .from('site_partners')
        .select(`
          *,
          sites!inner(*),
          partner_companies(*)
        `)
        .eq('partner_company_id', this.profile.partner_company_id)
    }

    // All other roles see sites without partner filtering
    return this.supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false })
  }

  /**
   * Get daily reports based on user role
   * - customer_manager: only from partner company sites
   * - others: all reports they have access to
   */
  async getDailyReports(siteId?: string) {
    if (!this.profile) throw new Error('Service not initialized')

    let query = this.supabase
      .from('daily_reports')
      .select(`
        *,
        sites(*),
        profiles!daily_reports_created_by_fkey(*)
      `)

    // Customer managers only see reports from their sites
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      // First get site IDs for this partner
      const { data: partnerSites } = await this.supabase
        .from('site_partners')
        .select('site_id')
        .eq('partner_company_id', this.profile.partner_company_id)
      
      const siteIds = partnerSites?.map(ps => ps.site_id) || []
      query = query.in('site_id', siteIds)
    }

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId)
    }

    return query.order('report_date', { ascending: false })
  }

  /**
   * Get workers based on user role
   * - customer_manager: only partner company workers
   * - others: all workers
   */
  async getWorkers() {
    if (!this.profile) throw new Error('Service not initialized')

    let query = this.supabase
      .from('profiles')
      .select('*')
      .in('role', ['worker', 'site_manager'])

    // Customer managers only see their company's workers
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      query = query.eq('partner_company_id', this.profile.partner_company_id)
    }

    return query.order('full_name')
  }

  /**
   * Get materials based on user role
   * - customer_manager: only materials from partner sites
   * - others: all materials
   */
  async getMaterials() {
    if (!this.profile) throw new Error('Service not initialized')

    let query = this.supabase
      .from('materials')
      .select(`
        *,
        sites(*)
      `)

    // Customer managers only see materials from their sites
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      const { data: partnerSites } = await this.supabase
        .from('site_partners')
        .select('site_id')
        .eq('partner_company_id', this.profile.partner_company_id)
      
      const siteIds = partnerSites?.map(ps => ps.site_id) || []
      query = query.in('site_id', siteIds)
    }

    return query.order('created_at', { ascending: false })
  }

  /**
   * Get documents based on user role
   * - customer_manager: only partner company documents
   * - others: all documents they have access to
   */
  async getDocuments() {
    if (!this.profile) throw new Error('Service not initialized')

    let query = this.supabase
      .from('documents')
      .select(`
        *,
        profiles!documents_uploaded_by_fkey(*)
      `)

    // Customer managers see documents based on their access
    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      // This would need more complex filtering based on document ownership
      // For now, filter by uploaded_by from same company
      const { data: companyUsers } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('partner_company_id', this.profile.partner_company_id)
      
      const userIds = companyUsers?.map(u => u.id) || []
      query = query.in('uploaded_by', userIds)
    }

    return query.order('created_at', { ascending: false })
  }

  /**
   * Check if user can access a specific site
   * - customer_manager: only if partner is assigned to site
   * - others: always true (handled by other permissions)
   */
  async canAccessSite(siteId: string): Promise<boolean> {
    if (!this.profile) throw new Error('Service not initialized')

    // Non-partner users have access based on other rules
    if (this.profile.role !== 'customer_manager') {
      return true
    }

    // Customer managers need partner assignment
    if (this.profile.partner_company_id) {
      const { data, error } = await this.supabase
        .from('site_partners')
        .select('id')
        .eq('site_id', siteId)
        .eq('partner_company_id', this.profile.partner_company_id)
        .single()
      
      return !error && !!data
    }

    return false
  }

  /**
   * Get statistics for dashboard
   */
  async getDashboardStats() {
    if (!this.profile) throw new Error('Service not initialized')

    if (this.profile.role === 'customer_manager' && this.profile.partner_company_id) {
      // Get partner-specific stats
      const { data: partnerships } = await this.supabase
        .from('site_partners')
        .select('*, sites(*)')
        .eq('partner_company_id', this.profile.partner_company_id)
      
      const { data: workers } = await this.getWorkers()
      
      return {
        totalSites: partnerships?.length || 0,
        activeSites: partnerships?.filter(p => p.sites?.status === 'active').length || 0,
        totalWorkers: workers?.length || 0,
        isPartnerView: true
      }
    }

    // Get general stats for other roles
    const { data: sites } = await this.getSites()
    const { data: workers } = await this.getWorkers()
    
    return {
      totalSites: sites?.length || 0,
      activeSites: sites?.filter(s => s.status === 'active').length || 0,
      totalWorkers: workers?.length || 0,
      isPartnerView: false
    }
  }
}

/**
 * Factory function to create and initialize a DataAccessService
 */
export async function createDataAccessService(userId: string): Promise<DataAccessService> {
  const service = new DataAccessService()
  await service.initialize(userId)
  return service
}