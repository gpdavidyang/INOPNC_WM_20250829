'use client'

import { useCallback, useEffect, useState } from 'react'

export function useSiteDrawings(siteId: string) {
  const [drawings, setDrawings] = useState<any[]>([])
  const [markups, setMarkups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrawings = useCallback(async () => {
    try {
      const res = await fetch(`/api/docs/drawings?siteId=${encodeURIComponent(siteId)}&limit=100`, {
        cache: 'no-store',
      })
      const json = await res.json()
      if (res.ok && json?.success) setDrawings(json.data || [])
    } catch (e) {
      console.error(e)
    }
  }, [siteId])

  const fetchMarkups = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/markup-documents?site_id=${encodeURIComponent(siteId)}&limit=100`,
        { cache: 'no-store' }
      )
      const json = await res.json()
      if (res.ok && json?.success) setMarkups(json.data || [])
    } catch (e) {
      console.error(e)
    }
  }, [siteId])

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchDrawings(), fetchMarkups()])
      setLoading(false)
    }
    loadAll()
  }, [fetchDrawings, fetchMarkups])

  return {
    drawings,
    markups,
    loading,
    error,
    refreshDrawings: fetchDrawings,
    refreshMarkups: fetchMarkups,
  }
}
