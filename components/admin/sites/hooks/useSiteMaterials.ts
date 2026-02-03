'use client'

import { useEffect, useMemo, useState } from 'react'

interface UseSiteMaterialsProps {
  siteId: string
  tab: string
}

export function useSiteMaterials({ siteId, tab }: UseSiteMaterialsProps) {
  const [inventory, setInventory] = useState<any[]>([])
  const [shipments, setShipments] = useState<any[]>([])
  const [materialsStats, setMaterialsStats] = useState({
    inventory_total: 0,
    low_stock: 0,
    out_of_stock: 0,
    pending_requests: 0,
    open_shipments: 0,
  })
  const [invLoading, setInvLoading] = useState(false)
  const [shipLoading, setShipLoading] = useState(false)
  const [invQuery, setInvQuery] = useState('')
  const [shipQuery, setShipQuery] = useState('')

  // Requests state
  const [reqRows, setReqRows] = useState<any[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [reqPage, setReqPage] = useState(0)
  const [reqPageSize, setReqPageSize] = useState(20)
  const [reqHasNext, setReqHasNext] = useState(false)
  const [reqTotal, setReqTotal] = useState<number | null>(null)
  const [materialsQuery, setMaterialsQuery] = useState('')
  const [materialsStatus, setMaterialsStatus] = useState<string>('all')
  const [materialsSort, setMaterialsSort] = useState<string>('date_desc')

  // Transactions state
  const [transactions, setTransactions] = useState<any[]>([])
  const [txnLoading, setTxnLoading] = useState(false)
  const [txnPage, setTxnPage] = useState(0)
  const [txnPageSize, setTxnPageSize] = useState(20)
  const [txnHasNext, setTxnHasNext] = useState(false)
  const [txnQuery, setTxnQuery] = useState('')
  const [txnTotal, setTxnTotal] = useState<number | null>(null)

  // Fetch Inventory & Summary
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setInvLoading(true)
        setShipLoading(true)
        const res = await fetch(`/api/admin/sites/${siteId}/materials/summary`, {
          cache: 'no-store',
        })
        const json = await res.json()
        if (active && json?.success) {
          setInventory(Array.isArray(json.data?.inventory) ? json.data.inventory : [])
          setShipments(Array.isArray(json.data?.shipments) ? json.data.shipments : [])
          if (json.data?.stats) {
            setMaterialsStats({
              inventory_total: Number(json.data.stats.inventory_total || 0),
              low_stock: Number(json.data.stats.low_stock || 0),
              out_of_stock: Number(json.data.stats.out_of_stock || 0),
              pending_requests: Number(json.data.stats.pending_requests || 0),
              open_shipments: Number(json.data.stats.open_shipments || 0),
            })
          }
        }
      } finally {
        if (active) {
          setInvLoading(false)
          setShipLoading(false)
        }
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, tab])

  // Fetch Requests
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setRequestsLoading(true)
        const params = new URLSearchParams()
        if (materialsQuery.trim()) params.set('q', materialsQuery.trim())
        if (materialsStatus !== 'all') params.set('status', materialsStatus)

        let sort = 'date'
        let order = 'desc'
        if (materialsSort === 'date_asc') {
          sort = 'date'
          order = 'asc'
        } else if (materialsSort === 'status') {
          sort = 'status'
          order = 'asc'
        } else if (materialsSort === 'number') {
          sort = 'number'
          order = 'asc'
        }

        params.set('sort', sort)
        params.set('order', order)
        params.set('limit', String(reqPageSize + 1))
        params.set('offset', String(reqPage * reqPageSize))

        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/requests?${params.toString()}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.data)) {
          const arr = json.data
          setReqHasNext(arr.length > reqPageSize)
          setReqRows(arr.slice(0, reqPageSize))
          if (typeof json.total === 'number') setReqTotal(json.total)
        }
      } finally {
        if (active) setRequestsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, tab, materialsQuery, materialsStatus, materialsSort, reqPage, reqPageSize])

  // Fetch Transactions
  useEffect(() => {
    if (tab !== 'materials') return
    let active = true
    ;(async () => {
      try {
        setTxnLoading(true)
        const params = new URLSearchParams()
        if (txnQuery.trim()) params.set('q', txnQuery.trim())
        params.set('limit', String(txnPageSize + 1))
        params.set('offset', String(txnPage * txnPageSize))

        const res = await fetch(
          `/api/admin/sites/${siteId}/materials/transactions?${params.toString()}`,
          { cache: 'no-store' }
        )
        const json = await res.json()
        if (active && json?.success && Array.isArray(json.data)) {
          const arr = json.data
          setTxnHasNext(arr.length > txnPageSize)
          setTransactions(arr.slice(0, txnPageSize))
          if (typeof json.total === 'number') setTxnTotal(json.total)
        }
      } finally {
        if (active) setTxnLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [siteId, tab, txnQuery, txnPage, txnPageSize])

  const filteredInventory = useMemo(() => {
    return inventory.filter(it => {
      const q = invQuery.toLowerCase()
      return (
        !q ||
        (it.materials?.name || '').toLowerCase().includes(q) ||
        (it.materials?.code || '').toLowerCase().includes(q)
      )
    })
  }, [inventory, invQuery])

  const filteredShipments = useMemo(() => {
    return shipments.filter(it => {
      const q = shipQuery.toLowerCase()
      return !q || (it.shipment_number || '').toLowerCase().includes(q)
    })
  }, [shipments, shipQuery])

  return {
    inventory: filteredInventory,
    shipments: filteredShipments,
    materialsStats,
    invLoading,
    shipLoading,
    invQuery,
    setInvQuery,
    shipQuery,
    setShipQuery,
    reqRows,
    requestsLoading,
    reqPage,
    setReqPage,
    reqPageSize,
    setReqPageSize,
    reqHasNext,
    reqTotal,
    materialsQuery,
    setMaterialsQuery,
    materialsStatus,
    setMaterialsStatus,
    materialsSort,
    setMaterialsSort,
    transactions,
    txnLoading,
    txnPage,
    setTxnPage,
    txnPageSize,
    setTxnPageSize,
    txnHasNext,
    txnQuery,
    setTxnQuery,
    txnTotal,
  }
}
