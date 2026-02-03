'use client'

import { useLaborHourOptions } from '@/hooks/use-labor-hour-options'
import { useWorkOptions } from '@/hooks/use-work-options'
import {
  FALLBACK_LABOR_HOUR_DEFAULT,
  FALLBACK_LABOR_HOUR_OPTIONS,
  normalizeLaborHourOptions,
} from '@/lib/labor/labor-hour-options'
import { MaterialEntry, useCreateWorklog } from '@/modules/mobile/hooks/use-worklog-mutations'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'
import { AdditionalManpower, WorkLogLocation } from '@/types/worklog'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(String(val || ''))

const WORK_TYPE_VALUES = ['지하', '지상', '지붕']

const normalizeSelections = (values: string[], allowedValues: string[]) => {
  const allowedSet = new Set(allowedValues)
  const normalized: string[] = []
  let pendingCustom = false

  values.forEach(rawValue => {
    if (!rawValue) return
    if (rawValue === 'other') {
      pendingCustom = true
      return
    }
    let value = rawValue.trim()
    if (!value) return
    if (pendingCustom) {
      value = value.startsWith('기타') ? value.replace(/^기타[:\s]*/, '').trim() : value
      value = value ? `기타: ${value}` : ''
      pendingCustom = false
    } else if (!allowedSet.has(value)) {
      value = value.startsWith('기타')
        ? `기타: ${value.replace(/^기타[:\s]*/, '').trim()}`
        : `기타: ${value}`
    }
    if (value && !normalized.includes(value)) normalized.push(value)
  })
  return normalized
}

export function useHomePage(initialProfile?: any) {
  const { profile: authProfile, loading: authLoading } = useAuth()
  const { options: laborHourOptionState } = useLaborHourOptions()
  const { componentTypes, processTypes } = useWorkOptions()
  const createWorklogMutation = useCreateWorklog()

  // 1. Initial State
  const [selectedSite, setSelectedSite] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [location, setLocation] = useState<WorkLogLocation>({ block: '', dong: '', unit: '' })
  const [memberTypes, setMemberTypes] = useState<string[]>([])
  const [workContents, setWorkContents] = useState<string[]>([])
  const [workTypes, setWorkTypes] = useState<string[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [materials, setMaterials] = useState<MaterialEntry[]>([])
  const [additionalManpower, setAdditionalManpower] = useState<AdditionalManpower[]>([])
  const [prefillData, setPrefillData] = useState<any>(null)
  const [prefillCompleted, setPrefillCompleted] = useState(false)
  const [sites, setSites] = useState<any[]>([])
  const [sitesLoading, setSitesLoading] = useState(true)
  const [userOptions, setUserOptions] = useState<any[]>([])
  const [selectedAuthorId, setSelectedAuthorId] = useState('')
  const [mainManpower, setMainManpower] = useState(1)

  // 2. Computed Values
  const laborHourValues = useMemo(
    () =>
      normalizeLaborHourOptions(
        laborHourOptionState.length > 0
          ? laborHourOptionState
          : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
      ),
    [laborHourOptionState]
  )
  const defaultLaborHour = useMemo(
    () => (laborHourValues.includes(1) ? 1 : (laborHourValues[0] ?? FALLBACK_LABOR_HOUR_DEFAULT)),
    [laborHourValues]
  )

  const MEMBER_TYPE_OPTIONS = useMemo(
    () => [
      ...componentTypes.map(c => ({ value: c.option_label, label: c.option_label })),
      { value: 'other', label: '기타' },
    ],
    [componentTypes]
  )
  const PROCESS_OPTIONS = useMemo(
    () => [
      ...processTypes.map(p => ({ value: p.option_label, label: p.option_label })),
      { value: 'other', label: '기타' },
    ],
    [processTypes]
  )

  // 3. Effects (Data Fetching, Prefill)
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch('/api/mobile/sites/list')
        const json = await res.json()
        setSites(json.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setSitesLoading(false)
      }
    }
    fetchSites()
    setWorkDate(new Date().toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('worklog_prefill') : null
    if (raw) {
      setPrefillData(JSON.parse(raw))
      localStorage.removeItem('worklog_prefill')
    }
  }, [])

  useEffect(() => {
    if (prefillData && !prefillCompleted) {
      if (prefillData.siteId) setSelectedSite(String(prefillData.siteId))
      if (prefillData.workDate) setWorkDate(prefillData.workDate)
      if (prefillData.location) setLocation(prefillData.location)
      if (prefillData.memberTypes) setMemberTypes(prefillData.memberTypes)
      if (prefillData.workProcesses) setWorkContents(prefillData.workProcesses)
      if (prefillData.workTypes) setWorkTypes(prefillData.workTypes)
      if (prefillData.materials) setMaterials(prefillData.materials)
      if (prefillData.tasks) setTasks(prefillData.tasks)
      setPrefillCompleted(true)
    }
  }, [prefillData, prefillCompleted])

  // 4. Actions
  const buildPayload = (status: 'draft' | 'submitted') => {
    const normMember = normalizeSelections(
      memberTypes,
      MEMBER_TYPE_OPTIONS.map(o => o.value)
    )
    const normProcess = normalizeSelections(
      workContents,
      PROCESS_OPTIONS.map(o => o.value)
    )
    return {
      site_id: selectedSite,
      work_date: workDate,
      status,
      work_description: normProcess.join(', ') || normMember.join(', ') || '작업 내용',
      total_workers:
        mainManpower + additionalManpower.reduce((s, m) => s + (Number(m.manpower) || 0), 0),
      member_types: normMember,
      processes: normProcess,
      work_types: normalizeSelections(workTypes, WORK_TYPE_VALUES),
      location,
      main_manpower: mainManpower,
      additional_manpower: additionalManpower.map(m => ({
        name: m.workerName,
        manpower: m.manpower,
      })),
      materials: materials
        .filter(m => m.material_name.trim())
        .map(m => ({ ...m, quantity: Number(m.quantity) })),
      tasks,
    }
  }

  const handleSave = async (status: 'draft' | 'submitted') => {
    if (!selectedSite) return toast.error('현장을 선택해주세요.')
    try {
      await createWorklogMutation.mutateAsync(buildPayload(status))
      toast.success(status === 'draft' ? '임시 저장되었습니다.' : '저장되었습니다.')
    } catch (e: any) {
      toast.error(e.message || '저장 실패')
    }
  }

  return {
    state: {
      selectedSite,
      workDate,
      location,
      memberTypes,
      workContents,
      workTypes,
      tasks,
      materials,
      additionalManpower,
      sites,
      sitesLoading,
      userOptions,
      selectedAuthorId,
      mainManpower,
      laborHourValues,
      defaultLaborHour,
      MEMBER_TYPE_OPTIONS,
      PROCESS_OPTIONS,
      userProfile: authProfile || initialProfile,
    },
    actions: {
      setSelectedSite,
      setWorkDate,
      setLocation,
      setMemberTypes,
      setWorkContents,
      setWorkTypes,
      setTasks,
      setMaterials,
      setAdditionalManpower,
      setSelectedAuthorId,
      setMainManpower,
      handleSave,
    },
  }
}
