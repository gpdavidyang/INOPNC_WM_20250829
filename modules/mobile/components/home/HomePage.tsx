'use client'

import { useLaborHourOptions } from '@/hooks/use-labor-hour-options'
import { useWorkOptions } from '@/hooks/use-work-options'
import {
  FALLBACK_LABOR_HOUR_DEFAULT,
  FALLBACK_LABOR_HOUR_OPTIONS,
  calculateWorkerCount,
  normalizeLaborHourOptions,
} from '@/lib/labor/labor-hour-options'
import { createClient } from '@/lib/supabase/client'
import { MaterialEntry, useCreateWorklog } from '@/modules/mobile/hooks/use-worklog-mutations'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'
import '@/modules/mobile/styles/drawing-quick.css'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/summary-section.css'
import '@/modules/mobile/styles/upload.css'
import '@/modules/mobile/styles/work-form.css'
import { AdditionalManpower, WorkLogLocation, WorkSection } from '@/types/worklog'
import { User } from '@supabase/supabase-js'
import { Image, MapPin } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DrawingQuickAction } from './DrawingQuickAction'
import { NoticeSection } from './NoticeSection'
import { PhotoUploadCard } from './PhotoUploadCard'
import { QuickMenu } from './QuickMenu'
import { SiteSearchHandle, SiteSearchInput } from './SiteSearchInput'
import { SummarySection } from './SummarySection'
import { WorkLogInputs } from './WorkLogInputs'

const isUuid = (val: string) => /^[0-9a-fA-F-]{36}$/.test(String(val || ''))

const WORK_TYPE_OPTIONS = [
  { value: '지하', label: '지하' },
  { value: '지상', label: '지상' },
  { value: '지붕', label: '지붕' },
  { value: 'other', label: '기타' },
] as const

const WORK_TYPE_VALUES = WORK_TYPE_OPTIONS.filter(option => option.value !== 'other').map(
  option => option.value
)

const UNASSIGNED_ORGANIZATION_LABEL = '소속사 미지정'
const UNKNOWN_ORGANIZATION_LABEL = '소속사 정보 없음'

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

    if (value && !normalized.includes(value)) {
      normalized.push(value)
    }
  })

  return normalized
}

// 현장 인터페이스 정의
interface Site {
  id: string
  name: string
  organization_id?: string | null
  organization_name?: string | null
}

interface HomePageProps {
  initialProfile?: {
    id: string
    full_name?: string
    email: string
    role: string
    site_id?: string
  }
  initialUser?: User
}

export const HomePage: React.FC<HomePageProps> = ({ initialProfile, initialUser }) => {
  // Use auth context
  const { user, session, profile: authProfile, loading: authLoading, refreshSession } = useAuth()
  const { options: laborHourOptionState } = useLaborHourOptions()
  const laborHourValues = useMemo(
    () =>
      normalizeLaborHourOptions(
        laborHourOptionState.length > 0
          ? laborHourOptionState
          : Array.from(FALLBACK_LABOR_HOUR_OPTIONS)
      ),
    [laborHourOptionState]
  )
  const defaultLaborHour = useMemo(() => {
    // 1.0이 옵션에 있다면 최우선으로 기본값 설정
    if (laborHourValues.includes(1)) {
      return 1
    }
    const positive = laborHourValues.find(value => value > 0)
    return typeof positive === 'number'
      ? positive
      : (laborHourValues[0] ?? FALLBACK_LABOR_HOUR_DEFAULT)
  }, [laborHourValues])

  // 기본 상태
  const [selectedSite, setSelectedSite] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [siteQuery, setSiteQuery] = useState('')
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)
  const [siteActiveIndex, setSiteActiveIndex] = useState(0)
  const siteInputRef = useRef<SiteSearchHandle>(null)
  const siteUserEditingRef = useRef(false)
  const [workCards, setWorkCards] = useState([{ id: 1 }])
  // 사용자 프로필 상태 - Use auth context profile or initial profile
  const [userProfile, setUserProfile] = useState<any>(authProfile || initialProfile || null)
  const [profileLoading, setProfileLoading] = useState(false)

  // v2.0 새로운 상태들
  const [location, setLocation] = useState<WorkLogLocation>({ block: '', dong: '', unit: '' })
  const [memberTypes, setMemberTypes] = useState<string[]>([])
  const [workContents, setWorkContents] = useState<string[]>([])
  const [workTypes, setWorkTypes] = useState<string[]>([])
  const [tasks, setTasks] = useState<
    Array<{
      memberTypes: string[]
      processes: string[]
      workTypes: string[]
      location: WorkLogLocation
    }>
  >([])
  const [mainManpower, setMainManpower] = useState(() => defaultLaborHour)
  const [workSections, setWorkSections] = useState<WorkSection[]>([])
  const [additionalManpower, setAdditionalManpower] = useState<AdditionalManpower[]>([])
  useEffect(() => {
    setMainManpower(prev => {
      if (laborHourValues.includes(prev)) {
        return prev
      }
      if (laborHourValues.includes(1)) {
        return 1
      }
      return defaultLaborHour
    })
  }, [laborHourValues, defaultLaborHour])
  useEffect(() => {
    setAdditionalManpower(prev => {
      let changed = false
      const next = prev.map(entry => {
        if (laborHourValues.includes(entry.manpower)) {
          return entry
        }
        changed = true
        return { ...entry, manpower: defaultLaborHour }
      })
      return changed ? next : prev
    })
  }, [laborHourValues, defaultLaborHour])
  const [materials, setMaterials] = useState<MaterialEntry[]>([])
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [hasPrefill, setHasPrefill] = useState(false)
  const [prefillCompleted, setPrefillCompleted] = useState(false)
  const [prefillData, setPrefillData] = useState<any>(null)

  // 사용자(작성자/작업자) 선택용 옵션 - 관리자에서 등록된 사용자 중 작업자/현장관리자만
  const [allUserOptions, setAllUserOptions] = useState<
    Array<{ id: string; name: string; role?: string }>
  >([])
  const [userOptions, setUserOptions] = useState<
    Array<{ id: string; name: string; role?: string }>
  >([])
  const allUserOptionsRef = useRef(allUserOptions)
  useEffect(() => {
    allUserOptionsRef.current = allUserOptions
  }, [allUserOptions])

  const mergeUsers = useCallback(
    (...lists: Array<Array<{ id: string; name: string; role?: string }> | undefined | null>) => {
      const map = new Map<string, { id: string; name: string; role?: string }>()
      lists.forEach(list => {
        list?.forEach(user => {
          if (!user?.id) return
          const existing = map.get(user.id)
          if (existing) {
            if (!existing.name && user.name) existing.name = user.name
            if (user.role && !existing.role) existing.role = user.role
          } else {
            map.set(user.id, {
              id: user.id,
              name: user.name || '이름없음',
              role: user.role,
            })
          }
        })
      })
      return Array.from(map.values()).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'ko', { sensitivity: 'base' })
      )
    },
    []
  )
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('')
  const selectedAuthorName = useMemo(() => {
    const found = userOptions.find(u => u.id === selectedAuthorId)?.name
    return found || userProfile?.full_name || ''
  }, [selectedAuthorId, userOptions, userProfile?.full_name])

  // 작업 옵션 (부재명/작업공정) - 관리자 화면에서 설정한 값 사용
  const { componentTypes, processTypes } = useWorkOptions()
  const MEMBER_TYPE_OPTIONS = useMemo(() => {
    // Remove any existing "기타" from admin-provided options to avoid duplicate entries.
    const base = componentTypes
      .map(opt => ({ value: opt.option_label, label: opt.option_label }))
      .filter(opt => opt.label?.trim() !== '기타')
    return [...base, { value: 'other', label: '기타' }]
  }, [componentTypes])
  const WORK_PROCESS_OPTIONS = useMemo(() => {
    const base = processTypes
      .map(opt => ({ value: opt.option_label, label: opt.option_label }))
      .filter(opt => opt.label?.trim() !== '기타')
    return [...base, { value: 'other', label: '기타' }]
  }, [processTypes])
  const MEMBER_TYPE_VALUES = useMemo(
    () => MEMBER_TYPE_OPTIONS.filter(o => o.value !== 'other').map(o => o.value),
    [MEMBER_TYPE_OPTIONS]
  )
  const WORK_PROCESS_VALUES = useMemo(
    () => WORK_PROCESS_OPTIONS.filter(o => o.value !== 'other').map(o => o.value),
    [WORK_PROCESS_OPTIONS]
  )

  const normalizedMemberTypes = useMemo(
    () => normalizeSelections(memberTypes, MEMBER_TYPE_VALUES),
    [memberTypes, MEMBER_TYPE_VALUES]
  )
  const normalizedWorkProcesses = useMemo(
    () => normalizeSelections(workContents, WORK_PROCESS_VALUES),
    [workContents, WORK_PROCESS_VALUES]
  )
  const normalizedWorkTypes = useMemo(
    () => normalizeSelections(workTypes, WORK_TYPE_VALUES),
    [workTypes]
  )
  const createWorklogMutation = useCreateWorklog()
  const [showSlowSaving, setShowSlowSaving] = useState(false)
  useEffect(() => {
    if (!createWorklogMutation.isPending) {
      setShowSlowSaving(false)
      return
    }
    const timeout = window.setTimeout(() => setShowSlowSaving(true), 3000)
    return () => window.clearTimeout(timeout)
  }, [createWorklogMutation.isPending])

  // 현장 데이터 상태
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState<string | null>(null)
  const [externalSiteInfo, setExternalSiteInfo] = useState<Site | null>(null)
  const [singleSiteLoading, setSingleSiteLoading] = useState(false)
  const [sitesRequestKey, setSitesRequestKey] = useState(0)
  const reloadSites = useCallback(() => setSitesRequestKey(prev => prev + 1), [])

  // Prefill from localStorage (draft redirect)
  useEffect(() => {
    const loadPrefillData = async () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('worklog_prefill') : null
        if (!raw) return
        const data = JSON.parse(raw)

        console.log('[Prefill] Loaded data:', data)

        // Store prefill data in state for later use
        setPrefillData(data)

        if (data?.siteId) {
          console.log('[Prefill] Setting siteId from storage:', data.siteId)
          setSelectedSite(String(data.siteId))
        }

        // Set hasPrefill flag if we have any prefill data (siteId, legacy department, OR workDate)
        if ((data?.department && isUuid(data.department)) || data?.siteId || data?.workDate) {
          setHasPrefill(true)
        }

        // Remove from localStorage immediately to prevent conflicts
        localStorage.removeItem('worklog_prefill')
      } catch (e) {
        console.error('Prefill load error:', e)
      }
    }

    loadPrefillData()
  }, [])

  // Prefill from localStorage (draft redirect) - apply once loaded
  useEffect(() => {
    if (!hasPrefill || prefillCompleted || !prefillData) return

    try {
      const prefillSiteId = prefillData?.siteId ? String(prefillData.siteId) : ''
      if (prefillSiteId) {
        console.log('[Prefill Apply] Ensuring siteId is set:', prefillSiteId)
        setSelectedSite(prefillSiteId)
      }
      if (prefillData?.workDate) {
        console.log('[Prefill Apply] Setting workDate:', prefillData.workDate)
        setWorkDate(String(prefillData.workDate))
      }
      if (prefillData?.location) {
        console.log('[Prefill Apply] Setting location:', prefillData.location)
        setLocation({
          block: String(prefillData.location.block || ''),
          dong: String(prefillData.location.dong || ''),
          unit: String(prefillData.location.unit || ''),
        })
      }
      if (Array.isArray(prefillData?.memberTypes)) {
        console.log('[Prefill Apply] Setting memberTypes:', prefillData.memberTypes)
        setMemberTypes(prefillData.memberTypes)
      }
      if (Array.isArray(prefillData?.workProcesses)) {
        console.log('[Prefill Apply] Setting workProcesses:', prefillData.workProcesses)
        setWorkContents(prefillData.workProcesses)
      }
      if (Array.isArray(prefillData?.workTypes)) {
        console.log('[Prefill Apply] Setting workTypes:', prefillData.workTypes)
        setWorkTypes(prefillData.workTypes)
      }
      if (typeof prefillData?.mainManpower === 'number') {
        console.log('[Prefill Apply] Setting mainManpower:', prefillData.mainManpower)
        setMainManpower(prefillData.mainManpower)
      }
      if (Array.isArray(prefillData?.materials)) {
        console.log('[Prefill Apply] Setting materials:', prefillData.materials)
        const sanitized = prefillData.materials.map((m: any) => {
          const qty = m.quantity_val ?? m.amount ?? m.quantity ?? 0
          return {
            ...m,
            quantity: Number(qty),
          }
        })
        setMaterials(sanitized)
      }
      if (Array.isArray(prefillData?.additionalManpower)) {
        console.log('[Prefill Apply] Setting additionalManpower:', prefillData.additionalManpower)
        setAdditionalManpower(prefillData.additionalManpower)
      }
      if (Array.isArray(prefillData?.tasks)) {
        console.log('[Prefill Apply] Setting tasks:', prefillData.tasks)
        setTasks(prefillData.tasks)
      }

      console.log('[Prefill Apply] Completed successfully')

      setPrefillCompleted(true)

      setTimeout(() => {
        const el = document.querySelector('.work-form-container')
        if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e) {
      console.error('Prefill apply error:', e)
    }
  }, [hasPrefill, prefillCompleted, prefillData])

  // Set today's date on mount
  useEffect(() => {
    if (hasPrefill) return
    const today = new Date().toISOString().split('T')[0]
    setWorkDate(today)

    // CRITICAL FIX: Removed initSessionSync() to prevent duplicate session monitoring
    // Session sync is now handled entirely by the AuthProvider to avoid validation conflicts
    console.log('[HomePage] Initialized without duplicate session sync')
  }, [hasPrefill])

  // Update profile when auth context changes
  useEffect(() => {
    if (authProfile) {
      setUserProfile(authProfile)
      console.log('Using auth context profile:', authProfile.full_name)
    } else if (initialProfile) {
      setUserProfile(initialProfile)
      console.log('Using initial profile:', initialProfile.full_name)
    }
  }, [authProfile, initialProfile])

  // 사용자 목록 불러오기 (작업자/현장관리자)
  useEffect(() => {
    let active = true
    const fetchUsers = async () => {
      setUsersLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['worker', 'site_manager'])
          .order('full_name', { ascending: true })

        if (error) {
          console.warn('[HomePage] Failed to fetch user list:', error.message)
        }

        const options = (data || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || '이름없음',
          role: p.role || undefined,
        }))
        if (active) {
          setAllUserOptions(prev => mergeUsers(prev, options))
          setUserOptions(prev => mergeUsers(prev, options))
        }
      } catch (e: any) {
        console.warn('[HomePage] Unexpected error while fetching users:', e?.message)
      } finally {
        // Always clear loading state even if unmounted soon
        if (active) setUsersLoading(false)
      }
    }

    fetchUsers()
    return () => {
      active = false
    }
  }, [mergeUsers])

  // 현재 로그인 사용자가 목록에 있으면 자동 선택 (없으면 첫 번째로 세팅)
  useEffect(() => {
    if (!userOptions.length) return
    const currentId = authProfile?.id || initialProfile?.id || ''
    if (currentId && userOptions.some(u => u.id === currentId)) {
      setSelectedAuthorId(prev => (prev ? prev : currentId))
    } else if (selectedAuthorId === '') {
      setSelectedAuthorId(userOptions[0].id)
    }
  }, [userOptions, authProfile?.id, initialProfile?.id, selectedAuthorId])

  // Ensure at least current user is selectable immediately (fallback)
  useEffect(() => {
    if (!userProfile?.id) return
    const selfOption = {
      id: userProfile.id,
      name: userProfile.full_name || '사용자',
      role: userProfile.role,
    }
    setAllUserOptions(prev => mergeUsers(prev, [selfOption]))
    setUserOptions(prev => mergeUsers(prev, [selfOption]))
    if (!selectedAuthorId) {
      setSelectedAuthorId(userProfile.id)
    }
  }, [userProfile?.id, userProfile?.full_name, userProfile?.role, mergeUsers, selectedAuthorId])

  // Fetch site-assigned users when a site is selected
  useEffect(() => {
    if (!selectedSite) return
    let active = true
    const controller = new AbortController()
    const loadAssigned = async () => {
      setUsersLoading(true)
      try {
        const res = await fetch(`/api/mobile/sites/${encodeURIComponent(selectedSite)}/workers`, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })

        if (!res.ok) {
          console.warn('[HomePage] site workers api failed:', res.status)
          return
        }

        const payload = await res.json()
        if (payload?.error) {
          console.warn('[HomePage] site workers payload error:', payload.error)
          return
        }

        const workers: Array<{ id: string; name: string; role?: string }> = Array.isArray(
          payload?.data
        )
          ? payload.data
          : []

        if (!active) return

        const combined = mergeUsers(allUserOptionsRef.current, workers)
        setAllUserOptions(combined)
        setUserOptions(combined)

        const exists = combined.some(u => u.id === selectedAuthorId)
        if (!exists) {
          if (userProfile?.id && combined.some(u => u.id === userProfile.id)) {
            setSelectedAuthorId(userProfile.id)
          } else if (workers.length > 0) {
            setSelectedAuthorId(workers[0].id)
          } else if (combined.length > 0) {
            setSelectedAuthorId(combined[0].id)
          } else {
            setSelectedAuthorId('')
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.warn('[HomePage] site workers fetch error:', e?.message)
        }
      } finally {
        if (active) setUsersLoading(false)
      }
    }

    loadAssigned()
    return () => {
      active = false
      controller.abort()
    }
  }, [
    selectedSite,
    userProfile?.id,
    userProfile?.full_name,
    userProfile?.role,
    selectedAuthorId,
    mergeUsers,
  ])

  // Simplified user check - rely on AuthProvider for session management
  useEffect(() => {
    if (!authLoading && !user && !initialUser) {
      console.log('No user available, user should be redirected by middleware')
      // Let middleware handle redirect - don't trigger refreshSession here to avoid loops
    }
  }, [authLoading, user, initialUser])

  // Handle calendar icon click to trigger date picker
  const handleCalendarClick = () => {
    const dateInput = document.querySelector('.date-input') as HTMLInputElement
    if (dateInput) {
      dateInput.showPicker?.()
      dateInput.focus()
    }
  }

  // Handle keyboard navigation for calendar icon
  const handleCalendarKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCalendarClick()
    }
  }

  // 접근 가능한 전체 현장 목록 불러오기
  useEffect(() => {
    const controller = new AbortController()
    let isActive = true

    const fetchSites = async () => {
      setSitesLoading(true)
      setSitesError(null)
      try {
        const res = await fetch('/api/mobile/sites/list', {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Failed to load sites (status: ${res.status})`)
        const json = await res.json().catch(() => ({}))
        const responseSites: any[] = Array.isArray(json?.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : []
        const siteList: Site[] = responseSites.map(site => ({
          id: site.id,
          name: site.name,
          organization_id: site.organization_id ?? null,
          organization_name: site.organization_name ?? null,
        }))
        if (isActive) setSites(siteList)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('현장 조회 오류:', err)
        if (isActive) {
          setSitesError('현장 목록을 불러올 수 없습니다.')
          setSites([])
        }
      } finally {
        if (isActive) setSitesLoading(false)
      }
    }

    fetchSites()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [sitesRequestKey])

  // 선택된 현장이 목록에 없을 때 단일 조회 (프리필된 케이스 대응)
  useEffect(() => {
    if (!selectedSite) {
      setExternalSiteInfo(null)
      setSingleSiteLoading(false)
      return
    }
    const matched = sites.find(s => s.id === selectedSite)
    if (matched) {
      setExternalSiteInfo(null)
      setSingleSiteLoading(false)
      return
    }

    const controller = new AbortController()
    let isActive = true
    setSingleSiteLoading(true)

    const fetchSiteDetails = async () => {
      try {
        const response = await fetch(`/api/mobile/sites/${selectedSite}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch site (${response.status})`)
        }
        const payload = await response.json().catch(() => ({}))
        const site = payload?.data
        if (isActive && site?.id) {
          setExternalSiteInfo({
            id: site.id,
            name: site.name,
            organization_id: site.organization_id ?? null,
            organization_name: site.organization_name ?? null,
          })
        } else if (isActive) {
          setExternalSiteInfo(null)
        }
      } catch (err) {
        if (!isActive || (err instanceof DOMException && err.name === 'AbortError')) return
        console.error('단일 현장 조회 오류:', err)
        setExternalSiteInfo(null)
      } finally {
        if (isActive) setSingleSiteLoading(false)
      }
    }

    fetchSiteDetails()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [selectedSite, sites])

  // 프리필된 현장이 유효하지 않을 때 안내
  useEffect(() => {
    if (!hasPrefill || !prefillData?.siteId) return
    if (!selectedSite || String(prefillData.siteId) !== String(selectedSite)) return
    if (sitesLoading || singleSiteLoading) return

    const existsInList = sites.some(s => s.id === selectedSite)
    if (existsInList || externalSiteInfo) return

    setSelectedSite('')
    toast.warning('저장된 현장을 찾을 수 없습니다. 현장을 다시 선택해 주세요.', { duration: 2500 })
  }, [
    hasPrefill,
    prefillData?.siteId,
    selectedSite,
    sites,
    sitesLoading,
    singleSiteLoading,
    externalSiteInfo,
  ])

  const handleAddCard = () => {
    const newId = Math.max(...workCards.map(c => c.id)) + 1
    setWorkCards([...workCards, { id: newId }])
  }

  const handleRemoveCard = (cardId: number) => {
    if (workCards.length > 1) {
      setWorkCards(workCards.filter(c => c.id !== cardId))
    }
  }

  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setSelectedSite('')
      setSiteQuery('')
      setSiteDropdownOpen(false)
      setSiteActiveIndex(0)
      siteUserEditingRef.current = false
      setExternalSiteInfo(null)
      setWorkCards([{ id: 1 }])
      const today = new Date().toISOString().split('T')[0]
      setWorkDate(today)
      // v2.0 상태들도 초기화
      setLocation({ block: '', dong: '', unit: '' })
      setMemberTypes([])
      setWorkContents([])
      setWorkTypes([])
      setMainManpower(defaultLaborHour)
      setWorkSections([])
      setAdditionalManpower([])
      setMaterials([])
      setActionStatus({ type: 'success', message: '입력 내용을 초기화했습니다.' })
      toast.success('초기화되었습니다.', { duration: 1800 })
    }
  }

  const resolvedSite = useMemo(() => {
    if (!selectedSite) return null
    return sites.find(site => site.id === selectedSite) || externalSiteInfo
  }, [selectedSite, sites, externalSiteInfo])

  const siteDropdownItems = useMemo(() => {
    const q = siteQuery.trim().toLowerCase()
    const base = sites
    if (!q) return base.slice(0, 10)
    return base.filter(site => site.name?.toLowerCase().includes(q)).slice(0, 10)
  }, [siteQuery, sites])

  const handleSelectSite = useCallback((site: Site) => {
    siteUserEditingRef.current = false
    setSelectedSite(site.id)
    setSiteQuery(site.name)
    setSiteDropdownOpen(false)
    setSiteActiveIndex(0)
  }, [])

  const handleClearSite = useCallback(() => {
    siteUserEditingRef.current = false
    setSelectedSite('')
    setExternalSiteInfo(null)
    setSiteQuery('')
    setSiteDropdownOpen(true)
    setSiteActiveIndex(0)
    siteInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!selectedSite) {
      if (!siteUserEditingRef.current) setSiteQuery('')
      return
    }
    if (resolvedSite?.name && !siteUserEditingRef.current) {
      setSiteQuery(resolvedSite.name)
    }
  }, [resolvedSite?.name, selectedSite])

  const organizationLabel = resolvedSite
    ? resolvedSite.organization_name ||
      (resolvedSite.organization_id ? UNKNOWN_ORGANIZATION_LABEL : UNASSIGNED_ORGANIZATION_LABEL)
    : UNASSIGNED_ORGANIZATION_LABEL

  const buildPayload = (status: 'draft' | 'submitted') => {
    const totalWorkers =
      mainManpower + additionalManpower.reduce((sum, m) => sum + (Number(m.manpower) || 0), 0)

    const filteredMaterials = materials
      .filter(material => material.material_name.trim())
      .map(material => ({
        material_name: material.material_name,
        material_code: material.material_code || null,
        quantity: Number(material.quantity) || 0,
        unit: material.unit || null,
        notes: material.notes,
      }))

    // 기본 입력이 비어있을 경우, 첫 번째 작업 세트를 대표값으로 사용
    const firstTask = tasks[0]
    const repMemberTypes =
      normalizedMemberTypes.length > 0 ? normalizedMemberTypes : firstTask?.memberTypes || []
    const repProcesses =
      normalizedWorkProcesses.length > 0 ? normalizedWorkProcesses : firstTask?.processes || []
    const repWorkTypes =
      normalizedWorkTypes.length > 0 ? normalizedWorkTypes : firstTask?.workTypes || []
    const repLocation =
      location.block || location.dong || location.unit
        ? location
        : firstTask?.location || { block: '', dong: '', unit: '' }

    // work_description 생성 - 부재명과 작업공정 조합
    let workDesc = ''
    const processesForDesc = normalizedWorkProcesses.length ? normalizedWorkProcesses : repProcesses
    const memberTypesForDesc = normalizedMemberTypes.length ? normalizedMemberTypes : repMemberTypes

    if (processesForDesc.length > 0) {
      workDesc = processesForDesc.join(', ')
    } else if (memberTypesForDesc.length > 0) {
      workDesc = memberTypesForDesc.join(', ')
    } else {
      workDesc = '작업 내용'
    }

    console.log('[buildPayload] Building payload:', {
      status,
      memberTypes: repMemberTypes,
      processes: repProcesses,
      workTypes: repWorkTypes,
      workDesc,
      tasksCount: tasks.length,
    })

    return {
      site_id: selectedSite,
      work_date: workDate,
      status,
      work_description: workDesc,
      total_workers: totalWorkers,
      member_types: repMemberTypes,
      processes: repProcesses,
      work_types: repWorkTypes,
      location: repLocation,
      author_id: selectedAuthorId,
      author_name: selectedAuthorName,
      main_manpower: mainManpower,
      additional_manpower: additionalManpower.map(worker => ({
        id: worker.workerId || worker.id,
        name: worker.workerName,
        manpower: worker.manpower,
      })),
      materials: filteredMaterials,
    }
  }

  const handleTemporarySave = async () => {
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.', { duration: 2500 })
      setActionStatus({
        type: 'error',
        message: '현장을 선택한 뒤 임시 저장을 진행해주세요.',
      })
      return
    }

    try {
      setActionStatus(null)
      const basePayload = buildPayload('draft')
      const fullPayload = { ...basePayload, tasks }

      console.log('[handleTemporarySave] Sending payload:', fullPayload)
      console.log('[handleTemporarySave] Tasks:', tasks)
      console.log('[handleTemporarySave] MemberTypes:', memberTypes)
      console.log('[handleTemporarySave] WorkContents:', workContents)
      console.log('[handleTemporarySave] WorkTypes:', workTypes)

      const res: any = await createWorklogMutation.mutateAsync(fullPayload)
      const msg = res?.message || '임시 상태로 저장되었습니다.'
      toast.success(msg, { duration: 1800 })
      setActionStatus({ type: 'success', message: msg })
    } catch (error) {
      console.error('Temporary save error:', error)
      toast.error(error instanceof Error ? error.message : '임시 저장에 실패했습니다.', {
        duration: 2500,
        action: { label: '재시도', onClick: () => void handleTemporarySave() },
      })
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '임시 저장에 실패했습니다.',
      })
    }
  }

  const handleSave = async () => {
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.', { duration: 2500 })
      setActionStatus({ type: 'error', message: '현장을 선택한 뒤 저장을 진행해주세요.' })
      return
    }
    if (!workDate) {
      toast.error('작업일자를 입력해주세요.', { duration: 2500 })
      setActionStatus({ type: 'error', message: '작업일자를 입력한 뒤 저장을 진행해주세요.' })
      return
    }

    try {
      setActionStatus(null)
      const res: any = await createWorklogMutation.mutateAsync({
        ...buildPayload('submitted'),
        tasks,
      })
      const msg = res?.message || '작업일지가 저장되었습니다.'
      toast.success(msg, { duration: 1800 })
      setActionStatus({ type: 'success', message: msg })
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.', {
        duration: 2500,
        action: { label: '재시도', onClick: () => void handleSave() },
      })
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '작업일지 저장에 실패했습니다.',
      })
    }
  }

  return (
    <div className="container fs-100 pb-40">
      {/* Auth Debug Info - Only in development */}
      {showSlowSaving && (
        <div className="slow-loading-overlay" role="status" aria-live="polite" aria-busy="true">
          <div className="slow-loading-card">
            <div className="slow-loading-header">
              <div className="slow-loading-spinner" aria-hidden="true" />
              <div className="slow-loading-title">저장 중...</div>
            </div>
            <div className="slow-loading-bar" aria-hidden="true">
              <div className="slow-loading-bar__indeterminate" />
            </div>
            <div className="slow-loading-sub">
              처리가 3초 이상 걸리고 있습니다. 잠시만 기다려 주세요.
            </div>
          </div>
        </div>
      )}
      {/* 빠른메뉴 */}
      <QuickMenu />
      {/* 공지사항 */}
      {userProfile?.role !== 'site_manager' && <NoticeSection />}
      {/* Work Site Card */}
      <div
        className="rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-3">
          <div
            className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2"
            style={{ color: 'var(--header-navy)' }}
          >
            <MapPin className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
            작업현장 <span className="text-red-500">*</span>
          </div>
          <span className="bg-red-50 text-red-500 text-[13px] font-bold h-8 px-3.5 rounded-xl flex items-center">
            * 필수 입력
          </span>
        </div>

        <div className="mb-3">
          <SiteSearchInput
            ref={siteInputRef as any}
            siteQuery={siteQuery}
            onQueryChange={query => {
              siteUserEditingRef.current = true
              setSiteQuery(query)
              setSiteDropdownOpen(true)
              setSiteActiveIndex(0)
              if (!query.trim()) {
                if (selectedSite) {
                  setSelectedSite('')
                  setExternalSiteInfo(null)
                }
              } else if (selectedSite) {
                setSelectedSite('')
                setExternalSiteInfo(null)
              }
            }}
            siteDropdownOpen={siteDropdownOpen}
            setSiteDropdownOpen={setSiteDropdownOpen}
            siteActiveIndex={siteActiveIndex}
            setSiteActiveIndex={setSiteActiveIndex}
            sites={sites}
            sitesLoading={sitesLoading}
            sitesError={sitesError}
            siteDropdownItems={siteDropdownItems}
            onSiteSelect={handleSelectSite}
            onClear={handleClearSite}
            siteUserEditingRef={siteUserEditingRef}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-[15px] font-bold mb-2"
              style={{ color: 'var(--text-sub)' }}
            >
              소속 <span className="text-[14px] font-medium ml-1">ㅣ 자동연동</span>
            </label>
            <input
              type="text"
              className="w-full h-[54px] bg-slate-100 rounded-xl px-4 text-[17px] font-medium cursor-not-allowed"
              style={{
                background: '#f1f5f9',
                border: '1px solid var(--border)',
                color: 'var(--text-sub)',
              }}
              value={organizationLabel}
              readOnly
              placeholder="자동연동"
            />
          </div>
          <div>
            <label
              className="block text-[15px] font-bold mb-2"
              style={{ color: 'var(--text-sub)' }}
            >
              작업일자
            </label>
            <div className="relative" onClick={handleCalendarClick}>
              <input
                type="date"
                className="w-full h-[54px] bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 text-[17px] font-medium outline-none date-input"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-main)',
                }}
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        {sitesError && (
          <div className="inline-error mt-3" role="alert">
            <span>{sitesError}</span>
            <button type="button" className="retry-btn" onClick={reloadSites}>
              재시도
            </button>
          </div>
        )}
      </div>
      <WorkLogInputs
        organizationLabel={organizationLabel}
        workDate={workDate}
        setWorkDate={setWorkDate}
        onCalendarClick={handleCalendarClick}
        onCalendarKeyDown={handleCalendarKeyDown}
        selectedAuthorId={selectedAuthorId}
        setSelectedAuthorId={setSelectedAuthorId}
        userOptions={userOptions}
        usersLoading={usersLoading}
        mainManpower={mainManpower}
        setMainManpower={setMainManpower}
        additionalManpower={additionalManpower}
        setAdditionalManpower={setAdditionalManpower}
        laborHourValues={laborHourValues}
        userProfile={userProfile}
        defaultLaborHour={defaultLaborHour}
        allUserOptions={allUserOptions}
        memberTypes={memberTypes}
        setMemberTypes={setMemberTypes}
        MEMBER_TYPE_OPTIONS={MEMBER_TYPE_OPTIONS}
        workContents={workContents}
        setWorkContents={setWorkContents}
        WORK_PROCESS_OPTIONS={WORK_PROCESS_OPTIONS}
        workTypes={workTypes}
        setWorkTypes={setWorkTypes}
        WORK_TYPE_OPTIONS={WORK_TYPE_OPTIONS}
        location={location}
        setLocation={setLocation}
        tasks={tasks}
        setTasks={setTasks}
        materials={materials}
        setMaterials={setMaterials}
      />
      {/* 액션 버튼 */}
      <div
        className="sticky bottom-[80px] z-40 p-2.5 bg-white border border-gray-200 rounded-2xl shadow-xl mb-5 transition-all"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex gap-2.5">
          <button
            className="flex-1 h-[50px] bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-300 text-[15px]"
            onClick={handleReset}
          >
            초기화
          </button>
          <button
            className="flex-1 h-[50px] bg-sky-50 text-sky-600 font-bold rounded-xl border border-sky-200 text-[15px]"
            onClick={handleTemporarySave}
            disabled={createWorklogMutation.isPending}
          >
            임시 저장
          </button>
          <button
            className="flex-1 h-[50px] text-white font-bold rounded-xl transition-all text-[15px]"
            style={{ background: 'var(--header-navy)' }}
            onClick={handleSave}
            disabled={createWorklogMutation.isPending}
          >
            일지저장
          </button>
        </div>
      </div>{' '}
      {/* Inline action feedback is intentionally hidden to avoid duplicate messaging with toasts */}
      <div
        className="work-form-container home-media-wrapper rounded-2xl p-6 shadow-sm border border-transparent dark:border-slate-700 mb-4"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div
            className="text-xl font-bold text-header-navy dark:text-white flex items-center gap-2"
            style={{ color: 'var(--header-navy)' }}
          >
            <Image className="w-5 h-5" style={{ color: 'var(--header-navy)' }} />
            사진 및 도면
          </div>
        </div>

        <div className="home-media-grid">
          <PhotoUploadCard
            className="home-media-grid__item"
            selectedSite={selectedSite}
            workDate={workDate}
          />
          <DrawingQuickAction
            className="home-media-grid__item"
            selectedSite={selectedSite}
            workDate={workDate}
          />
        </div>
      </div>
      {/* 작성 내용 요약 - 페이지 맨 아래 배치 */}
      <SummarySection
        site={sites.find(s => s.id === selectedSite)?.name || ''}
        organization={organizationLabel}
        workDate={workDate}
        author={selectedAuthorName}
        memberTypes={normalizedMemberTypes}
        workContents={normalizedWorkProcesses}
        workTypes={normalizedWorkTypes}
        personnelCount={(() => {
          const total = mainManpower + additionalManpower.reduce((sum, m) => sum + m.manpower, 0)
          return calculateWorkerCount(total)
        })()}
        location={location}
        materials={materials}
        beforePhotosCount={0}
        afterPhotosCount={0}
        manpower={mainManpower + additionalManpower.reduce((sum, m) => sum + m.manpower, 0)}
        drawingCount={0}
      />
    </div>
  )
}
