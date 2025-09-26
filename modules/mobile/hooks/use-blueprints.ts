'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface BlueprintItem {
  id: string
  title: string
  fileUrl: string
  uploadDate: string
  isPrimary: boolean
}

async function fetchSiteBlueprints(siteId: string): Promise<BlueprintItem[]> {
  const res = await fetch(`/api/partner/sites/${siteId}/documents?type=drawing`, {
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok || json?.error) throw new Error(json?.error || '공도면 조회 실패')
  const docs: any[] = json?.data?.documents || []
  return docs
    .filter(
      d =>
        d.categoryType === 'drawing' &&
        (d.subType === 'blueprint' || d.document_type === 'blueprint' || true)
    )
    .map(d => ({
      id: d.id,
      title: d.title || d.name || '공도면',
      fileUrl: d.fileUrl,
      uploadDate: d.uploadDate,
      isPrimary: !!(d.is_primary_blueprint || d.isPrimary || d.metadata?.is_primary),
    }))
}

export function useSiteBlueprints(siteId?: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['partner-site-documents', siteId, 'blueprint'],
    queryFn: () => fetchSiteBlueprints(siteId as string),
    enabled: !!siteId,
    staleTime: 60_000,
  })

  const prefetch = async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: ['partner-site-documents', id, 'blueprint'],
      queryFn: () => fetchSiteBlueprints(id),
      staleTime: 60_000,
    })
  }

  return { ...query, prefetch }
}
