'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileManager } from '@/lib/auth/profile-manager'
import type { UserRole } from '@/types'

export async function signIn(email: string, password: string) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // TODO: Log failed login attempt when log_auth_event function is created
    // try {
    //   await supabase.rpc('log_auth_event', {
    //     user_id: email,
    //     event_type: 'login_failed',
    //     details: { error: error.message }
    //   })
    // } catch (logError) {
    //   console.error('Failed to log auth event:', logError)
    // }
    
    return { error: error.message }
  }

  // Update login stats using ProfileManager
  if (data.user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('login_count')
        .eq('id', data.user.id)
        .single()
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ 
            last_login_at: new Date().toISOString(),
            login_count: (profile.login_count || 0) + 1
          })
          .eq('id', data.user.id)
      }

      // TODO: Log successful login when log_auth_event function is created
      // await supabase.rpc('log_auth_event', {
      //   user_id: data.user.id,
      //   event_type: 'login',
      //   details: { email }
      // })
    } catch (updateError) {
      console.error('Failed to update login stats:', updateError)
    }
  }

  // Return success without redirect - let client handle navigation
  return { success: true }
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
        role,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    // Determine organization_id and site_id using proper UUIDs
    let organizationId = null
    let siteId = null
    
    if (email.includes('@inopnc.com')) {
      organizationId = '11111111-1111-1111-1111-111111111111' // INOPNC
      if (role === 'worker' || role === 'site_manager') {
        siteId = '33333333-3333-3333-3333-333333333333' // Site 1
      }
    } else if (email.includes('@customer.com')) {
      organizationId = '22222222-2222-2222-2222-222222222222' // Customer
    }

    // Handle special case for davidswyang@gmail.com
    if (email === 'davidswyang@gmail.com') {
      role = 'system_admin'
      organizationId = '11111111-1111-1111-1111-111111111111'
    }

    // Create/update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        phone,
        role,
        organization_id: organizationId,
        site_id: siteId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return { error: 'Failed to create user profile' }
    }

    // Create user_organizations entry
    if (organizationId) {
      await supabase
        .from('user_organizations')
        .upsert({
          user_id: data.user.id,
          organization_id: organizationId,
          is_primary: true
        })
    }

    // Create site_assignments entry
    if (siteId) {
      await supabase
        .from('site_assignments')
        .upsert({
          user_id: data.user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
    }
  }

  // Return success without redirect - let client handle navigation
  return { success: true }
}

export async function signOut() {
  const supabase = createClient()
  
  // Get current user before signing out
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // TODO: Log logout event when log_auth_event function is created
    // try {
    //   await supabase.rpc('log_auth_event', {
    //     user_id: user.id,
    //     event_type: 'logout'
    //   })
    // } catch (logError) {
    //   console.error('Failed to log logout event:', logError)
    // }
  }
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }
  
  // Return success and let the client handle the redirect
  return { success: true }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = createClient()

  // 먼저 현재 비밀번호로 재인증
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' }
  }

  // 현재 비밀번호로 재로그인 시도하여 검증
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  })

  if (signInError) {
    return { success: false, error: '현재 비밀번호가 올바르지 않습니다.' }
  }

  // 새 비밀번호로 업데이트
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true }
}

export async function updateNotificationPreferences(preferences: any) {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { success: false, error: '사용자를 찾을 수 없습니다.' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ 
      notification_preferences: preferences,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function requestPushPermission() {
  if (!('Notification' in window)) {
    return { success: false, error: '브라우저가 알림을 지원하지 않습니다.' }
  }

  if (Notification.permission === 'granted') {
    return { success: true, permission: 'granted' }
  }

  if (Notification.permission === 'denied') {
    return { success: false, error: '알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 변경해주세요.' }
  }

  const permission = await Notification.requestPermission()
  
  if (permission === 'granted') {
    return { success: true, permission: 'granted' }
  } else {
    return { success: false, error: '알림 권한이 거부되었습니다.' }
  }
}

export async function requestPasswordReset(email: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/update-password`,
    })

    if (error) {
      console.error('Password reset request error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { error: '비밀번호 재설정 요청 중 오류가 발생했습니다.' }
  }
}

export async function updatePasswordWithToken(newPassword: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Password update error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Password update error:', error)
    return { error: '비밀번호 업데이트 중 오류가 발생했습니다.' }
  }
}

export async function requestSignupApproval(formData: {
  fullName: string
  company: string
  jobTitle: string
  phone: string
  email: string
}) {
  const supabase = createClient()

  try {
    // Check if email already exists in signup requests
    const { data: existingRequest } = await supabase
      .from('signup_requests')
      .select('id')
      .eq('email', formData.email)
      .single()

    if (existingRequest) {
      return { error: '이미 승인 요청이 제출된 이메일입니다.' }
    }

    // Create signup request
    const { error } = await supabase
      .from('signup_requests')
      .insert({
        full_name: formData.fullName,
        company: formData.company,
        job_title: formData.jobTitle,
        phone: formData.phone,
        email: formData.email,
        job_type: 'construction', // Default to construction
        status: 'pending',
        requested_at: new Date().toISOString()
      })

    if (error) {
      console.error('Signup request error:', error)
      return { error: '승인 요청 제출에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Signup request error:', error)
    return { error: '승인 요청 중 오류가 발생했습니다.' }
  }
}

export async function approveSignupRequest(requestId: string, adminUserId: string) {
  const supabase = createClient()
  const { supabaseAdmin } = await import('@/lib/supabase/admin')

  try {
    // console.log('Starting approval process for request:', requestId)
    
    // Get signup request details
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      console.error('Failed to fetch request:', fetchError)
      return { error: '승인 요청을 찾을 수 없습니다.' }
    }

    // Check if already processed
    if (request.status !== 'pending') {
      return { error: '이미 처리된 요청입니다.' }
    }

    // Generate temporary password
    const tempPassword = 'Temp' + Math.random().toString(36).slice(-6).toUpperCase() + '!2024'
    // console.log('Generated temporary password for', request.email)

    // Determine role based on job type
    let role: UserRole = 'worker'
    if (request.job_type === 'office') {
      role = 'customer_manager'
    }

    // Create user in Supabase Auth using admin client
    // console.log('Creating auth user for:', request.email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: request.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: request.full_name,
        phone: request.phone,
        role: role,
        company: request.company,
        job_title: request.job_title
      }
    })

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError)
      return { error: `사용자 계정 생성 실패: ${authError?.message || '알 수 없는 오류'}` }
    }
    // console.log('Auth user created successfully:', authData.user.id)

    // Determine organization and site assignment
    let organizationId = null
    let siteId = null
    let organizationName = ''
    let siteName = ''
    
    if (request.job_type === 'construction') {
      organizationId = '11111111-1111-1111-1111-111111111111' // INOPNC
      siteId = '33333333-3333-3333-3333-333333333333' // Default site
      organizationName = 'INOPNC'
      siteName = '본사'
    } else {
      organizationId = '22222222-2222-2222-2222-222222222222' // Customer
      organizationName = 'Customer Organization'
    }
    // console.log(`조직 할당: ${organizationName}${siteName ? `, 현장: ${siteName}` : ''}`)

    // Create profile
    // console.log('Creating user profile...')
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: request.email,
        full_name: request.full_name,
        phone: request.phone,
        role: role,
        organization_id: organizationId,
        site_id: siteId,
        status: 'active',
        company: request.company,
        job_title: request.job_title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { error: '사용자 프로필 생성에 실패했습니다.' }
    }
    // console.log('Profile created successfully')

    // Create user_organizations entry
    if (organizationId) {
      // console.log('Assigning to organization...')
      await supabase
        .from('user_organizations')
        .insert({
          user_id: authData.user.id,
          organization_id: organizationId,
          is_primary: true
        })
    }

    // Create site_assignments entry
    if (siteId) {
      // console.log('Assigning to site...')
      await supabase
        .from('site_assignments')
        .insert({
          user_id: authData.user.id,
          site_id: siteId,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
    }

    // Update signup request status
    // console.log('Updating request status to approved...')
    const { error: updateError } = await supabase
      .from('signup_requests')
      .update({
        status: 'approved',
        approved_by: adminUserId,
        approved_at: new Date().toISOString(),
        temporary_password: tempPassword
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Signup request update error:', updateError)
      return { error: '승인 처리 업데이트에 실패했습니다.' }
    }

    // console.log('Approval completed successfully')
    return { 
      success: true, 
      temporaryPassword: tempPassword,
      userEmail: request.email,
      message: `승인 완료: ${request.full_name} (${request.email})\n조직: ${organizationName}${siteName ? `\n현장: ${siteName}` : ''}\n임시 비밀번호: ${tempPassword}`
    }
  } catch (error) {
    console.error('Approve signup request error:', error)
    return { error: '승인 처리 중 오류가 발생했습니다.' }
  }
}

export async function rejectSignupRequest(requestId: string, adminUserId: string, reason?: string) {
  const supabase = createClient()

  try {
    // Get current request to check status
    const { data: request, error: fetchError } = await supabase
      .from('signup_requests')
      .select('status')
      .eq('id', requestId)
      .single()

    if (fetchError || !request) {
      return { error: '요청을 찾을 수 없습니다.' }
    }

    // Only allow rejection of pending requests
    if (request.status !== 'pending') {
      return { error: '대기중인 요청만 거절할 수 있습니다.' }
    }

    const { error } = await supabase
      .from('signup_requests')
      .update({
        status: 'rejected',
        rejected_by: adminUserId,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', requestId)

    if (error) {
      console.error('Reject signup request error:', error)
      return { error: '거절 처리에 실패했습니다.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Reject signup request error:', error)
    return { error: '거절 처리 중 오류가 발생했습니다.' }
  }
}

export async function getProfile() {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'Not authenticated' }
  }
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  
  if (profileError || !profile) {
    return { error: 'Profile not found' }
  }
  
  return { data: profile }
}