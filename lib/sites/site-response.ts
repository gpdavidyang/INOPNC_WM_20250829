'use server'

import type { SupabaseClient } from '@supabase/supabase-js'

export const ORGANIZATION_UNASSIGNED_LABEL = '소속사 미지정'
export const ORGANIZATION_UNKNOWN_LABEL = '소속사 정보 없음'

export interface SiteLike {
  id: string
  name: string
  organization_id?: string | null
  organization_name?: string | null
  [key: string]: any
}

/**
 * Attaches organization names to the provided site list.
 * Ensures every site has `organization_id` (nullable) and an `organization_name` label.
 */
export async function withOrganizationMeta<T extends SiteLike>(
  supabase: SupabaseClient,
  sites: T[]
): Promise<Array<T & { organization_id: string | null; organization_name: string }>> {
  if (!Array.isArray(sites) || sites.length === 0) {
    return []
  }

  const orgIds = Array.from(
    new Set(
      sites
        .map(site => (site.organization_id ? String(site.organization_id) : null))
        .filter(Boolean) as string[]
    )
  )

  const map = new Map<string, string>()
  if (orgIds.length > 0) {
    const { data } = await supabase.from('organizations').select('id, name').in('id', orgIds)
    if (Array.isArray(data)) {
      data.forEach(row => {
        if (row?.id) {
          map.set(String(row.id), row?.name || '')
        }
      })
    }
  }

  return sites.map(site => {
    const organizationId = site.organization_id ? String(site.organization_id) : null
    const organizationNameFromSite = site.organization_name || site.organizations?.name || ''
    const organizationName = organizationNameFromSite
      ? organizationNameFromSite
      : organizationId
        ? map.get(organizationId) || ORGANIZATION_UNKNOWN_LABEL
        : ORGANIZATION_UNASSIGNED_LABEL

    return {
      ...site,
      organization_id: organizationId,
      organization_name: organizationName,
    }
  })
}
