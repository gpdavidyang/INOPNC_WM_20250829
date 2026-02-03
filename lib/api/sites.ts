export interface SiteSearchParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort?: string
  direction?: 'asc' | 'desc'
}

export const sitesApi = {
  /**
   * Fetch paginated sites
   */
  async getSites(params: SiteSearchParams) {
    const urlParams = new URLSearchParams()
    if (params.page) urlParams.set('page', String(params.page))
    if (params.limit) urlParams.set('limit', String(params.limit))
    if (params.search) urlParams.set('search', params.search)
    if (params.status && params.status !== 'all') urlParams.set('status', params.status)
    if (params.sort) urlParams.set('sort', params.sort)
    if (params.direction) urlParams.set('direction', params.direction)

    const response = await fetch(`/api/admin/sites?${urlParams.toString()}`, { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '현장 목록을 불러오지 못했습니다.')
    }
    return payload.data
  },

  /**
   * Fetch site managers for a list of site IDs
   */
  async getSiteManagers(ids: string[]) {
    if (ids.length === 0) return {}
    const response = await fetch(`/api/admin/sites/managers?ids=${ids.join(',')}`, {
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '관리자 정보를 불러오지 못했습니다.')
    }
    return payload.data
  },

  /**
   * Fetch site statistics for a list of site IDs
   */
  async getSiteStats(ids: string[]) {
    if (ids.length === 0) return {}
    const response = await fetch(`/api/admin/sites/stats?ids=${ids.join(',')}`, {
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '현장 통계를 불러오지 못했습니다.')
    }
    return payload.data
  },

  /**
   * Delete a site
   */
  async deleteSite(id: string) {
    const response = await fetch(`/api/admin/sites/${id}`, { method: 'DELETE' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok || payload?.success === false) {
      if (response.status === 409) {
        throw new Error(payload?.error || '현장에 연결된 데이터가 있어 삭제할 수 없습니다.')
      }
      throw new Error(payload?.error || '삭제 실패')
    }
    return payload
  },

  /**
   * Fetch shared documents for a site
   */
  async getSharedDocuments(siteId: string, category: string = 'shared') {
    const params = new URLSearchParams({ category, limit: '200' })
    const response = await fetch(`/api/admin/sites/${siteId}/documents?${params.toString()}`, {
      cache: 'no-store',
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '공유자료 목록을 불러오지 못했습니다.')
    }
    return payload.data
  },

  /**
   * Upload a shared document
   */
  async uploadSharedDocument(siteId: string, data: FormData) {
    const response = await fetch(`/api/admin/sites/${siteId}/documents`, {
      method: 'POST',
      body: data,
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '문서 업로드에 실패했습니다.')
    }
    return payload.data
  },

  /**
   * Delete a shared document
   */
  async deleteSharedDocument(siteId: string, docId: string) {
    const params = new URLSearchParams({ id: docId })
    const response = await fetch(`/api/admin/sites/${siteId}/documents?${params.toString()}`, {
      method: 'DELETE',
    })
    const payload = await response.json()
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || '문서 삭제에 실패했습니다.')
    }
    return payload
  },

  /**
   * Fetch organizations
   */
  async getOrganizations() {
    const response = await fetch('/api/admin/organizations', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok || !Array.isArray(payload?.organizations)) {
      throw new Error(payload?.error || '소속 목록을 불러오지 못했습니다.')
    }
    return payload.organizations
  },

  /**
   * Create or update a site
   */
  async saveSite(id: string | undefined, payload: any) {
    const method = id ? 'PATCH' : 'POST'
    const url = id ? `/api/admin/sites/${id}` : '/api/admin/sites'
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await response.json()
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || '현장 저장에 실패했습니다.')
    }
    return data.data
  },
}
