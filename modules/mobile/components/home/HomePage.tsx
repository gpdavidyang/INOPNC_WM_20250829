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
import { WorkSectionManager } from './WorkSectionManager'
import { AdditionalManpower as AdditionalManpowerComponent } from './AdditionalManpower'
import { WorkTagManager } from './WorkTagManager'
import { PhotoUploadSection } from './PhotoUploadSection'
import { SummaryPanel } from './SummaryPanel'
import { toast } from 'sonner'
import { WorkLogState, WorkLogLocation, WorkSection, AdditionalManpower } from '@/types/worklog'

// 작업 태그 인터페이스 정의
interface WorkTag {
  id: string
  memberTypes: string[]
  workContents: string[]
  workTypes: string[]
  blockDongUnit?: WorkLogLocation
}

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

export const HomePage: React.FC = () => {
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
  const [workTags, setWorkTags] = useState<WorkTag[]>([])

  // 파일 카운트 상태 (PhotoUploadSection에서 관리하지만 요약에 필요)
  const [beforePhotosCount, setBeforePhotosCount] = useState(0)
  const [afterPhotosCount, setAfterPhotosCount] = useState(0)
  const [drawingsCount, setDrawingsCount] = useState(0)

  // 요약 패널 표시 상태
  const [showSummary, setShowSummary] = useState(false)

  // 현장 데이터 상태
  const [sites, setSites] = useState<Site[]>([])
  const [sitesLoading, setSitesLoading] = useState(false)
  const [sitesError, setSitesError] = useState<string | null>(null)

  // 사용자 프로필 상태
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Set today's date on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setWorkDate(today)
  }, [])

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true)
        const supabase = createClient()

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!session || sessionError) {
          console.log('No session found')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile && !profileError) {
          setUserProfile(profile)
        } else {
          console.error('Profile fetch error:', profileError)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

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
      setWorkTags([])
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

    try {
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
        additional_notes: `작업 태그: ${workTags.length}개, 추가 인력: ${additionalManpower.length}개, 작업 구간: ${workSections.length}개`,
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
    <main className="container" style={{ paddingTop: '60px' }}>
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
                  {sites.map(site => (
                    <CustomSelectItem key={site.id} value={site.id}>
                      {site.name}
                    </CustomSelectItem>
                  ))}
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
                value={profileLoading ? '로딩 중...' : userProfile?.full_name || '사용자'}
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
            <button
              className="add-btn"
              onClick={() => {
                const newTag: WorkTag = {
                  id: Date.now().toString(),
                  memberTypes: [...memberTypes],
                  workContents: [...workContents],
                  workTypes: [...workTypes],
                  blockDongUnit: { ...location },
                }
                setWorkTags([...workTags, newTag])
                // Reset fields after adding
                setMemberTypes([])
                setWorkContents([])
                setWorkTypes([])
              }}
            >
              추가
            </button>
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

          <WorkSectionManager sections={workSections} onChange={setWorkSections} />

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
                value={profileLoading ? '로딩 중...' : userProfile?.full_name || '사용자'}
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

        {/* 추가된 작업 내용들 */}
        {workTags.map(tag => (
          <div key={tag.id} className="additional-work-row">
            <div className="section-header">
              <h3 className="section-title">작업 내용 기록</h3>
              <div className="header-actions">
                <button
                  className="delete-tag-btn"
                  onClick={() => setWorkTags(workTags.filter(t => t.id !== tag.id))}
                >
                  삭제
                </button>
              </div>
            </div>
            <div className="form-group">
              <p>
                <strong>부재명:</strong> {tag.memberTypes.join(', ')}
              </p>
              <p>
                <strong>작업공정:</strong> {tag.workContents.join(', ')}
              </p>
              <p>
                <strong>작업유형:</strong> {tag.workTypes.join(', ')}
              </p>
            </div>
          </div>
        ))}

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

        {/* 사진/도면 업로드 섹션 */}
        <div className="form-section">
          <PhotoUploadSection
            onBeforePhotosChange={setBeforePhotosCount}
            onAfterPhotosChange={setAfterPhotosCount}
            onDrawingsChange={setDrawingsCount}
          />
        </div>

        {/* 작업 태그 (선택사항) */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">작업 태그</h3>
          </div>
          <WorkTagManager tags={workTags} onChange={setWorkTags} />
        </div>
      </div>

      {/* 하단 버튼들 */}
      <div className="mb-4 mt-4">
        <div className="flex gap-2">
          <button className="flex-1 btn-secondary" onClick={handleReset}>
            처음부터
          </button>
          <button className="flex-1 btn-primary" onClick={handleSave}>
            저장하기
          </button>
        </div>
      </div>

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
          beforePhotosCount={beforePhotosCount}
          afterPhotosCount={afterPhotosCount}
          receiptsCount={receiptsCount}
          drawingsCount={drawingsCount}
          className="mb-4"
        />
      )}
    </main>
  )
}
