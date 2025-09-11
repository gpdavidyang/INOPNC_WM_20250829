import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QueryClient, useQueryClient } from '@tanstack/react-query'

interface UseSalaryRealtimeProps {
  userId?: string
  siteId?: string
  enabled?: boolean
}

/**
 * 급여 데이터 실시간 구독 훅
 * Supabase Realtime을 사용하여 급여 변경사항을 실시간으로 감지
 */
export function useSalaryRealtime({ 
  userId, 
  siteId, 
  enabled = true 
}: UseSalaryRealtimeProps) {
  // Safely get queryClient - returns null if not in provider context
  let queryClient: QueryClient | null = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    // Hook is being used outside of QueryClientProvider
    // This can happen during SSR or when the component tree isn't fully mounted
    console.warn('[useSalaryRealtime] QueryClient not available - realtime updates disabled')
  }
  
  const supabase = createClient()

  const handleSalaryUpdate = useCallback((payload: any) => {
    console.log('급여 데이터 업데이트 감지:', payload)
    
    // Only invalidate if queryClient is available
    if (!queryClient) return
    
    // 캐시 무효화
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['salary', userId] })
      queryClient.invalidateQueries({ queryKey: ['salary-history', userId] })
    }
    
    if (siteId) {
      queryClient.invalidateQueries({ queryKey: ['team-salary', siteId] })
    }
    
    // 전역 급여 관련 쿼리 무효화
    queryClient.invalidateQueries({ queryKey: ['salary-stats'] })
  }, [userId, siteId, queryClient])

  useEffect(() => {
    if (!enabled || !queryClient) return

    const channels: any[] = []

    // salary_records 테이블 구독
    if (userId) {
      const userChannel = supabase
        .channel(`salary-updates-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'salary_records',
            filter: `worker_id=eq.${userId}`
          },
          handleSalaryUpdate
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'salary_info',
            filter: `user_id=eq.${userId}`
          },
          handleSalaryUpdate
        )
        .subscribe()

      channels.push(userChannel)
    }

    // work_records 테이블 구독 (급여 계산에 영향)
    if (userId) {
      const workChannel = supabase
        .channel(`work-updates-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'work_records',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('근무 기록 업데이트 감지 (user_id):', payload)
            // 근무 기록 변경 시 급여 재계산 필요
            handleSalaryUpdate(payload)
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'work_records',
            filter: `profile_id=eq.${userId}`
          },
          (payload) => {
            console.log('근무 기록 업데이트 감지 (profile_id):', payload)
            // 근무 기록 변경 시 급여 재계산 필요
            handleSalaryUpdate(payload)
          }
        )
        .subscribe()

      channels.push(workChannel)
    }

    // 현장별 구독 (현장관리자용)
    if (siteId) {
      const siteChannel = supabase
        .channel(`site-salary-updates-${siteId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'salary_records',
            filter: `site_id=eq.${siteId}`
          },
          handleSalaryUpdate
        )
        .subscribe()

      channels.push(siteChannel)
    }

    // 정리 함수
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [userId, siteId, enabled, handleSalaryUpdate, supabase])

  return {
    // 수동으로 급여 데이터 새로고침
    refreshSalary: () => {
      if (!queryClient) return
      
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['salary', userId] })
        queryClient.invalidateQueries({ queryKey: ['salary-history', userId] })
      }
      if (siteId) {
        queryClient.invalidateQueries({ queryKey: ['team-salary', siteId] })
      }
    }
  }
}

/**
 * 급여 계산 규칙 실시간 구독 훅
 * 관리자가 급여 규칙을 변경하면 모든 사용자에게 실시간 반영
 */
export function useSalaryRulesRealtime(enabled = true) {
  // Safely get queryClient - returns null if not in provider context
  let queryClient: QueryClient | null = null
  try {
    queryClient = useQueryClient()
  } catch (error) {
    console.warn('[useSalaryRulesRealtime] QueryClient not available - realtime updates disabled')
  }
  
  const supabase = createClient()

  useEffect(() => {
    if (!enabled || !queryClient) return

    const channel = supabase
      .channel('salary-rules-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salary_calculation_rules'
        },
        (payload) => {
          console.log('급여 계산 규칙 업데이트:', payload)
          // 모든 급여 관련 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['salary'] })
          queryClient.invalidateQueries({ queryKey: ['salary-rules'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employment_tax_rates'
        },
        (payload) => {
          console.log('세율 정보 업데이트:', payload)
          // 세금 계산 관련 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ['salary'] })
          queryClient.invalidateQueries({ queryKey: ['tax-rates'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient, supabase])
}