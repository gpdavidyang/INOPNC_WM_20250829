'use client'

import {
  PHOTO_SHEET_PRESETS,
  type GridPreset,
  type Orientation,
} from '@/components/photo-sheet/presets'
import { useCallback, useEffect, useMemo, useState } from 'react'

export interface Tile {
  id: string
  member?: string
  process?: string
  content?: string
  stage?: 'before' | 'after'
  file?: File
  previewUrl?: string
}

export interface WorkOption {
  id: string
  option_type: 'component_type' | 'process_type'
  option_label: string
}

export function usePhotoSheetEditor(externalSheetId?: string) {
  const [siteId, setSiteId] = useState('')
  const [siteName, setSiteName] = useState('')
  const [title, setTitle] = useState('사진대지')
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [presetId, setPresetId] = useState<string>('2x2')
  const [sheetId, setSheetId] = useState<string>('')

  const [saving, setSaving] = useState(false)
  const [loadingSheet, setLoadingSheet] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'error'>('info')

  const [sites, setSites] = useState<any[]>([])
  const [componentOptions, setComponentOptions] = useState<WorkOption[]>([])
  const [processOptions, setProcessOptions] = useState<WorkOption[]>([])

  const [bulkMember, setBulkMember] = useState('')
  const [bulkProcess, setBulkProcess] = useState('')

  const preset = useMemo<GridPreset>(
    () => PHOTO_SHEET_PRESETS.find(p => p.id === presetId) || PHOTO_SHEET_PRESETS[3],
    [presetId]
  )

  const photosPerPage = useMemo(() => Math.max(1, preset.rows * preset.cols), [preset])
  const [tiles, setTiles] = useState<Tile[]>(() =>
    Array.from({ length: photosPerPage }, (_, i) => ({ id: String(i) }))
  )

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(tiles.length / photosPerPage)),
    [tiles.length, photosPerPage]
  )

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sitesRes, compRes, procRes] = await Promise.all([
          fetch('/api/sites?status=all', { cache: 'no-store' }),
          fetch('/api/admin/work-options?option_type=component_type', { cache: 'no-store' }),
          fetch('/api/admin/work-options?option_type=process_type', { cache: 'no-store' }),
        ])
        const [sitesData, compData, procData] = await Promise.all([
          sitesRes.json(),
          compRes.json(),
          procRes.json(),
        ])
        setSites(sitesData?.data || [])
        setComponentOptions(Array.isArray(compData) ? compData : [])
        setProcessOptions(Array.isArray(procData) ? procData : [])
      } catch (e) {
        console.error(e)
      }
    }
    fetchData()
  }, [])

  // Load existing sheet
  const loadSheet = useCallback(async (id: string) => {
    setLoadingSheet(true)
    try {
      const res = await fetch(`/api/photo-sheets/${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && json?.success) {
        const s = json.data
        setSheetId(s.id)
        setTitle(s.title || '사진대지')
        setSiteId(s.site_id)
        const match = PHOTO_SHEET_PRESETS.find(p => p.rows === s.rows && p.cols === s.cols)
        if (match) setPresetId(match.id)

        const items = Array.isArray(s.items) ? s.items : []
        const perPage = s.rows * s.cols
        const pg = Math.max(1, Math.ceil(items.length / Math.max(1, perPage)))
        const total = perPage * pg
        const arr: Tile[] = Array.from({ length: total }, (_, i) => ({ id: String(i) }))
        items.forEach((it: any) => {
          const idx = Number(it.item_index)
          if (idx >= 0 && idx < total) {
            arr[idx] = {
              id: String(idx),
              member: it.member_name || undefined,
              process: it.process_name || undefined,
              content: it.content || undefined,
              stage: it.stage || undefined,
              previewUrl: it.image_url || undefined,
            }
          }
        })
        setTiles(arr)
      }
    } finally {
      setLoadingSheet(false)
    }
  }, [])

  useEffect(() => {
    if (externalSheetId) loadSheet(externalSheetId)
  }, [externalSheetId, loadSheet])

  useEffect(() => {
    const s = sites.find(s => s.id === siteId)
    if (s) setSiteName(s.name)
  }, [siteId, sites])

  // Tile management
  const updateTile = (index: number, patch: Partial<Tile>) => {
    setTiles(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleTileFileChange = (index: number, files: File[]) => {
    const requiredSlots = index + files.length
    setTiles(prev => {
      const next = [...prev]
      while (next.length < requiredSlots) {
        next.push({ id: String(next.length) })
      }
      files.forEach((file, offset) => {
        const tileIndex = index + offset
        if (next[tileIndex]?.previewUrl) URL.revokeObjectURL(next[tileIndex].previewUrl!)
        next[tileIndex] = {
          ...next[tileIndex],
          file,
          previewUrl: URL.createObjectURL(file),
        }
      })
      return next
    })
  }

  const applyBulkMetadata = () => {
    setTiles(prev =>
      prev.map(t => ({
        ...t,
        member: bulkMember || t.member,
        process: bulkProcess || t.process,
      }))
    )
    setMessage('일괄 적용되었습니다.')
  }

  const canSave = useMemo(
    () => !!siteId && tiles.some(t => t.previewUrl || t.file),
    [siteId, tiles]
  )

  return {
    siteId,
    setSiteId,
    siteName,
    sites,
    title,
    setTitle,
    orientation,
    setOrientation,
    presetId,
    setPresetId,
    preset,
    sheetId,
    tiles,
    setTiles,
    updateTile,
    handleTileFileChange,
    pageCount,
    photosPerPage,
    saving,
    setSaving,
    loadingSheet,
    message,
    setMessage,
    messageType,
    setMessageType,
    componentOptions,
    processOptions,
    bulkMember,
    setBulkMember,
    bulkProcess,
    setBulkProcess,
    applyBulkMetadata,
    canSave,
  }
}
