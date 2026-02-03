'use client'

import type { Site } from '@/types'
import type { UnifiedDailyReport } from '@/types/daily-reports'
import { useEffect, useMemo, useState } from 'react'

export const useDailyReportSite = (
  sites: Site[],
  formData: { site_id: string },
  reportData: any,
  initialUnifiedReport: UnifiedDailyReport | undefined,
  setFormData: React.Dispatch<React.SetStateAction<any>>
) => {
  const [filteredSites, setFilteredSites] = useState<Site[]>(sites)

  const selectedSiteId = useMemo(() => {
    const reportSiteId = reportData?.site_id
    const initialSiteId = initialUnifiedReport?.siteId
    return formData.site_id || reportSiteId || initialSiteId || ''
  }, [formData.site_id, reportData?.site_id, initialUnifiedReport?.siteId])

  const selectedSiteRecord = useMemo(() => {
    if (!selectedSiteId) return null
    const normalizedId = String(selectedSiteId)
    return (
      filteredSites.find(site => String(site?.id) === normalizedId) ||
      sites.find(site => String(site?.id) === normalizedId) ||
      null
    )
  }, [selectedSiteId, filteredSites, sites])

  // Ensure current site is in the list
  useEffect(() => {
    const currentSiteId =
      formData.site_id ||
      reportData?.site_id ||
      (initialUnifiedReport ? (initialUnifiedReport as any).siteId : '')

    if (!currentSiteId) {
      setFilteredSites(sites)
      return
    }

    const hasSite = sites.some(site => String(site?.id) === String(currentSiteId))
    if (!hasSite) {
      const fallback = sites.find(site => String(site.id) === String(currentSiteId))
      if (fallback) {
        setFilteredSites([...sites, fallback])
      } else {
        setFilteredSites(sites)
      }
    } else {
      setFilteredSites(sites)
    }
  }, [sites, formData.site_id, reportData?.site_id, initialUnifiedReport])

  // Update partner company when site changes
  useEffect(() => {
    setFormData((prev: any) => {
      const nextPartnerId = selectedSiteRecord?.organization_id
        ? String(selectedSiteRecord.organization_id)
        : ''
      if ((prev.partner_company_id || '') === nextPartnerId) {
        return prev
      }
      return { ...prev, partner_company_id: nextPartnerId }
    })
  }, [selectedSiteRecord, setFormData])

  return {
    filteredSites,
    selectedSiteId,
    selectedSiteRecord,
  }
}
