'use client'

import React, { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'

interface Site {
  id: string
  name: string
}

interface SiteFilterProps {
  selectedSite: string
  onSiteChange: (siteId: string) => void
}

export default function SiteFilter({ selectedSite, onSiteChange }: SiteFilterProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSites()
  }, [])

  const fetchSites = async () => {
    try {
      // Get user information for authentication
      const userResponse = await fetch('/api/auth/user')
      const userData = await userResponse.json()

      if (!userData?.user?.id) {
        console.error('User not authenticated')
        // Fallback to mock data if authentication fails
        const mockSites: Site[] = [
          { id: 'site1', name: '삼성 평택' },
          { id: 'site2', name: 'LG 청주' },
          { id: 'site3', name: 'SK 울산' },
          { id: 'site4', name: '현대 아산' },
        ]
        setSites(mockSites)
        return
      }

      // Try to fetch from partner sites API
      const response = await fetch('/api/partner/sites')

      if (response.ok) {
        const data = await response.json()
        const sitesData = data.sites || data || []

        const transformedSites: Site[] = sitesData.map((site: any) => ({
          id: site.id || site.site_id,
          name: site.name || site.site_name || '현장',
        }))

        setSites(transformedSites)
      } else {
        // Fallback to mock data if API fails
        const mockSites: Site[] = [
          { id: 'site1', name: '삼성 평택' },
          { id: 'site2', name: 'LG 청주' },
          { id: 'site3', name: 'SK 울산' },
          { id: 'site4', name: '현대 아산' },
        ]
        setSites(mockSites)
      }
    } catch (error) {
      console.error('Failed to fetch sites:', error)
      // Fallback to mock data on error
      const mockSites: Site[] = [
        { id: 'site1', name: '삼성 평택' },
        { id: 'site2', name: 'LG 청주' },
        { id: 'site3', name: 'SK 울산' },
        { id: 'site4', name: '현대 아산' },
      ]
      setSites(mockSites)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <select
          value={selectedSite}
          onChange={e => onSiteChange(e.target.value)}
          className="
            px-3 py-2 pr-8
            bg-white dark:bg-gray-700
            border border-gray-300 dark:border-gray-600
            rounded-lg
            text-sm text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500
            appearance-none
            cursor-pointer
          "
          disabled={loading}
        >
          <option value="">전체 현장</option>
          {sites.map(site => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
