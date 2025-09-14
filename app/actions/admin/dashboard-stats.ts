'use server'


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

/**
 * Get dashboard statistics for admin
 */
export async function getDashboardStats(): Promise<AdminActionResult<DashboardStats>> {
  return withAdminAuth(async (supabase) => {
    try {
      // Get total users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get active sites count
      const { count: siteCount } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Get today's reports count
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: reportCount } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .gte('report_date', today.toISOString())

      // Get recent activities (combine from multiple sources)
      const activities: RecentActivity[] = []

      // Get recent daily reports
      const { data: recentReports } = await supabase
        .from('daily_reports')
        .select(`
          id,
          created_at,
          status,
          profiles!daily_reports_user_id_fkey (
            full_name
          ),
          sites!daily_reports_site_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentReports) {
        recentReports.forEach((report: unknown) => {
          const profile = report.profiles as unknown
          const site = report.sites as unknown
          activities.push({
            id: `report-${report.id}`,
            type: 'report_approval',
            title: '작업일지 ' + (report.status === 'approved' ? '승인' : '제출'),
            description: `${profile?.full_name || '알 수 없음'} - ${site?.name || '알 수 없음'}`,
            timestamp: report.created_at,
            icon: 'CheckCircle',
            iconColor: report.status === 'approved' ? 'text-green-500' : 'text-blue-500'
          })
        })
      }

      // Get recent user registrations
      const { data: recentUsers } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(2)

      if (recentUsers) {
        recentUsers.forEach((user: unknown) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registration',
            title: '신규 사용자 등록',
            description: `${user.full_name} - ${user.role === 'worker' ? '작업자' : user.role === 'site_manager' ? '현장관리자' : '관리자'}`,
            timestamp: user.created_at,
            icon: 'AlertCircle',
            iconColor: 'text-orange-500'
          })
        })
      }

      // Get recent photo grid uploads
      const { data: recentPhotos } = await supabase
        .from('photo_grids')
        .select(`
          id,
          created_at,
          component_name,
          profiles!photo_grids_uploaded_by_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(2)

      if (recentPhotos) {
        recentPhotos.forEach((photo: unknown) => {
          const profile = photo.profiles as unknown
          activities.push({
            id: `photo-${photo.id}`,
            type: 'photo_upload',
            title: '사진 업로드',
            description: `${profile?.full_name || '알 수 없음'} - ${photo.component_name}`,
            timestamp: photo.created_at,
            icon: 'TrendingUp',
            iconColor: 'text-blue-500'
          })
        })
      }

      // Sort activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )

      // Take only the most recent 5 activities
      const recentActivities = activities.slice(0, 5)

      return {
        success: true,
        data: {
          totalUsers: userCount || 0,
          activeSites: siteCount || 0,
          todayReports: reportCount || 0,
          recentActivities
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return {
        success: false,
        error: 'Failed to fetch dashboard statistics'
      }
    }
  })
}