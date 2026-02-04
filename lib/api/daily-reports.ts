import { AdminIntegratedResponse } from '@/lib/daily-reports/unified-admin'

export const dailyReportApi = {
  /**
   * Fetch integrated daily report data for admin
   */
  async getAdminIntegrated(reportId: string): Promise<AdminIntegratedResponse> {
    const response = await fetch(
      `/api/admin/daily-reports/${encodeURIComponent(reportId)}/integrated`,
      {
        cache: 'no-store',
      }
    )
    if (!response.ok) throw new Error('작업일지 정보를 불러오지 못했습니다.')
    return response.json()
  },

  /**
   * Update daily report approval status
   */
  async updateStatus(reportId: string, action: 'approve' | 'revert' | 'reject', reason?: string) {
    const response = await fetch(
      `/api/admin/daily-reports/${encodeURIComponent(reportId)}/approval`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      }
    )
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || '상태 변경에 실패했습니다.')
    }
    return data
  },

  /**
   * Delete a single additional photo
   */
  async deletePhoto(photoId: string) {
    const response = await fetch(`/api/mobile/media/photos/${encodeURIComponent(photoId)}`, {
      method: 'DELETE',
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok || result?.error) {
      throw new Error(result?.error || '사진 삭제에 실패했습니다.')
    }
    return result
  },

  /**
   * Update additional photos order
   */
  async updatePhotosOrder(reportId: string, updates: { id: string; upload_order: number }[]) {
    const response = await fetch(
      `/api/admin/daily-reports/${encodeURIComponent(reportId)}/additional-photos/reorder`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      }
    )
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || '순서 변경 저장에 실패했습니다.')
    }
    return data
  },

  /**
   * Create a new daily report
   */
  async createReport(payload: any) {
    const response = await fetch('/api/admin/daily-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || '작업일지 저장에 실패했습니다.')
      ;(error as any).status = response.status
      ;(error as any).existingId = data?.existing_id
      throw error
    }
    return data
  },

  /**
   * Update an existing daily report
   */
  async updateReport(reportId: string, payload: any) {
    const response = await fetch(`/api/admin/daily-reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || '작업일지 저장에 실패했습니다.')
      ;(error as any).status = response.status
      ;(error as any).existingId = data?.existing_id
      throw error
    }
    return data
  },

  /**
   * Upload additional photos
   */
  async uploadAdditionalPhotos(reportId: string, beforeFiles: File[], afterFiles: File[]) {
    const formData = new FormData()
    beforeFiles.forEach(file => formData.append('before_photos', file))
    afterFiles.forEach(file => formData.append('after_photos', file))

    const response = await fetch(
      `/api/mobile/daily-reports/${encodeURIComponent(reportId)}/additional-photos`,
      {
        method: 'POST',
        body: formData,
      }
    )
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || '사진 업로드에 실패했습니다.')
    }
    return data
  },
}
