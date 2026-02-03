'use server'

import { type SimpleAuth } from '@/lib/auth/ultra-simple'
import { AppError, ErrorType } from '@/lib/error-handling'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  AdminErrors,
  requireRestrictedOrgId,
  resolveAdminError,
  withAdminAuth,
  type AdminActionResult,
} from './common'

export interface DashboardStats {
  totalUsers: number
  activeSites: number
  todayReports: number
  recentActivities: RecentActivity[]
}

export interface RecentActivity {
  id: string
  type: 'report_approval' | 'user_registration' | 'material_entry' | 'site_update' | 'photo_upload'
  title: string
  description: string
  timestamp: string
  icon: string
  iconColor: string
}

type AdminSupabaseClient = SupabaseClient<Database>

interface AccessibleSiteContext {
  restrictedOrgId: string
  accessibleSiteIds: string[]
  activeSiteCount: number
}

async function getAccessibleSiteContext(
  supabase: AdminSupabaseClient,
  auth: SimpleAuth
): Promise<AccessibleSiteContext | null> {
  if (!auth.isRestricted) {
    return null
  }

  const restrictedOrgId = requireRestrictedOrgId(auth)
  const { data, error } = await supabase
    .from('sites')
    .select('id, status, is_deleted')
    .eq('organization_id', restrictedOrgId)

  if (error) {
    throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
  }

  const records = (data || []) as Array<{
    id: string
    status?: string | null
    is_deleted?: boolean | null
  }>
  return {
    restrictedOrgId,
    accessibleSiteIds: records.map(record => record.id),
    activeSiteCount: records.filter(
      record => record.status === 'active' && record.is_deleted !== true
    ).length,
  }
}

function filterPhotosByOrganization(photos: any[] | null | undefined, restrictedOrgId?: string) {
  if (!restrictedOrgId) {
    return photos || []
  }

  return (photos || []).filter(photo => {
    const siteOrg = photo.site?.organization_id
    const profileOrg = photo.profiles?.organization_id
    return siteOrg === restrictedOrgId || profileOrg === restrictedOrgId
  })
}

export async function getDashboardStats(): Promise<AdminActionResult<DashboardStats>> {
  return withAdminAuth(async (supabase, profile) => {
    try {
      const auth = profile.auth
      const siteContext = await getAccessibleSiteContext(supabase, auth)
      const restrictedOrgId = siteContext?.restrictedOrgId
      const accessibleSiteIds = siteContext?.accessibleSiteIds ?? null

      // Total users count scoped by organization when restricted
      const userBaseQuery = supabase.from('profiles').select('*', { count: 'exact', head: true })

      const userResult = restrictedOrgId
        ? await userBaseQuery.eq('organization_id', restrictedOrgId)
        : await userBaseQuery

      if (userResult.error) {
        throw new AppError('사용자 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
      }

      const totalUsers = userResult.count || 0

      // Active sites count
      const activeSites = restrictedOrgId
        ? siteContext?.activeSiteCount || 0
        : await (async () => {
            const { count, error } = await supabase
              .from('sites')
              .select('id', { count: 'exact' })
              .eq('status', 'active')
              .eq('is_deleted', false)
              .limit(1)

            if (error) {
              throw new AppError('현장 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
            }

            return count || 0
          })()

      // Today's daily reports
      const todayKST = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Seoul',
      }).format(new Date())

      let todayReports = 0
      if (restrictedOrgId) {
        if (accessibleSiteIds && accessibleSiteIds.length > 0) {
          const reportQuery = supabase
            .from('daily_reports')
            .select('id', { count: 'exact' })
            .eq('work_date', todayKST)
            .in('site_id', accessibleSiteIds)
            .limit(1)

          const { count, error } = await reportQuery
          if (error) {
            console.error('[dashboard-stats] reportQuery (restricted) error:', error)
            throw new AppError('작업일지 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
          }
          todayReports = count || 0
        }
      } else {
        const { count, error } = await supabase
          .from('daily_reports')
          .select('id', { count: 'exact' })
          .eq('work_date', todayKST)
          .limit(1)

        if (error) {
          console.error('[dashboard-stats] reportQuery (total) error:', error)
          throw new AppError('작업일지 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
        }
        todayReports = count || 0
      }

      const activities: RecentActivity[] = []

      // Recent reports scoped by organization
      let recentReportsData: any[] = []
      if (!restrictedOrgId || (accessibleSiteIds && accessibleSiteIds.length > 0)) {
        let reportsQuery = supabase
          .from('daily_reports')
          .select(
            `
            id,
            created_at,
            status,
            site_id,
            created_by_profile:profiles!daily_reports_created_by_fkey(full_name),
            site:sites(name, organization_id)
          `
          )
          .order('created_at', { ascending: false })
          .limit(3)

        if (restrictedOrgId && accessibleSiteIds) {
          reportsQuery = reportsQuery.in('site_id', accessibleSiteIds)
        }

        const { data: reports, error } = await reportsQuery
        if (error) {
          console.error('[dashboard-stats] reportsQuery error:', error)
          throw new AppError('작업일지 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
        }

        recentReportsData = reports || []
      }

      recentReportsData.forEach(report => {
        const profileData = report.profiles as { full_name?: string } | undefined
        const siteData = report.site as { name?: string } | undefined
        activities.push({
          id: `report-${report.id}`,
          type: 'report_approval',
          title: '작업일지 ' + (report.status === 'approved' ? '승인' : '제출'),
          description: `${profileData?.full_name || '알 수 없음'} - ${siteData?.name || '알 수 없음'}`,
          timestamp: report.created_at,
          icon: 'CheckCircle',
          iconColor: report.status === 'approved' ? 'text-green-500' : 'text-blue-500',
        })
      })

      // Recent user registrations scoped by organization
      let recentUsersData: any[] = []
      const recentUsersQuery = supabase
        .from('profiles')
        .select('id, full_name, role, created_at, organization_id')
        .order('created_at', { ascending: false })
        .limit(2)

      const { data: recentUsers, error: recentUsersError } = restrictedOrgId
        ? await recentUsersQuery.eq('organization_id', restrictedOrgId)
        : await recentUsersQuery

      if (recentUsersError) {
        throw new AppError('사용자 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
      }

      recentUsersData = recentUsers || []

      recentUsersData.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_registration',
          title: '신규 사용자 등록',
          description: `${user.full_name} - ${
            user.role === 'worker'
              ? '작업자'
              : user.role === 'site_manager'
                ? '현장관리자'
                : '관리자'
          }`,
          timestamp: user.created_at,
          icon: 'AlertCircle',
          iconColor: 'text-orange-500',
        })
      })

      // Recent photo uploads scoped by organization
      const photosQuery = supabase
        .from('photo_sheets')
        .select(
          `
          id,
          title,
          created_at,
          status,
          site_id,
          profiles(full_name, organization_id),
          site:sites(name, organization_id)
        `
        )
        .order('created_at', { ascending: false })
        .limit(2)

      const { data: rawPhotos, error: photosError } = await photosQuery

      if (photosError) {
        throw new AppError('사진 정보를 확인할 수 없습니다.', ErrorType.SERVER_ERROR, 500)
      }

      const recentPhotos = filterPhotosByOrganization(rawPhotos, restrictedOrgId)

      recentPhotos.forEach(photo => {
        const profileData = photo.profiles as { full_name?: string } | undefined
        activities.push({
          id: `photo-${photo.id}`,
          type: 'photo_upload',
          title: '사진대지 등록',
          description: `${profileData?.full_name || '알 수 없음'} - ${photo.title || ''}`,
          timestamp: photo.created_at,
          icon: 'TrendingUp',
          iconColor: 'text-blue-500',
        })
      })

      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return {
        success: true,
        data: {
          totalUsers,
          activeSites,
          todayReports,
          recentActivities: activities.slice(0, 5),
        },
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        success: false,
        error: resolveAdminError(error, AdminErrors.UNKNOWN_ERROR),
      }
    }
  })
}
