type LegacyWorkerRow = {
  id?: string
  worker_id?: string | null
  worker_name?: string | null
  labor_hours?: number | null
  work_hours?: number | null
  notes?: string | null
  is_direct_input?: boolean | null
  profiles?: { id?: string; full_name?: string | null }
}

type WorkRecordRow = {
  id?: string
  user_id?: string | null
  labor_hours?: number | null
  work_hours?: number | null
  notes?: string | null
  metadata?: Record<string, unknown> | null
  profiles?: { id?: string; full_name?: string | null }
}

const extractHours = (value?: unknown) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const normalizeName = (value?: string | null) => {
  if (!value) return null
  return value.replace(/\s+/g, '').toLowerCase()
}

const recordDisplayName = (record?: WorkRecordRow | null) => {
  if (!record) return null
  return (
    record?.profiles?.full_name ||
    (typeof record?.metadata?.worker_name === 'string'
      ? (record.metadata.worker_name as string)
      : null)
  )
}

const deriveName = (worker: LegacyWorkerRow, record?: WorkRecordRow | null, fallbackIndex = 0) => {
  return (
    worker?.worker_name ||
    recordDisplayName(record) ||
    worker?.profiles?.full_name ||
    worker?.worker_id ||
    record?.user_id ||
    `작업자-${fallbackIndex + 1}`
  )
}

export const mergeWorkers = (
  legacyWorkers: LegacyWorkerRow[] | undefined,
  workRecords: WorkRecordRow[] | undefined
) => {
  const legacyList = Array.isArray(legacyWorkers) ? legacyWorkers : []
  const recordList = Array.isArray(workRecords) ? workRecords : []

  const recordsByUserId = new Map<string, WorkRecordRow>()
  const recordsByName = new Map<string, WorkRecordRow[]>()
  const anonymousRecords: WorkRecordRow[] = []

  recordList.forEach(record => {
    const key = record?.user_id ? String(record.user_id) : null
    const normalizedName = normalizeName(recordDisplayName(record))
    if (key) {
      recordsByUserId.set(key, record)
    } else if (normalizedName) {
      const arr = recordsByName.get(normalizedName) || []
      arr.push(record)
      recordsByName.set(normalizedName, arr)
    } else {
      anonymousRecords.push(record)
    }
  })

  const merged: LegacyWorkerRow[] = legacyList.map((worker, index) => {
    const key = worker?.worker_id ? String(worker.worker_id) : null
    let record = key ? recordsByUserId.get(key) : undefined
    if (record && key) {
      recordsByUserId.delete(key)
    }

    if (!record) {
      const normalized = normalizeName(worker?.worker_name)
      if (normalized) {
        const arr = recordsByName.get(normalized)
        if (arr && arr.length > 0) {
          record = arr.shift()
          if (!arr.length) recordsByName.delete(normalized)
        }
      }
    }

    const hours =
      extractHours(record?.labor_hours ?? record?.work_hours) ||
      extractHours(worker?.labor_hours ?? worker?.work_hours)

    return {
      ...worker,
      worker_name: deriveName(worker, record, index),
      labor_hours: hours,
      work_hours: hours,
      is_direct_input: worker?.is_direct_input ?? !worker?.worker_id,
    }
  })

  const remainingNamedRecords = Array.from(recordsByName.values()).flat()
  const remainingRecords = [
    ...recordsByUserId.values(),
    ...remainingNamedRecords,
    ...anonymousRecords,
  ]
  remainingRecords.forEach((record, offset) => {
    const hours = extractHours(record?.labor_hours ?? record?.work_hours)
    merged.push({
      id: record?.id || `record-${offset}`,
      worker_id: record?.user_id || null,
      worker_name: deriveName({} as LegacyWorkerRow, record, offset),
      labor_hours: hours,
      work_hours: hours,
      notes: record?.notes || '',
      is_direct_input: !record?.user_id,
    })
  })

  return merged
}
