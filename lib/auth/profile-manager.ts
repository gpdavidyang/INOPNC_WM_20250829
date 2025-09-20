import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export type UserRole =
  | 'system_admin'
  | 'admin'
  | 'site_manager'
  | 'customer_manager'
  | 'worker'
  | 'partner'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole | null
  status: string | null
  avatar_url: string | null
  organization_id: string | null
  site_id: string | null
  last_login_at: string | null
  login_count: number | null
}

export interface ProfileCheckResult {
  exists: boolean
  isComplete: boolean
  missingFields: string[]
  profile: UserProfile | null
}

/**
 * ProfileManager encapsulates common profile operations that need to run on the client.
 * This keeps our React hooks light while preserving the historical API expected by
 * components across the mobile and admin surfaces.
 */
export class ProfileManager {
  private supabase = createClient()

  /**
   * Fetch the user's profile and report whether required fields are populated.
   */
  async checkProfile(userId: string): Promise<ProfileCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(
          [
            'id',
            'email',
            'full_name',
            'phone',
            'role',
            'status',
            'avatar_url',
            'organization_id',
            'site_id',
            'last_login_at',
            'login_count',
          ].join(', ')
        )
        .eq('id', userId)
        .single()

      if (error || !data) {
        return {
          exists: false,
          isComplete: false,
          missingFields: ['profile'],
          profile: null,
        }
      }

      const missingFields: string[] = []

      if (!data.full_name) missingFields.push('full_name')
      if (!data.role) missingFields.push('role')
      if (!data.organization_id) missingFields.push('organization_id')
      if (['worker', 'site_manager'].includes((data.role as string) || '') && !data.site_id) {
        missingFields.push('site_id')
      }

      return {
        exists: true,
        isComplete: missingFields.length === 0,
        missingFields,
        profile: data as UserProfile,
      }
    } catch (error) {
      console.error('[ProfileManager] checkProfile error:', error)
      return {
        exists: false,
        isComplete: false,
        missingFields: ['error'],
        profile: null,
      }
    }
  }

  /**
   * Upsert the user's profile, applying our legacy auto-population rules.
   */
  async upsertProfile(
    user: User,
    additionalData: Partial<UserProfile> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let organizationId = additionalData.organization_id ?? null
      let siteId = additionalData.site_id ?? null
      let role = additionalData.role ?? (user.user_metadata?.role as UserRole | undefined) ?? 'worker'

      if (!organizationId) {
        if (user.email?.includes('@inopnc.com')) {
          organizationId = '11111111-1111-1111-1111-111111111111'
        } else if (user.email?.includes('@customer.com')) {
          organizationId = '22222222-2222-2222-2222-222222222222'
        }
      }

      switch (user.email) {
        case 'davidswyang@gmail.com':
          role = 'system_admin'
          organizationId = '11111111-1111-1111-1111-111111111111'
          break
        case 'admin@inopnc.com':
          role = 'admin'
          break
        case 'manager@inopnc.com':
          role = 'site_manager'
          siteId = siteId ?? '33333333-3333-3333-3333-333333333333'
          break
        case 'worker@inopnc.com':
          role = 'worker'
          siteId = siteId ?? '33333333-3333-3333-3333-333333333333'
          break
        case 'customer@inopnc.com':
          role = 'customer_manager'
          break
        default:
          break
      }

      const profilePayload = {
        id: user.id,
        email: user.email ?? '',
        full_name:
          additionalData.full_name ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split('@')[0] ||
          '',
        phone: additionalData.phone ?? (user.user_metadata?.phone as string | undefined) ?? null,
        role,
        organization_id: organizationId,
        site_id: siteId,
        status: additionalData.status ?? 'active',
        avatar_url: additionalData.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      }

      const { error: profileError } = await this.supabase.from('profiles').upsert(profilePayload)

      if (profileError) {
        console.error('[ProfileManager] upsertProfile error:', profileError)
        return { success: false, error: profileError.message }
      }

      if (organizationId) {
        await this.supabase
          .from('user_organizations')
          .upsert({
            user_id: user.id,
            organization_id: organizationId,
            is_primary: true,
          })
      }

      if (siteId) {
        await this.supabase
          .from('site_assignments')
          .upsert({
            user_id: user.id,
            site_id: siteId,
            assigned_date: new Date().toISOString().split('T')[0],
            is_active: true,
          })
      }

      return { success: true }
    } catch (error) {
      console.error('[ProfileManager] upsertProfile error:', error)
      return { success: false, error: 'Failed to update profile' }
    }
  }

  async updateLoginStats(userId: string): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('login_count')
        .eq('id', userId)
        .single()

      const loginCount = (data?.login_count ?? 0) + 1

      await this.supabase
        .from('profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: loginCount,
        })
        .eq('id', userId)

      await this.logAuthEvent(userId, 'login', { loginCount })
    } catch (error) {
      console.error('[ProfileManager] updateLoginStats error:', error)
    }
  }

  async logAuthEvent(
    userId: string,
    eventType: 'login' | 'logout' | 'login_failed' | 'password_changed' | 'profile_updated',
    details?: unknown
  ): Promise<void> {
    try {
      await this.supabase
        .from('auth_audit_logs')
        .insert({
          user_id: userId,
          event_type: eventType,
          details,
          created_at: new Date().toISOString(),
        })
    } catch (error) {
      // Logging failures should never break auth flows.
      console.warn('[ProfileManager] logAuthEvent error:', error)
    }
  }

  async getUserSites(userId: string): Promise<{ id: string; name: string }[]> {
    try {
      const { data: assignments, error } = await this.supabase
        .from('site_assignments')
        .select('site_id, sites(name)')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error || !assignments) {
        return []
      }

      return assignments
        .map(assignment => ({
          id: assignment.site_id,
          name: assignment.sites?.name ?? '현장',
        }))
        .filter(site => !!site.id)
    } catch (error) {
      console.error('[ProfileManager] getUserSites error:', error)
      return []
    }
  }

  async canAccessSite(userId: string, siteId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('site_assignments')
        .select('id')
        .eq('user_id', userId)
        .eq('site_id', siteId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) {
        return false
      }

      return !!data
    } catch (error) {
      console.error('[ProfileManager] canAccessSite error:', error)
      return false
    }
  }

  getRoleBasedRedirect(role: string | null | undefined): string {
    switch (role) {
      case 'system_admin':
      case 'admin':
        return '/dashboard/admin'
      case 'customer_manager':
      case 'partner':
        return '/partner/dashboard'
      case 'site_manager':
      case 'worker':
        return '/mobile'
      default:
        return '/mobile'
    }
  }
}
