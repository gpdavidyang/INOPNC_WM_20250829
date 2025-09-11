'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  NotificationExtended, 
  NotificationFilter,
  NotificationStats,
  CreateNotificationRequest 
} from '@/types/notifications'
import { 
  AppError, 
  ErrorType, 
  validateSupabaseResponse, 
  logError 
} from '@/lib/error-handling'

// 알림 목록 조회
export async function getNotifications(filter?: NotificationFilter) {
  try {
    const supabase = createClient()
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 필터 적용
    if (filter?.type) {
      query = query.eq('type', filter.type)
    }
    
    if (filter?.read !== undefined) {
      query = query.eq('is_read', filter.read)
    }
    
    if (filter?.start_date) {
      query = query.gte('created_at', filter.start_date)
    }
    
    if (filter?.end_date) {
      query = query.lte('created_at', filter.end_date)
    }

    // 모든 알림 조회 (만료 기능 비활성화)

    // 페이지네이션
    if (filter?.limit) {
      query = query.limit(filter.limit)
    }
    
    if (filter?.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1)
    }

    const { data, error } = await query

    validateSupabaseResponse(data, error)

    return { success: true, data: data as unknown as NotificationExtended[] }
  } catch (error) {
    logError(error, 'getNotifications')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림을 불러오는데 실패했습니다.' 
    }
  }
}

// 알림 통계 조회
export async function getNotificationStats(): Promise<{ success: boolean; data?: NotificationStats; error?: string }> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      // Log the specific authentication error for debugging
      console.warn('Auth error in getNotificationStats:', userError.message)
    }
    if (userError || !user) {
      return { 
        success: false, 
        error: '로그인이 필요합니다.' 
      }
    }

    // 전체 알림 수
    const { count: total } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // 읽지 않은 알림 수
    const { count: unread } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    // 타입별 알림 수
    const { data: typeData } = await supabase
      .from('notifications')
      .select('type')
      .eq('user_id', user.id)

    const by_type = typeData?.reduce((acc: any, item: any) => {
      acc[(item as any).type] = (acc[(item as any).type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    return { 
      success: true, 
      data: {
        total: total || 0,
        unread: unread || 0,
        by_type
      }
    }
  } catch (error) {
    logError(error, 'getNotificationStats')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 통계를 불러오는데 실패했습니다.' 
    }
  }
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .select()
      .single()

    validateSupabaseResponse(data, error)

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    logError(error, 'markNotificationAsRead')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 읽음 처리에 실패했습니다.' 
    }
  }
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .select()

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, count: data?.length || 0 }
  } catch (error) {
    logError(error, 'markAllNotificationsAsRead')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 읽음 처리에 실패했습니다.' 
    }
  }
}

// 알림 삭제
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    logError(error, 'deleteNotification')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 삭제에 실패했습니다.' 
    }
  }
}

// 알림 생성 (관리자용)
export async function createNotification(request: CreateNotificationRequest) {
  try {
    const supabase = createClient()
    
    // 권한 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'system_admin'].includes(profile.role)) {
      throw new AppError('권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    // 알림 생성 함수 호출
    const { data, error } = await (supabase as any).rpc('create_notification', {
      p_user_id: request.user_id,
      p_template_code: request.template_code,
      p_variables: request.variables || {},
      p_related_entity_type: request.related_entity_type,
      p_related_entity_id: request.related_entity_id,
      p_action_url: request.action_url
    })

    if (error) throw error

    revalidatePath('/dashboard')
    return { success: true, data }
  } catch (error) {
    logError(error, 'createNotification')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 생성에 실패했습니다.' 
    }
  }
}

// 알림 설정 조회
export async function getNotificationPreferences() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data, error } = await supabase
      .from('user_notification_preferences' as any)
      .select('*')
      .eq('user_id', user.id)

    if (error && error.code !== 'PGRST116') throw error // PGRST116: no rows returned

    return { success: true, data: data || [] }
  } catch (error) {
    logError(error, 'getNotificationPreferences')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 설정을 불러오는데 실패했습니다.' 
    }
  }
}

// 알림 설정 업데이트
export async function updateNotificationPreference(
  notificationType: string,
  settings: {
    enabled?: boolean
    email_enabled?: boolean
    push_enabled?: boolean
  }
) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data, error } = await supabase
      .from('user_notification_preferences' as any)
      .upsert({
        user_id: user.id,
        notification_type: notificationType,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,notification_type'
      })
      .select()
      .single()

    validateSupabaseResponse(data, error)

    return { success: true, data }
  } catch (error) {
    logError(error, 'updateNotificationPreference')
    return { 
      success: false, 
      error: error instanceof AppError ? error.message : '알림 설정 업데이트에 실패했습니다.' 
    }
  }
}