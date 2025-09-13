'use server'

import { withAdminAuth, AdminActionResult, AdminErrors, validateRequired, validateEmail } from './common'
import { Profile, UserRole, UserStatus, UserRequiredDocument } from '@/types'
import { sendWelcomeEmail, sendPasswordResetEmail } from './email-notifications'

export interface CreateUserData {
  email: string
  full_name: string
  phone?: string
  role: UserRole
  status?: UserStatus
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string
  organization_id?: string
}

export interface UserWithSites extends Profile {
  site_assignments?: Array<{
    site_id: string
    site_name: string
    role: string
    assigned_at: string
    is_active: boolean
  }>
  required_documents?: Array<{
    document_type: string
    status: string
    submitted_at?: string | null
    expires_at?: string | null
  }>
  work_log_stats?: {
    total_reports: number
    this_month: number
    last_report_date?: string | null
  }
  organization?: {
    id: string
    name: string
  } | null
}

/**
 * Get all users with pagination and filtering
 */
export async function getUsers(
  page = 1,
  limit = 10,
  search = '',
  role?: UserRole,
  status?: UserStatus
): Promise<AdminActionResult<{ users: UserWithSites[]; total: number; pages: number }>> {
  return withAdminAuth(async (supabase) => {
    try {
      // First get the profiles with organization info
      let query = supabase
        .from('profiles')
        .select(`
          *,
          organizations!profiles_organization_id_fkey(
            id,
            name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply search filter
      if (search.trim()) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Apply role filter
      if (role) {
        query = query.eq('role', role)
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data: users, error, count } = await query

      if (error) {
        console.error('Error fetching users:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      // Fetch site assignments, required documents, and work log stats for each user
      const transformedUsers = await Promise.all(
        (users || []).map(async (user: any) => {
          // Get site assignments for this user
          const { data: assignments } = await supabase
            .from('site_assignments')
            .select(`
              site_id,
              role,
              assigned_date,
              is_active,
              sites!inner(name)
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)

          // Get required documents status from user_documents table
          let requiredDocuments: any[] = []
          try {
            const REQUIRED_DOCUMENT_TYPES = [
              'medical_checkup',
              'safety_education', 
              'vehicle_insurance',
              'vehicle_registration',
              'payroll_stub',
              'id_card',
              'senior_documents'
            ]

            const { data: userDocs } = await supabase
              .from('user_documents')
              .select('document_type, upload_date, file_path')
              .eq('user_id', user.id)

            // Create status for each required document type
            requiredDocuments = REQUIRED_DOCUMENT_TYPES.map(docType => {
              const doc = userDocs?.find((d: any) => d.document_type === docType)
              return {
                document_type: docType,
                status: doc ? 'submitted' : 'pending',
                submitted_at: doc?.upload_date || null,
                expires_at: null
              }
            })
          } catch (error) {
            // Continue without error if query fails
          }

          // Get work log statistics
          let workLogStats = { total_reports: 0, this_month: 0, last_report_date: null }
          try {
            const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
            
            const { data: totalReports, count: totalCount } = await supabase
              .from('daily_reports')
              .select('id', { count: 'exact' })
              .eq('created_by', user.id)

            const { data: monthReports, count: monthCount } = await supabase
              .from('daily_reports')
              .select('id', { count: 'exact' })
              .eq('created_by', user.id)
              .gte('work_date', currentMonth + '-01')

            const { data: lastReport } = await supabase
              .from('daily_reports')
              .select('work_date')
              .eq('created_by', user.id)
              .order('work_date', { ascending: false })
              .limit(1)

            workLogStats = {
              total_reports: totalCount || 0,
              this_month: monthCount || 0,
              last_report_date: lastReport?.[0]?.work_date || null
            }
          } catch (error) {
            // Continue with default stats if query fails
          }

          return {
            ...user,
            site_assignments: assignments?.map((assignment: any) => ({
              site_id: assignment.site_id,
              site_name: assignment.sites?.name || '',
              role: assignment.role || user.role, // Fallback to user's global role
              assigned_date: assignment.assigned_date,
              is_active: assignment.is_active
            })) || [],
            required_documents: requiredDocuments,
            work_log_stats: workLogStats,
            organization: user.organizations ? {
              id: user.organizations.id,
              name: user.organizations.name
            } : null
          }
        })
      )

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: {
          users: transformedUsers,
          total: count || 0,
          pages: totalPages
        }
      }
    } catch (error) {
      console.error('Users fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: string): Promise<AdminActionResult<UserWithSites>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Get the profile with organization info
      const { data: user, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organizations!profiles_organization_id_fkey(
            id,
            name
          )
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user:', error)
        return {
          success: false,
          error: AdminErrors.DATABASE_ERROR
        }
      }

      if (!user) {
        return {
          success: false,
          error: '사용자를 찾을 수 없습니다.'
        }
      }

      // Fetch site assignments
      const { data: assignments } = await supabase
        .from('user_site_assignments')
        .select(`
          site_id,
          role,
          assigned_at,
          is_active,
          sites!inner(
            name
          )
        `)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })

      // Fetch required documents
      const REQUIRED_DOCUMENT_TYPES = [
        'medical_checkup',
        'safety_education', 
        'vehicle_insurance',
        'vehicle_registration',
        'payroll_stub',
        'id_card',
        'senior_documents'
      ]

      const { data: userDocs } = await supabase
        .from('user_documents')
        .select('document_type, upload_date, original_filename')
        .eq('user_id', user.id)

      // Create status for each required document type
      const documents = REQUIRED_DOCUMENT_TYPES.map(docType => {
        const doc = userDocs?.find(d => d.document_type === docType)
        return {
          document_type: docType,
          document_name: doc?.original_filename || null,
          status: doc ? 'submitted' : 'pending',
          submitted_at: doc?.upload_date || null,
          expires_at: null
        }
      })

      // Fetch work log stats
      const currentDate = new Date()
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      const { data: workLogs } = await supabase
        .from('daily_reports')
        .select('report_date')
        .eq('user_id', user.id)
        .order('report_date', { ascending: false })

      const thisMonthReports = workLogs?.filter(log => 
        new Date(log.report_date) >= startOfMonth
      ).length || 0

      const transformedUser: UserWithSites = {
        ...user,
        organization: user.organizations || null,
        site_assignments: assignments?.map(a => ({
          site_id: a.site_id,
          site_name: (a.sites as any)?.name || 'Unknown',
          role: a.role,
          assigned_at: a.assigned_at,
          is_active: a.is_active
        })) || [],
        required_documents: documents?.map(d => ({
          document_type: d.document_type,
          document_name: d.document_name,
          status: d.status,
          submitted_at: d.submitted_at,
          expires_at: d.expires_at
        })) || [],
        work_log_stats: {
          total_reports: workLogs?.length || 0,
          this_month: thisMonthReports,
          last_report_date: workLogs?.[0]?.report_date || null
        }
      }

      return {
        success: true,
        data: transformedUser,
        message: '사용자 정보를 가져왔습니다.'
      }
    } catch (error) {
      console.error('Unexpected error fetching user:', error)
      return {
        success: false,
        error: AdminErrors.UNEXPECTED_ERROR
      }
    }
  })
}

/**
 * Create a new user (creates auth user and profile)
 */
export async function createUser(data: CreateUserData): Promise<AdminActionResult<Profile>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      // Validate required fields
      const emailError = validateEmail(data.email)
      if (emailError) {
        return { success: false, error: emailError }
      }

      const nameError = validateRequired(data.full_name, '이름')
      if (nameError) {
        return { success: false, error: nameError }
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing user:', checkError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      if (existingUser) {
        return {
          success: false,
          error: '이미 존재하는 이메일입니다.'
        }
      }

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        return { success: false, error: '사용자 계정 생성에 실패했습니다.' }
      }

      if (!authUser.user) {
        return { success: false, error: '사용자 계정 생성에 실패했습니다.' }
      }

      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          role: data.role,
          status: data.status || 'active'
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        // Cleanup: delete the auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authUser.user.id)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(data.email, data.full_name, tempPassword, data.role)
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError)
        // Don't fail user creation if email fails
      }

      return {
        success: true,
        data: newProfile,
        message: `사용자가 성공적으로 생성되었습니다. 환영 이메일이 발송되었습니다. 임시 비밀번호: ${tempPassword}`
      }
    } catch (error) {
      console.error('User creation error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update an existing user
 */
export async function updateUser(data: UpdateUserData): Promise<AdminActionResult<Profile>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { id, ...updateData } = data


      // Validate email if provided
      if (updateData.email) {
        const emailError = validateEmail(updateData.email)
        if (emailError) {
          return { success: false, error: emailError }
        }
      }

      const { data: user, error } = await supabase
        .from('profiles')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        if (error.code === 'PGRST116') {
          return { success: false, error: AdminErrors.NOT_FOUND }
        }
        if (error.code === '23505') {
          return { success: false, error: '이미 존재하는 이메일입니다.' }
        }
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: user,
        message: '사용자 정보가 성공적으로 업데이트되었습니다.'
      }
    } catch (error) {
      console.error('User update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Delete users (bulk operation)
 */
export async function deleteUsers(userIds: string[]): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Check for protected admin/system_admin users (excluding test accounts)
      const { data: adminUsers, error: checkError } = await supabase
        .from('profiles')
        .select('id, role, full_name, email')
        .in('id', userIds)
        .in('role', ['admin', 'system_admin'])

      if (checkError) {
        console.error('Error checking admin users:', checkError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Filter out test accounts from protection
      const protectedAdmins = adminUsers?.filter(user => {
        const isTestAccount = 
          user.full_name?.toLowerCase().includes('테스트') ||
          user.full_name?.toLowerCase().includes('test') ||
          user.email?.includes('@test.com')
        return !isTestAccount
      }) || []

      if (protectedAdmins.length > 0) {
        return {
          success: false,
          error: '관리자 계정은 삭제할 수 없습니다.'
        }
      }

      // First delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', userIds)

      if (profileError) {
        console.error('Error deleting profiles:', profileError)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      // Also delete from auth.users to ensure complete removal
      try {
        for (const userId of userIds) {
          const { error: authError } = await supabase.auth.admin.deleteUser(userId)
          if (authError) {
            console.error(`Error deleting auth user ${userId}:`, authError)
            // Continue with other deletions even if one fails
          }
        }
      } catch (error) {
        console.error('Error deleting auth users:', error)
        // Don't fail the entire operation if auth deletion fails
      }

      return {
        success: true,
        message: `${userIds.length}개 사용자가 성공적으로 삭제되었습니다.`
      }
    } catch (error) {
      console.error('Users deletion error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update user role (bulk operation)
 */
export async function updateUserRole(
  userIds: string[],
  role: UserRole
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)

      if (error) {
        console.error('Error updating user role:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const roleText = {
        worker: '작업자',
        site_manager: '현장관리자',
        customer_manager: '파트너사',
        admin: '관리자',
        system_admin: '시스템관리자'
      }[role]

      return {
        success: true,
        message: `${userIds.length}개 사용자의 역할이 ${roleText}로 변경되었습니다.`
      }
    } catch (error) {
      console.error('User role update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Update user status (bulk operation)
 */
export async function updateUserStatus(
  userIds: string[],
  status: UserStatus
): Promise<AdminActionResult<void>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', userIds)

      if (error) {
        console.error('Error updating user status:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      const statusText = {
        active: '활성화',
        inactive: '비활성화',
        suspended: '정지'
      }[status]

      return {
        success: true,
        message: `${userIds.length}개 사용자가 ${statusText}되었습니다.`
      }
    } catch (error) {
      console.error('User status update error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Reset user password
 */
export async function resetUserPassword(userId: string): Promise<AdminActionResult<string>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Generate a new temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'

      // Update user password
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword
      })

      if (error) {
        console.error('Error resetting password:', error)
        return { success: false, error: '비밀번호 재설정에 실패했습니다.' }
      }

      // Get user details for email
      const { data: user } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single()

      // Send password reset email
      if (user) {
        try {
          await sendPasswordResetEmail(user.email, user.full_name, tempPassword)
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError)
          // Don't fail password reset if email fails
        }
      }

      return {
        success: true,
        data: tempPassword,
        message: user ? 
          '비밀번호가 성공적으로 재설정되었습니다. 알림 이메일이 발송되었습니다.' :
          '비밀번호가 성공적으로 재설정되었습니다.'
      }
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}

/**
 * Get available sites for user assignment
 */
export async function getAvailableSites(): Promise<AdminActionResult<Array<{ id: string; name: string }>>> {
  return withAdminAuth(async (supabase) => {
    try {
      const { data: sites, error } = await supabase
        .from('sites')
        .select('id, name')
        .eq('status', 'active')
        .order('name')

      if (error) {
        console.error('Error fetching available sites:', error)
        return { success: false, error: AdminErrors.DATABASE_ERROR }
      }

      return {
        success: true,
        data: sites || []
      }
    } catch (error) {
      console.error('Available sites fetch error:', error)
      return {
        success: false,
        error: AdminErrors.UNKNOWN_ERROR
      }
    }
  })
}