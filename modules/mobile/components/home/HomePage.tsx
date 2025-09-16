'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
} from '@/components/ui/custom-select'
import { QuickMenu } from './QuickMenu'
import { NoticeSection } from './NoticeSection'
import { WorkCard } from './WorkCard'
import { DepartmentSelect } from './DepartmentSelect'
import { LocationInput } from './LocationInput'
import { MultiSelectButtons } from './MultiSelectButtons'
import { NumberInput } from './NumberInput'
import { AdditionalManpower as AdditionalManpowerComponent } from './AdditionalManpower'
import { PhotoUploadCard } from './PhotoUploadCard'
import { DrawingCard } from './DrawingCard'
import { DrawingQuickAction } from './DrawingQuickAction'
import { SummaryPanel } from './SummaryPanel'
import { SummarySection } from './SummarySection'
import { toast } from 'sonner'
import { WorkLogState, WorkLogLocation, WorkSection, AdditionalManpower } from '@/types/worklog'
import { useAuth } from '@/modules/mobile/providers/AuthProvider'
import { initSessionSync } from '@/lib/auth/session-sync'

// 현장 인터페이스 정의
interface Site {
  id: string
  name: string
  organization_id: string
}
import '@/modules/mobile/styles/home.css'
import '@/modules/mobile/styles/work-form.css'
import '@/modules/mobile/styles/upload.css'
import '@/modules/mobile/styles/summary.css'
import '@/modules/mobile/styles/summary-section.css'
import '@/modules/mobile/styles/drawing-quick.css'
import { User } from '@supabase/supabase-js'

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
  const [mainManpower, setMainManpower] = useState(1)
  const [workSections, setWorkSections] = useState<WorkSection[]>([])
  const [additionalManpower, setAdditionalManpower] = useState<AdditionalManpower[]>([])

  // 요약 패널 표시 상태
  const [showSummary, setShowSummary] = useState(false)

  // 현장 데이터 상태
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState<string | null>(null)

  // 사용자 프로필 상태 - Use auth context profile or initial profile
  const [userProfile, setUserProfile] = useState<any>(authProfile || initialProfile || null)
  const [profileLoading, setProfileLoading] = useState(false)

  // Set today's date on mount and initialize session sync
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setWorkDate(today)

    // Initialize session synchronization
    initSessionSync()
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

  // Refresh session if no user is found
  useEffect(() => {
    if (!authLoading && !user && !initialUser) {
      console.log('No user found, attempting to refresh session...')
      refreshSession()
    }
  }, [authLoading, user, initialUser, refreshSession])

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
    const fetchSites = async () => {
      if (!department) {
        setSites([])
        return
      }

      setSitesLoading(true)
      setSitesError(null)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('partner_site_mappings')
          .select('site_id, sites(id, name)')
          .eq('partner_company_id', department)
          .eq('is_active', true)

        if (error) {
          console.error('현장 조회 실패:', error)
          setSitesError('현장 목록을 불러올 수 없습니다.')
          return
        }

        // 데이터 변환: partner_site_mappings 결과를 Site 인터페이스에 맞게 변환
        const siteList = (data || [])
          .filter(mapping => mapping.sites) // sites가 null이 아닌 경우만
          .map(mapping => ({
            id: mapping.sites.id,
            name: mapping.sites.name,
            organization_id: '', // 필요시 추가
          }))

        setSites(siteList)
      } catch (err) {
        console.error('현장 조회 오류:', err)
        setSitesError('현장 목록을 불러올 수 없습니다.')
      } finally {
        setSitesLoading(false)
      }
    }

    fetchSites()
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
      setShowSummary(false)
      toast.success('초기화되었습니다.')
    }
  }

  const handleSave = async () => {
    if (!department) {
      toast.error('소속을 선택해주세요.')
      return
    }
    if (!selectedSite) {
      toast.error('현장을 선택해주세요.')
      return
    }
    if (!workDate) {
      toast.error('작업일자를 입력해주세요.')
      return
    }

    // 요약 패널 표시
    setShowSummary(true)

    try {
      // 작업 내용 구성
      const workContentDetails = {
        memberTypes: memberTypes,
        workContents: workContents,
        workTypes: workTypes,
        mainManpower: mainManpower,
        additionalManpower: additionalManpower.map(m => ({
          name: m.workerName,
          manpower: m.manpower,
        })),
      }

      const workData = {
        site_id: selectedSite,
        partner_company_id: department, // department가 파트너사 ID
        work_date: workDate,
        work_content: workContents.join(', ') || '',
        location_info: {
          block: location.block,
          dong: location.dong,
          unit: location.unit,
        },
        additional_notes: JSON.stringify(workContentDetails),
        total_manpower: mainManpower + additionalManpower.reduce((sum, m) => sum + m.manpower, 0),
      }

      const response = await fetch('/api/admin/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save work log')
      }

      toast.success('작업일지가 저장되었습니다.')

      // 저장 후 폼 초기화는 선택적으로
      // handleReset()
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : '저장에 실패했습니다.')
    }
  }

  return (
    <main className="container fs-100" style={{ paddingTop: '60px' }}>
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
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              작업 내용 기록 <span className="required">*</span>
            </h3>
          </div>

          {/* 부재명 멀티 선택 */}
          <MultiSelectButtons
            label="부재명"
            options={[
              { value: '슬라브', label: '슬라브' },
              { value: '거더', label: '거더' },
              { value: '기둥', label: '기둥' },
              { value: 'other', label: '기타' },
            ]}
            selectedValues={memberTypes}
            onChange={setMemberTypes}
            customInputPlaceholder="부재명을 직접 입력하세요"
            className="mb-3"
          />

          {/* 작업공정 멀티 선택 */}
          <MultiSelectButtons
            label="작업공정"
            options={[
              { value: '균열', label: '균열' },
              { value: '면', label: '면' },
              { value: '마감', label: '마감' },
              { value: 'other', label: '기타' },
            ]}
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
            options={[
              { value: '지하', label: '지하' },
              { value: '지붕', label: '지붕' },
              { value: 'other', label: '기타' },
            ]}
            selectedValues={workTypes}
            onChange={setWorkTypes}
            customInputPlaceholder="작업유형을 직접 입력하세요"
            className="mb-3"
          />

          {/* 블럭/동/호수 */}
          <LocationInput location={location} onChange={setLocation} className="mt-3" />
        </div>

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

        {/* 액션 버튼 */}
        <div className="form-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            처음부터
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            저장하기
          </button>
        </div>
      </div>

      {/* 사진 업로드 - 별도 카드 */}
      <PhotoUploadCard />

      {/* 도면마킹 - 간소화된 Quick Action */}
      <DrawingQuickAction
        selectedSite={selectedSite}
        siteName={sites.find(s => s.id === selectedSite)?.name}
        userId={userProfile?.id || user?.id}
      />

      {/* 요약 패널 */}
      {showSummary && (
        <SummaryPanel
          selectedSite={selectedSite}
          workDate={workDate}
          department={department}
          location={location}
          memberTypes={memberTypes}
          workTypes={workTypes}
          mainManpower={mainManpower}
          workSections={workSections}
          additionalManpower={additionalManpower}
          workContents={workContents}
          beforePhotosCount={0}
          afterPhotosCount={0}
          drawingsCount={0}
          className="mb-4"
        />
      )}

      {/* 작성 내용 요약 - 페이지 맨 아래 배치 */}
      <SummarySection
        site={sites.find(s => s.id === selectedSite)?.name || ''}
        workDate={workDate}
        author={userProfile?.full_name || ''}
        memberTypes={memberTypes}
        workContents={workContents}
        workTypes={workTypes}
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
