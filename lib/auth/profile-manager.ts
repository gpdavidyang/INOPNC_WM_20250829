import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: 'system_admin' | 'admin' | 'site_manager' | 'customer_manager' | 'worker'
  status: 'active' | 'inactive' | 'suspended'
  avatar_url: string | null
  organization_id: string | null
  organization_name: string | null
  site_id: string | null
  site_name: string | null
  last_login_at: string | null
  login_count: number
}

export interface ProfileCheckResult {
  exists: boolean
  isComplete: boolean
  missingFields: string[]
  profile: UserProfile | null
}

/**
 * Profile Manager utility for handling user profile operations
 */
export class ProfileManager {
  private supabase = createClient()

  /**
   * Check if user profile exists and is complete
   */
  async checkProfile(userId: string): Promise<ProfileCheckResult> {
    try {
      // TODO: Implement RPC function when database is available
      // const { data: profile, error } = await this.supabase
      //   .rpc('get_user_profile_complete', { user_id: userId })
      //   .single()
      
      // Return mock data for now
      const profile = null
      const error = null

      if (error || !profile) {
        return {
          exists: false,
          isComplete: false,
          missingFields: ['profile'],
          profile: null
        }
      }

      const missingFields: string[] = []
      
      // TODO: Check required fields when profile data is available
      // if (!profile.full_name) missingFields.push('full_name')
      // if (!profile.role) missingFields.push('role')
      // if (!profile.organization_id) missingFields.push('organization_id')
      
      // Site is required for workers and site managers
      // if (['worker', 'site_manager'].includes(profile.role) && !profile.site_id) {
      //   missingFields.push('site_id')
      // }

      return {
        exists: true,
        isComplete: missingFields.length === 0,
        missingFields,
        profile: profile as UserProfile
      }
    } catch (error) {
      console.error('Error checking profile:', error)
      return {
        exists: false,
        isComplete: false,
        missingFields: ['error'],
        profile: null
      }
    }
  }

  /**
   * Create or update user profile
   */
  async upsertProfile(user: User, additionalData?: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      // Determine organization and site based on email
      let organizationId = additionalData?.organization_id
      let siteId = additionalData?.site_id
      let role = additionalData?.role || 'worker'

      // Auto-assign based on email domain if not provided
      if (!organizationId) {
        if (user.email?.includes('@inopnc.com')) {
          organizationId = '11111111-1111-1111-1111-111111111111' // INOPNC
        } else if (user.email?.includes('@customer.com')) {
          organizationId = '22222222-2222-2222-2222-222222222222' // Customer
        }
      }

      // Special handling for specific emails
      if (user.email === 'davidswyang@gmail.com') {
        role = 'system_admin'
        organizationId = '11111111-1111-1111-1111-111111111111'
      } else if (user.email === 'admin@inopnc.com') {
        role = 'admin'
      } else if (user.email === 'manager@inopnc.com') {
        role = 'site_manager'
        siteId = siteId || '33333333-3333-3333-3333-333333333333'
      } else if (user.email === 'worker@inopnc.com') {
        role = 'worker'
        siteId = siteId || '33333333-3333-3333-3333-333333333333'
      } else if (user.email === 'customer@inopnc.com') {
        role = 'customer_manager'
      }

      const profileData = {
        id: user.id,
        email: user.email!,
        full_name: additionalData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        phone: additionalData?.phone || user.user_metadata?.phone,
        role,
        organization_id: organizationId,
        site_id: siteId,
        status: 'active',
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await this.supabase
        .from('profiles')
        .upsert(profileData)

      if (profileError) {
        console.error('Profile upsert error:', profileError)
        return { success: false, error: profileError.message }
      }

      // Create user_organizations entry if organization is assigned
      if (organizationId) {
        await this.supabase
          .from('user_organizations')
          .upsert({
            user_id: user.id,
            organization_id: organizationId,
            is_primary: true
          })
          .select()
      }

      // Create site_assignments entry if site is assigned
      if (siteId) {
        await this.supabase
          .from('site_assignments')
          .upsert({
            user_id: user.id,
            site_id: siteId,
            assigned_date: new Date().toISOString().split('T')[0],
            is_active: true
          })
          .select()
      }

      return { success: true }
    } catch (error) {
      console.error('Error upserting profile:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }

  /**
   * Update login statistics
   */
  async updateLoginStats(userId: string): Promise<void> {
    try {
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('login_count')
        .eq('id', userId)
        .single()

      if (profile) {
        await this.supabase
          .from('profiles')
          .update({
            last_login_at: new Date().toISOString(),
            login_count: (profile.login_count || 0) + 1
          })
          .eq('id', userId)
      }

      // Log authentication event
      await this.logAuthEvent(userId, 'login')
    } catch (error) {
      console.error('Error updating login stats:', error)
    }
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(
    userId: string,
    eventType: 'login' | 'logout' | 'login_failed' | 'password_changed' | 'profile_updated',
    details?: any
  ): Promise<void> {
    try {
      // TODO: Enable when auth_audit_logs table is available
      // await this.supabase
      //   .from('auth_audit_logs')
      //   .insert({
      //     user_id: userId,
      //     event_type: eventType,
      //     details,
      //     created_at: new Date().toISOString()
      //   })
    } catch (error) {
      console.error('Error logging auth event:', error)
    }
  }

  /**
   * Get user's accessible sites
   */
  async getUserSites(userId: string): Promise<{ id: string; name: string }[]> {
    try {
      // TODO: Implement when profiles table has correct schema
      // const { data: profile } = await this.supabase
      //   .from('profiles')
      //   .select('role, organization_id, site_id')
      //   .eq('id', userId)
      //   .single()

      // if (!profile) return []

      // System admins and admins can access all sites
      // if (['system_admin', 'admin'].includes(profile.role)) {
      //   const { data: sites } = await this.supabase
      //     .from('sites')
      //     .select('id, name')
      //     .eq('status', 'active')
      //     .order('name')

      //   return sites || []
      // }

      // Return empty array for now - TODO: implement when schema is ready
      return []
    } catch (error) {
      console.error('Error getting user sites:', error)
      return []
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(userId: string, allowedRoles: string[]): Promise<boolean> {
    try {
      // TODO: Implement RPC function when database is available
      // const { data, error } = await this.supabase
      //   .rpc('user_has_role', {
      //     user_id: userId,
      //     allowed_roles: allowedRoles
      //   })
      
      // Return mock data for now
      const data = true
      const error = null

      return !error && data === true
    } catch (error) {
      console.error('Error checking user role:', error)
      return false
    }
  }

  /**
   * Check if user can access specific site
   */
  async canAccessSite(userId: string, siteId: string): Promise<boolean> {
    try {
      // TODO: Implement RPC function when database is available
      // const { data, error } = await this.supabase
      //   .rpc('user_can_access_site', {
      //     user_id: userId,
      //     check_site_id: siteId
      //   })
      
      // Return mock data for now
      const data = true
      const error = null

      return !error && data === true
    } catch (error) {
      console.error('Error checking site access:', error)
      return false
    }
  }

  /**
   * Get role-based redirect path
   */
  getRoleBasedRedirect(role: string): string {
    switch (role) {
      case 'system_admin':
        return '/admin/system'
      case 'admin':
        return '/admin/dashboard'
      case 'site_manager':
        return '/dashboard'
      case 'customer_manager':
        return '/reports'
      case 'worker':
        return '/dashboard/daily-reports'
      default:
        return '/dashboard'
    }
  }
}