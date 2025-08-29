import { createClient } from '@/lib/supabase/client'
import type { PhotoGridReport, PhotoGridPDFOptions, PhotoGridReportStats, Document } from '@/types'

const supabase = createClient()

// 공유문서함에 PDF 저장
async function saveToSharedDocuments(params: {
  title: string
  file_url: string
  file_name: string
  file_size: number
  site_name?: string
  daily_report_id: string
  photo_grid_report_id: string
}): Promise<void> {
  try {
    // 현재 사용자 정보 조회
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('사용자 정보를 찾을 수 없습니다.')

    // 작업일지에서 site_id 조회
    const { data: dailyReport } = await supabase
      .from('daily_reports')
      .select('site_id')
      .eq('id', params.daily_report_id)
      .single()
    
    const siteId = dailyReport?.site_id

    // documents 테이블에 저장 (공유문서함)
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        title: params.title,
        description: `사진대지 PDF - ${params.site_name || '현장'} (${new Date().toLocaleDateString('ko-KR')})`,
        file_url: params.file_url,
        file_name: params.file_name,
        file_size: params.file_size,
        mime_type: 'application/pdf',
        document_type: 'report' as const, // 보고서 타입
        folder_path: '/shared/photo-grid-reports', // 공유문서함 내 사진대지 폴더
        owner_id: user.id,
        is_public: false, // 사이트 멤버만 접근 가능
        site_id: siteId,
        // 메타데이터에 연관 정보 저장
        metadata: {
          photo_grid_report_id: params.photo_grid_report_id,
          daily_report_id: params.daily_report_id,
          generated_at: new Date().toISOString(),
          document_category: '사진대지PDF'
        }
      })
    
    if (docError) {
      console.error('문서함 저장 오류:', docError)
      throw docError
    }

    console.log('사진대지 PDF가 공유문서함에 저장되었습니다.')
  } catch (error) {
    console.error('공유문서함 저장 실패:', error)
    throw error
  }
}

// PDF 보고서 생성 및 저장
export async function createPhotoGridReport(
  dailyReportId: string,
  file: Blob,
  options: PhotoGridPDFOptions,
  metadata: {
    componentTypes: string[]
    processTypes: string[]
    totalPhotoGroups: number
    totalBeforePhotos: number
    totalAfterPhotos: number
  }
): Promise<{ success: boolean; data?: PhotoGridReport; error?: string }> {
  try {
    // 1. Supabase Storage에 파일 업로드
    const fileName = `photo-grid-${dailyReportId}-${Date.now()}.pdf`
    const filePath = `photo-grid-reports/${fileName}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      })
    
    if (uploadError) {
      console.error('File upload error:', uploadError)
      return { success: false, error: 'PDF 파일 업로드에 실패했습니다.' }
    }
    
    // 2. 업로드된 파일의 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)
    
    if (!urlData?.publicUrl) {
      return { success: false, error: 'PDF 파일 URL 생성에 실패했습니다.' }
    }
    
    // 3. 데이터베이스에 레코드 생성
    const { data: reportData, error: dbError } = await supabase
      .from('photo_grid_reports')
      .insert({
        daily_report_id: dailyReportId,
        title: options.title || '사진대지양식',
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: 'application/pdf',
        total_photo_groups: metadata.totalPhotoGroups,
        total_before_photos: metadata.totalBeforePhotos,
        total_after_photos: metadata.totalAfterPhotos,
        component_types: metadata.componentTypes,
        process_types: metadata.processTypes,
        generation_method: options.generationMethod,
        pdf_options: {
          siteName: options.siteName,
          reportDate: options.reportDate,
          reporterName: options.reporterName,
          includeMetadata: options.includeMetadata,
          compression: options.compression
        }
      })
      .select()
      .single()
    
    if (dbError) {
      console.error('Database error:', dbError)
      // 실패 시 업로드된 파일 정리
      await supabase.storage.from('documents').remove([filePath])
      return { success: false, error: 'PDF 정보 저장에 실패했습니다.' }
    }
    
    // 4. 공유문서함에도 자동 저장
    try {
      await saveToSharedDocuments({
        title: `${options.title || '사진대지양식'}_${options.reportDate}`,
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_size: file.size,
        site_name: options.siteName,
        daily_report_id: dailyReportId,
        photo_grid_report_id: reportData.id
      })
    } catch (docError) {
      console.warn('공유문서함 저장 실패 (PDF는 정상 생성됨):', docError)
      // 공유문서함 저장 실패는 무시하고 진행 (PDF는 이미 생성됨)
    }
    
    return { success: true, data: reportData }
  } catch (error) {
    console.error('Create photo grid report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 생성 중 오류가 발생했습니다.' 
    }
  }
}

// PDF 보고서 목록 조회
export async function getPhotoGridReports(
  filters?: {
    dailyReportId?: string
    status?: string
    generatedBy?: string
    siteId?: string
  }
): Promise<PhotoGridReport[]> {
  try {
    let query = supabase
      .from('photo_grid_reports')
      .select(`
        *,
        daily_report:daily_reports(
          id,
          work_date,
          member_name,
          process_type,
          site:sites(
            id,
            name
          )
        ),
        generated_by_profile:profiles!generated_by(
          id,
          full_name,
          email
        ),
        last_downloaded_by_profile:profiles!last_downloaded_by(
          id,
          full_name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (filters?.dailyReportId) {
      query = query.eq('daily_report_id', filters.dailyReportId)
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    if (filters?.generatedBy) {
      query = query.eq('generated_by', filters.generatedBy)
    }
    
    if (filters?.siteId) {
      query = query.eq('daily_report.site_id', filters.siteId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Get photo grid reports error:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Get photo grid reports error:', error)
    return []
  }
}

// PDF 보고서 상세 조회
export async function getPhotoGridReport(id: string): Promise<PhotoGridReport | null> {
  try {
    const { data, error } = await supabase
      .from('photo_grid_reports')
      .select(`
        *,
        daily_report:daily_reports(
          id,
          work_date,
          member_name,
          process_type,
          site:sites(
            id,
            name
          )
        ),
        generated_by_profile:profiles!generated_by(
          id,
          full_name,
          email
        ),
        last_downloaded_by_profile:profiles!last_downloaded_by(
          id,
          full_name
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Get photo grid report error:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Get photo grid report error:', error)
    return null
  }
}

// PDF 다운로드 추적
export async function trackPhotoGridReportDownload(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('photo_grid_reports')
      .update({
        download_count: supabase.raw('download_count + 1'),
        last_downloaded_at: new Date().toISOString(),
        last_downloaded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id)
    
    if (error) {
      console.error('Track download error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Track download error:', error)
    return false
  }
}

// PDF 보고서 업데이트
export async function updatePhotoGridReport(
  id: string,
  updates: Partial<PhotoGridReport>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('photo_grid_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('Update photo grid report error:', error)
      return { success: false, error: 'PDF 정보 업데이트에 실패했습니다.' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Update photo grid report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 업데이트 중 오류가 발생했습니다.' 
    }
  }
}

// PDF 보고서 삭제 (소프트 삭제)
export async function deletePhotoGridReport(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 소프트 삭제: 상태를 'deleted'로 변경
    const { error } = await supabase
      .from('photo_grid_reports')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) {
      console.error('Delete photo grid report error:', error)
      return { success: false, error: 'PDF 삭제에 실패했습니다.' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Delete photo grid report error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 삭제 중 오류가 발생했습니다.' 
    }
  }
}

// PDF 보고서 물리적 삭제 (Admin 전용)
export async function permanentlyDeletePhotoGridReport(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 파일 정보 조회
    const { data: report, error: fetchError } = await supabase
      .from('photo_grid_reports')
      .select('file_url, file_name')
      .eq('id', id)
      .single()
    
    if (fetchError || !report) {
      return { success: false, error: 'PDF 정보를 찾을 수 없습니다.' }
    }
    
    // 2. Storage에서 파일 삭제
    const filePath = `photo-grid-reports/${report.file_name}`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([filePath])
    
    if (storageError) {
      console.warn('Storage file delete warning:', storageError)
      // Storage 삭제 실패해도 DB 레코드는 삭제 진행
    }
    
    // 3. DB에서 레코드 삭제
    const { error: deleteError } = await supabase
      .from('photo_grid_reports')
      .delete()
      .eq('id', id)
    
    if (deleteError) {
      console.error('Permanent delete error:', deleteError)
      return { success: false, error: 'PDF 완전 삭제에 실패했습니다.' }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Permanent delete error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'PDF 완전 삭제 중 오류가 발생했습니다.' 
    }
  }
}

// PDF 보고서 통계 조회
export async function getPhotoGridReportStats(): Promise<PhotoGridReportStats | null> {
  try {
    const { data, error } = await supabase
      .from('photo_grid_reports')
      .select('*')
      .eq('status', 'active')
    
    if (error || !data) {
      console.error('Get stats error:', error)
      return null
    }
    
    // 통계 계산
    const stats: PhotoGridReportStats = {
      total_reports: data.length,
      total_file_size: data.reduce((sum, report) => sum + (report.file_size || 0), 0),
      total_downloads: data.reduce((sum, report) => sum + (report.download_count || 0), 0),
      reports_by_method: data.reduce((acc, report) => {
        const method = report.generation_method || 'canvas'
        acc[method] = (acc[method] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      reports_by_status: data.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      average_file_size: data.length > 0 
        ? Math.round(data.reduce((sum, report) => sum + (report.file_size || 0), 0) / data.length)
        : 0,
      most_downloaded: data.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))[0] || null,
      recent_reports: data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
    }
    
    return stats
  } catch (error) {
    console.error('Get stats error:', error)
    return null
  }
}

// 작업일지별 PDF 개수 업데이트 (필요시 수동 실행)
export async function updateDailyReportPdfCounts(): Promise<{ success: boolean; updated: number }> {
  try {
    const { data: reports, error: fetchError } = await supabase
      .from('daily_reports')
      .select('id')
    
    if (fetchError || !reports) {
      return { success: false, updated: 0 }
    }
    
    let updated = 0
    
    for (const report of reports) {
      const { count } = await supabase
        .from('photo_grid_reports')
        .select('*', { count: 'exact', head: true })
        .eq('daily_report_id', report.id)
        .eq('status', 'active')
      
      const { error: updateError } = await supabase
        .from('daily_reports')
        .update({
          has_photo_grid_pdf: (count || 0) > 0,
          photo_grid_pdf_count: count || 0
        })
        .eq('id', report.id)
      
      if (!updateError) {
        updated++
      }
    }
    
    return { success: true, updated }
  } catch (error) {
    console.error('Update counts error:', error)
    return { success: false, updated: 0 }
  }
}