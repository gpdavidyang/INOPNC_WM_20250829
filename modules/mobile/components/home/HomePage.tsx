'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { QuickMenu } from './QuickMenu'
import { NoticeSection } from './NoticeSection'
import { DepartmentSelect } from './DepartmentSelect'
import { LocationInput } from './LocationInput'
import { MultiSelectButtons } from './MultiSelectButtons'
import { NumberInput } from './NumberInput'
import { AdditionalManpower as AdditionalManpowerComponent } from './AdditionalManpower'
import { PhotoUploadCard } from './PhotoUploadCard'
import { DrawingQuickAction } from './DrawingQuickAction'
import { SummarySection } from './SummarySection'
import { MaterialsInput } from './MaterialsInput'
import { toast } from 'sonner'
import { WorkLogLocation, WorkSection, AdditionalManpower } from '@/types/worklog'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'
import { User } from '@supabase/supabase-js'
import { useCreateWorklog, MaterialEntry } from '@/modules/mobile/hooks/use-worklog-mutations'
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/work-form.css'
import '@/modules/mobile/styles/upload.css'
import '@/modules/mobile/styles/summary.css'
import '@/modules/mobile/styles/summary-section.css'
import '@/modules/mobile/styles/drawing-quick.css'

const MEMBER_TYPE_OPTIONS = [
  { value: '슬라브', label: '슬라브' },
  { value: '거더', label: '거더' },
  { value: '기둥', label: '기둥' },
  { value: 'other', label: '기타' },
] as const

const WORK_PROCESS_OPTIONS = [
  { value: '균열', label: '균열' },
  { value: '면', label: '면' },
  { value: '마감', label: '마감' },
  { value: 'other', label: '기타' },
] as const

const WORK_TYPE_OPTIONS = [
  { value: '지하', label: '지하' },
  { value: '지상', label: '지상' },
  { value: '지붕', label: '지붕' },
  { value: 'other', label: '기타' },
] as const

const MEMBER_TYPE_VALUES = MEMBER_TYPE_OPTIONS.filter(option => option.value !== 'other').map(
  option => option.value
)
const WORK_PROCESS_VALUES = WORK_PROCESS_OPTIONS.filter(option => option.value !== 'other').map(
  option => option.value
)
const WORK_TYPE_VALUES = WORK_TYPE_OPTIONS.filter(option => option.value !== 'other').map(
  option => option.value
)

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

  // 기본 상태
  const [selectedSite, setSelectedSite] = useState('')
  const [workDate, setWorkDate] = useState('')
  const [workCards, setWorkCards] = useState([{ id: 1 }])

  // v2.0 새로운 상태들
  const [department, setDepartment] = useState('')
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
  const [mainManpower, setMainManpower] = useState(1)
  const [workSections, setWorkSections] = useState<WorkSection[]>([])
  const [additionalManpower, setAdditionalManpower] = useState<AdditionalManpower[]>([])
  const [materials, setMaterials] = useState<MaterialEntry[]>([])
  const [actionStatus, setActionStatus] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const normalizedMemberTypes = useMemo(
    () => normalizeSelections(memberTypes, MEMBER_TYPE_VALUES),
    [memberTypes]
  )
  const normalizedWorkProcesses = useMemo(
    () => normalizeSelections(workContents, WORK_PROCESS_VALUES),
    [workContents]
  )
  const normalizedWorkTypes = useMemo(
    () => normalizeSelections(workTypes, WORK_TYPE_VALUES),
    [workTypes]
  )
  const createWorklogMutation = useCreateWorklog()

  // 현장 데이터 상태
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState<string | null>(null)

  // 사용자 프로필 상태 - Use auth context profile or initial profile
  const [userProfile, setUserProfile] = useState<any>(authProfile || initialProfile || null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Prefill from localStorage (draft redirect)
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('worklog_prefill') : null
      if (!raw) return
      const data = JSON.parse(raw)
      if (data?.siteId) setSelectedSite(String(data.siteId))
      if (data?.workDate) setWorkDate(String(data.workDate))
      if (data?.department) setDepartment(String(data.department))
      if (data?.location)
        setLocation({
          block: String(data.location.block || ''),
          dong: String(data.location.dong || ''),
          unit: String(data.location.unit || ''),
        })
      if (Array.isArray(data?.memberTypes)) setMemberTypes(data.memberTypes)
      if (Array.isArray(data?.workProcesses)) setWorkContents(data.workProcesses)
      if (Array.isArray(data?.workTypes)) setWorkTypes(data.workTypes)
      if (typeof data?.mainManpower === 'number') setMainManpower(data.mainManpower)
      if (Array.isArray(data?.materials)) setMaterials(data.materials)
      if (Array.isArray(data?.additionalManpower)) setAdditionalManpower(data.additionalManpower)
      // one-time use
      localStorage.removeItem('worklog_prefill')
      // scroll to form
      setTimeout(() => {
        const el = document.querySelector('.work-form-container')
        if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (e) {
      void e
    }
  }, [])

  // Set today's date on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setWorkDate(today)

    // CRITICAL FIX: Removed initSessionSync() to prevent duplicate session monitoring
    // Session sync is now handled entirely by the AuthProvider to avoid validation conflicts
    console.log('[HomePage] Initialized without duplicate session sync')
  }, [])

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

  // 선택된 파트너사(소속)에 따라 현장 목록 불러오기
  useEffect(() => {
    if (!department) {
      setSites([])
      setSitesLoading(false)
      setSitesError(null)
      return
    }

    const controller = new AbortController()
    let isActive = true

    const fetchSites = async () => {
      setSitesLoading(true)
      setSitesError(null)

      try {
        const response = await fetch(
          `/api/sites/by-partner?partner_company_id=${encodeURIComponent(department)}`,
          {
            method: 'GET',
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
            cache: 'no-store',
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to load partner sites (status: ${response.status})`)
        }

        const payload = await response.json()
        const siteList: Site[] = Array.isArray(payload)
          ? payload.map(site => ({
              id: site.id,
              name: site.name,
              organization_id: site.organization_id ?? null,
            }))
          : []

        if (isActive) {
          setSites(siteList)
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }

        console.error('현장 조회 오류:', err)
        if (isActive) {
          setSitesError('현장 목록을 불러올 수 없습니다.')
          setSites([])
        }
      } finally {
        if (isActive) {
          setSitesLoading(false)
        }
      }
    }

    fetchSites()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [department])

  // 소속 변경시 현장 선택 초기화
  useEffect(() => {
    setSelectedSite('')
  }, [department])

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
      setWorkCards([{ id: 1 }])
      const today = new Date().toISOString().split('T')[0]
      setWorkDate(today)
      // v2.0 상태들도 초기화
      setDepartment('')
      setLocation({ block: '', dong: '', unit: '' })
      setMemberTypes([])
      setWorkContents([])
      setWorkTypes([])
      setMainManpower(1)
      setWorkSections([])
      setAdditionalManpower([])
      setMaterials([])
      setActionStatus({ type: 'success', message: '입력 내용을 초기화했습니다.' })
      toast.success('초기화되었습니다.')
    }
  }

  const buildPayload = (status: 'draft' | 'submitted') => {
    const totalWorkers =
      mainManpower + additionalManpower.reduce((sum, m) => sum + (Number(m.manpower) || 0), 0)

    const filteredMaterials = materials
      .filter(material => material.material_name.trim())
      .map(material => ({
        material_name: material.material_name,
        quantity: Number(material.quantity) || 0,
        unit: material.unit || '개',
        notes: material.notes,
      }))

    return {
      site_id: selectedSite,
      work_date: workDate,
      status,
      work_description: normalizedWorkProcesses.join(', '),
      total_workers: totalWorkers,
      member_types: normalizedMemberTypes,
      processes: normalizedWorkProcesses,
      work_types: normalizedWorkTypes,
      location: location,
      main_manpower: mainManpower,
      additional_manpower: additionalManpower.map(worker => ({
        name: worker.workerName,
        manpower: worker.manpower,
      })),
      materials: filteredMaterials,
    }
  }

  const handleTemporarySave = async () => {
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.')
      setActionStatus({
        type: 'error',
        message: '현장을 선택한 뒤 임시저장을 진행해주세요.',
      })
      return
    }

    try {
      setActionStatus(null)
      await createWorklogMutation.mutateAsync({ ...buildPayload('draft'), tasks })
      toast.success('임시저장되었습니다.')
      setActionStatus({ type: 'success', message: '임시저장을 완료했습니다.' })
    } catch (error) {
      console.error('Temporary save error:', error)
      toast.error(error instanceof Error ? error.message : '임시저장에 실패했습니다.')
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '임시저장에 실패했습니다.',
      })
    }
  }

  const handleSave = async () => {
    if (!department) {
      toast.error('소속을 선택해주세요.')
      setActionStatus({ type: 'error', message: '소속을 선택한 뒤 저장을 진행해주세요.' })
      return
    }
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.')
      setActionStatus({ type: 'error', message: '현장을 선택한 뒤 저장을 진행해주세요.' })
      return
    }
    if (!workDate) {
      toast.error('작업일자를 입력해주세요.')
      setActionStatus({ type: 'error', message: '작업일자를 입력한 뒤 저장을 진행해주세요.' })
      return
    }

    try {
      setActionStatus(null)
      await createWorklogMutation.mutateAsync({ ...buildPayload('submitted'), tasks })
      toast.success('작업일지가 저장되었습니다.')
      setActionStatus({ type: 'success', message: '작업일지를 저장했습니다.' })
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.')
      setActionStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '작업일지 저장에 실패했습니다.',
      })
    }
  }

  return (
    <main className="container fs-100">
      {/* Auth Debug Info - Only in development */}
      {/* 빠른메뉴 */}
      <QuickMenu />

      {/* 공지사항 */}
      <NoticeSection />

      {/* 통합된 작업 섹션 - 요구사항에 맞게 하나의 카드로 통합 */}
      <div className="work-form-container">
        {/* 작업일지 작성 제목 */}
        <div className="work-form-title">
          <h2 className="work-form-main-title">작업일지 작성</h2>
        </div>

        {/* 선택 현장 */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              선택 현장 <span className="required">*</span>
            </h3>
            <span className="form-note">필수입력값(*)작성 후 저장</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <DepartmentSelect value={department} onChange={setDepartment} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                현장 <span className="required">*</span>
              </label>
              <CustomSelect
                value={selectedSite}
                onValueChange={setSelectedSite}
                disabled={!department || sitesLoading}
              >
                <CustomSelectTrigger className="form-select">
                  <CustomSelectValue
                    placeholder={
                      !department
                        ? '소속을 먼저 선택하세요'
                        : sitesLoading
                          ? '현장 로딩 중...'
                          : sitesError
                            ? '현장 선택 불가'
                            : '현장 선택'
                    }
                  />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  {sites.length > 0 ? (
                    sites.map(site => (
                      <CustomSelectItem key={site.id} value={site.id || `site-${site.name}`}>
                        {site.name}
                      </CustomSelectItem>
                    ))
                  ) : (
                    <CustomSelectItem value="none" disabled>
                      현장을 선택하세요
                    </CustomSelectItem>
                  )}
                </CustomSelectContent>
              </CustomSelect>
              {sitesError && <div className="text-red-500 text-sm mt-1">{sitesError}</div>}
            </div>
          </div>

          {/* 선택된 현장 확인 표시 */}
          {selectedSite && (
            <div className="form-row mt-3">
              <div className="form-group">
                <label className="form-label">선택된 현장</label>
                <input
                  type="text"
                  className="form-input"
                  value={sites.find(s => s.id === selectedSite)?.name || ''}
                  readOnly
                  style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 작성 정보 입력 */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              작성 정보 입력 <span className="required">*</span>
            </h3>
            <span className="author-info">작성자</span>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">작업일자</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  className="form-input date-input"
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  required
                />
                <div
                  className="calendar-icon"
                  onClick={handleCalendarClick}
                  onKeyDown={handleCalendarKeyDown}
                  role="button"
                  tabIndex={0}
                  aria-label="날짜 선택"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">작성자</label>
              <input
                type="text"
                className="form-input"
                placeholder="작성자"
                value={
                  authLoading || profileLoading ? '로딩 중...' : userProfile?.full_name || '사용자'
                }
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 작업 내용 기록 */}
        <div className="form-section work-content-section">
          <div className="section-header">
            <h3 className="section-title">
              작업 내용 기록 <span className="required">*</span>
            </h3>
            <button
              className="add-btn"
              onClick={() => {
                // 간단 유효성 검사 후 작업 세트에 추가
                const m = normalizeSelections(memberTypes, MEMBER_TYPE_VALUES)
                const p = normalizeSelections(workContents, WORK_PROCESS_VALUES)
                const w = normalizeSelections(workTypes, WORK_TYPE_VALUES)
                if (
                  m.length === 0 ||
                  p.length === 0 ||
                  w.length === 0 ||
                  !location.block ||
                  !location.dong ||
                  !location.unit
                ) {
                  toast.error('부재명/작업공정/작업유형/블럭·동·층을 먼저 입력하세요.')
                  return
                }
                setTasks(prev => [
                  ...prev,
                  { memberTypes: m, processes: p, workTypes: w, location },
                ])
                // 입력 초기화 (요구안 동작)
                setMemberTypes([])
                setWorkContents([])
                setWorkTypes([])
                setLocation({ block: '', dong: '', unit: '' })
              }}
            >
              추가
            </button>
          </div>

          {/* 부재명 멀티 선택 */}
          <MultiSelectButtons
            label="부재명"
            options={MEMBER_TYPE_OPTIONS}
            selectedValues={memberTypes}
            onChange={setMemberTypes}
            customInputPlaceholder="부재명을 직접 입력하세요"
            className="mb-3"
          />

          {/* 작업공정 멀티 선택 */}
          <MultiSelectButtons
            label="작업공정"
            options={WORK_PROCESS_OPTIONS}
            selectedValues={workContents}
            onChange={setWorkContents}
            customInputPlaceholder="작업공정을 직접 입력하세요"
            className="mb-3"
          />
        </div>

        {/* 작업구간 */}
        <div className="form-section work-section">
          <div className="section-header">
            <h3 className="section-title">작업구간</h3>
          </div>

          {/* 작업유형 멀티 선택 */}
          <MultiSelectButtons
            label="작업유형"
            options={WORK_TYPE_OPTIONS}
            selectedValues={workTypes}
            onChange={setWorkTypes}
            customInputPlaceholder="작업유형을 직접 입력하세요"
            className="mb-3"
          />

          {/* 블럭/동/층 */}
          <LocationInput location={location} onChange={setLocation} className="mt-3" />
        </div>

        {/* 추가된 작업 세트 */}
        {tasks.length > 0 && (
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">추가된 작업 세트</h3>
            </div>
            <ul className="added-tasks-list">
              {tasks.map((t, i) => (
                <li key={i} className="added-task-item">
                  <span className="task-summary">
                    #{i + 1} 부재:{t.memberTypes.join(', ') || '-'} / 공정:
                    {t.processes.join(', ') || '-'} / 유형:{t.workTypes.join(', ') || '-'} / 위치:
                    {`${t.location.block} ${t.location.dong} ${t.location.unit}`.trim()}
                  </span>
                  <button
                    className="delete-tag-btn"
                    onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))}
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 공수(일) */}
        <div className="form-section manpower-section">
          <div className="section-header">
            <h3 className="section-title">
              공수(일) <span className="required">*</span>
            </h3>
            <button
              className="add-btn"
              onClick={() => {
                const newManpower: AdditionalManpower = {
                  id: Date.now().toString(),
                  workerId: userProfile?.id || '',
                  workerName: userProfile?.full_name || '사용자',
                  manpower: 1,
                }
                setAdditionalManpower([...additionalManpower, newManpower])
              }}
            >
              추가
            </button>
          </div>
          <div className="form-row author-manpower-row">
            <div className="form-group">
              <label className="form-label">작성자</label>
              <input
                type="text"
                className="form-input"
                value={
                  authLoading || profileLoading ? '로딩 중...' : userProfile?.full_name || '사용자'
                }
                readOnly
              />
            </div>
            <div className="form-group">
              <NumberInput
                label="공수"
                value={mainManpower}
                onChange={setMainManpower}
                values={[0, 0.5, 1, 1.5, 2, 2.5, 3]}
              />
            </div>
          </div>
        </div>

        {/* 추가된 공수들 */}
        {additionalManpower.map(item => (
          <div key={item.id} className="additional-manpower-section">
            <div className="section-header">
              <h3 className="section-title">공수(일)</h3>
              <div className="header-actions">
                <button
                  className="delete-tag-btn"
                  onClick={() =>
                    setAdditionalManpower(additionalManpower.filter(m => m.id !== item.id))
                  }
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="form-row author-manpower-row">
              <div className="form-group">
                <label className="form-label">작성자</label>
                <input
                  type="text"
                  className="form-input"
                  value={item.workerName}
                  onChange={e => {
                    const updated = additionalManpower.map(m =>
                      m.id === item.id ? { ...m, workerName: e.target.value } : m
                    )
                    setAdditionalManpower(updated)
                  }}
                  placeholder="이름 입력"
                />
              </div>
              <div className="form-group">
                <NumberInput
                  label="공수"
                  value={item.manpower}
                  onChange={value => {
                    const updated = additionalManpower.map(m =>
                      m.id === item.id ? { ...m, manpower: value } : m
                    )
                    setAdditionalManpower(updated)
                  }}
                  values={[0, 0.5, 1, 1.5, 2, 2.5, 3]}
                />
              </div>
            </div>
          </div>
        ))}

        <MaterialsInput materials={materials} onChange={setMaterials} />

        {/* 액션 버튼 */}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            처음부터
          </button>
          <button
            className="btn btn-temp-save"
            onClick={handleTemporarySave}
            disabled={createWorklogMutation.isPending}
          >
            임시저장
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={createWorklogMutation.isPending}
          >
            저장하기
          </button>
        </div>

        {actionStatus && (
          <div className={`action-feedback ${actionStatus.type}`} role="status" aria-live="polite">
            {actionStatus.message}
          </div>
        )}
      </div>

      {/* 사진 업로드 - 별도 카드 */}
      <PhotoUploadCard />

      {/* 도면마킹 - 간소화된 Quick Action */}
      <DrawingQuickAction
        selectedSite={selectedSite}
        siteName={sites.find(s => s.id === selectedSite)?.name}
        userId={userProfile?.id || user?.id}
      />

      {/* 작성 내용 요약 - 페이지 맨 아래 배치 */}
      <SummarySection
        site={sites.find(s => s.id === selectedSite)?.name || ''}
        workDate={workDate}
        author={userProfile?.full_name || ''}
        memberTypes={normalizedMemberTypes}
        workContents={normalizedWorkProcesses}
        workTypes={normalizedWorkTypes}
        personnelCount={mainManpower + additionalManpower.reduce((sum, m) => sum + m.manpower, 0)}
        location={location}
        beforePhotosCount={0}
        afterPhotosCount={0}
        manpower={mainManpower + additionalManpower.reduce((sum, m) => sum + m.manpower, 0)}
        drawingCount={0}
      />
    </main>
  )
}
