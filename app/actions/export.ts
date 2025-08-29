'use server'

import { createClient } from '@/lib/supabase/server'
import { getDailyReports } from './daily-reports'
import type { ExportOptions, ExportFormat } from '@/lib/export/types'
import { 
  AppError, 
  ErrorType, 
  validateSupabaseResponse, 
  logError 
} from '@/lib/error-handling'

export async function prepareExportData(options: ExportOptions) {
  try {
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    // Check user permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['site_manager', 'admin', 'system_admin'].includes(profile.role)) {
      throw new AppError('내보내기 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
    }

    // Prepare filters for getDailyReports
    const filters: any = {}
    
    if (options.dateRange) {
      filters.start_date = options.dateRange.start
      filters.end_date = options.dateRange.end
    }
    
    if (options.siteIds && options.siteIds.length > 0) {
      // For now, we'll handle single site. Multi-site support would need query modification
      filters.site_id = options.siteIds[0]
    }
    
    if (options.status && options.status.length > 0) {
      // For now, we'll handle single status. Multi-status support would need query modification
      filters.status = options.status[0]
    }

    // Get reports data
    const reportsResult = await getDailyReports(filters)
    if (!reportsResult.success || !reportsResult.data) {
      throw new AppError('데이터를 불러오는데 실패했습니다.', ErrorType.SERVER_ERROR)
    }

    // Get sites data
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')

    validateSupabaseResponse(sites, sitesError)

    return {
      success: true,
      data: {
        reports: reportsResult.data,
        sites: sites || [],
        options
      }
    }
  } catch (error) {
    logError(error, 'prepareExportData')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '데이터 준비에 실패했습니다.'
    }
  }
}

export async function getExportFormats() {
  return {
    success: true,
    data: [
      {
        format: 'excel' as ExportFormat,
        label: 'Excel 파일 (.xlsx)',
        description: '표 형태로 데이터를 정리하여 Excel에서 열어볼 수 있습니다',
        icon: 'FileSpreadsheet',
        features: ['요약 시트', '현장별 분석', '차트 생성 가능']
      },
      {
        format: 'pdf' as ExportFormat,
        label: 'PDF 파일 (.pdf)',
        description: '인쇄하기 좋은 형태로 보고서를 생성합니다',
        icon: 'FileText',
        features: ['인쇄 최적화', '요약 페이지', '읽기 전용']
      },
      {
        format: 'csv' as ExportFormat,
        label: 'CSV 파일 (.csv)',
        description: '간단한 표 형태로 다른 프로그램에서 가져오기 쉽습니다',
        icon: 'Download',
        features: ['경량 파일', '다양한 프로그램 호환', '한글 인코딩']
      }
    ]
  }
}

export async function logExportActivity(
  format: ExportFormat,
  recordCount: number,
  options: ExportOptions
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Log export activity
    const { error } = await supabase
      .from('activity_logs' as any)
      .insert({
        user_id: user.id,
        action: 'export_data',
        entity_type: 'daily_reports',
        entity_id: 'export',
        details: {
          format,
          record_count: recordCount,
          date_range: options.dateRange,
          site_ids: options.siteIds,
          status_filter: options.status
        }
      })

    if (error) {
      logError(error, 'logExportActivity')
    }
  } catch (error) {
    // Don't fail the export if logging fails
    logError(error, 'logExportActivity')
  }
}

export async function validateExportPermissions(targetSiteIds?: string[]) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new AppError('로그인이 필요합니다.', ErrorType.AUTHENTICATION, 401)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, site_ids')
      .eq('id', user.id)
      .single()

    if (!profile) {
      throw new AppError('사용자 정보를 찾을 수 없습니다.', ErrorType.NOT_FOUND, 404)
    }

    // System admin and admin can export all data
    if (['admin', 'system_admin'].includes((profile as any).role)) {
      return { success: true, canExportAll: true }
    }

    // Site managers can only export their assigned sites
    if ((profile as any).role === 'site_manager') {
      const userSiteIds = (profile as any).site_ids || []
      
      if (targetSiteIds && targetSiteIds.length > 0) {
        const hasPermission = targetSiteIds.every(siteId => userSiteIds.includes(siteId))
        if (!hasPermission) {
          throw new AppError('선택한 현장에 대한 내보내기 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
        }
      }
      
      return { 
        success: true, 
        canExportAll: false, 
        allowedSiteIds: userSiteIds 
      }
    }

    throw new AppError('데이터 내보내기 권한이 없습니다.', ErrorType.AUTHORIZATION, 403)
  } catch (error) {
    logError(error, 'validateExportPermissions')
    return {
      success: false,
      error: error instanceof AppError ? error.message : '권한 확인에 실패했습니다.'
    }
  }
}