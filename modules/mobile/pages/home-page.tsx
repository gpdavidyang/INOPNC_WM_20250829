'use client'

import React, { useState, useEffect } from 'react'
import { useMobileUser } from '@/modules/mobile/hooks/use-mobile-auth'
import { MobileNav } from '@/modules/mobile/components/layout/mobile-nav'

export const HomePage: React.FC = () => {
  return <HomeContent />
}

const HomeContent: React.FC = () => {
  const { profile } = useMobileUser()

  // Form state
  const [workLogForm, setWorkLogForm] = useState({
    site: '',
    workDate: new Date().toISOString().split('T')[0],
    author: profile?.full_name || '',
    parts: [],
    partsCustom: '',
    processes: [],
    processesCustom: '',
    workType: [],
    workTypeCustom: '',
    block: '',
    dong: '',
    hosu: '',
    workHours: 1.0,
    beforePhotos: [],
    afterPhotos: [],
  })

  // Selected chips state
  const [selectedParts, setSelectedParts] = useState([])
  const [selectedProcesses, setSelectedProcesses] = useState([])
  const [selectedWorkType, setSelectedWorkType] = useState([])

  // Notice section state for auto-slide
  const [currentNotice, setCurrentNotice] = useState(0)
  const notices = [
    {
      id: 1,
      type: '공지사항',
      content: '새로운 안전규정이 적용됩니다. 모든 작업자는 필수 안전장비를 착용해주세요.',
      tag: 'notice',
    },
    {
      id: 2,
      type: '업데이트',
      content: '모바일 앱이 업데이트되었습니다. 새로운 기능을 확인해보세요.',
      tag: 'update',
    },
    {
      id: 3,
      type: '이벤트',
      content: '안전작업 우수 현장 시상식이 다음 주에 진행됩니다.',
      tag: 'event',
    },
  ]

  // Auto-slide notice every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNotice(prev => (prev + 1) % notices.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Chip selection handlers
  const toggleChip = (type, value) => {
    if (type === 'parts') {
      setSelectedParts(prev =>
        prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
      )
    } else if (type === 'processes') {
      setSelectedProcesses(prev =>
        prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
      )
    } else if (type === 'workType') {
      setSelectedWorkType(prev =>
        prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
      )
    }
  }

  // Work hours stepper handlers
  const incrementHours = () => {
    setWorkLogForm(prev => ({
      ...prev,
      workHours: Math.min(prev.workHours + 0.5, 24),
    }))
  }

  const decrementHours = () => {
    setWorkLogForm(prev => ({
      ...prev,
      workHours: Math.max(prev.workHours - 0.5, 0.5),
    }))
  }

  // Form handlers
  const handleInputChange = (field, value) => {
    setWorkLogForm(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleReset = () => {
    setWorkLogForm({
      site: '',
      workDate: new Date().toISOString().split('T')[0],
      author: profile?.full_name || '',
      parts: [],
      partsCustom: '',
      processes: [],
      processesCustom: '',
      workType: [],
      workTypeCustom: '',
      block: '',
      dong: '',
      hosu: '',
      workHours: 1.0,
      beforePhotos: [],
      afterPhotos: [],
    })
    setSelectedParts([])
    setSelectedProcesses([])
    setSelectedWorkType([])
  }

  const handleSave = () => {
    // Validation
    if (!workLogForm.site) {
      alert('현장을 선택해주세요.')
      return
    }
    if (!workLogForm.workDate) {
      alert('작업일자를 입력해주세요.')
      return
    }

    console.log('Work log data:', {
      ...workLogForm,
      parts: [...selectedParts, workLogForm.partsCustom].filter(Boolean),
      processes: [...selectedProcesses, workLogForm.processesCustom].filter(Boolean),
      workType: [...selectedWorkType, workLogForm.workTypeCustom].filter(Boolean),
    })

    alert('작업일지가 저장되었습니다.')
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb] font-['Noto_Sans_KR']">
      {/* Header */}
      <header className="appbar bg-white border-b border-[#e6eaf2] h-14 flex items-center px-4">
        <div className="flex items-center gap-3">
          <button className="w-5 h-5 text-[#1A254F]" aria-label="메뉴">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
          <a href="/mobile" className="brand-logo flex items-center">
            <img
              src="https://postfiles.pstatic.net/MjAyNTA5MTBfMjk3/MDAxNzU3NDc4ODkwMTc3.lBcKNGpQIyCk5kkAruIKUApO23ml-EJeX7da8626bQQg.oMA0TTp0F8nLP6ICPLrGelEJMVNg6cS5fdLUsXBb7pUg.PNG/00_%EB%A1%9C%EA%B3%A0-%EC%84%B8%EB%A1%9C%EC%A1%B0%ED%95%A9_n.png?type=w3840"
              alt="INOPNC"
              className="h-8"
            />
          </a>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="relative w-6 h-6 text-[#1A254F]" aria-label="알림">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="notification-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </button>
          <div className="w-8 h-8 bg-[#1A254F] rounded-full flex items-center justify-center text-white text-sm font-medium">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 pb-20">
        {/* Quick Menu Section */}
        <section id="qm-section" className="mb-3">
          <div className="flex items-center gap-2 mb-3">
            <img src="/icons/Flash.png" alt="" className="w-4 h-4" />
            <h3 className="text-[17px] font-bold text-[#1A254F] font-['Noto_Sans_KR']">빠른메뉴</h3>
          </div>
          <ul className="grid grid-cols-6 gap-1 list-none">
            <li>
              <a
                href="/mobile/worklog"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/output-status.svg"
                  alt="출력현황"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">출력현황</span>
              </a>
            </li>
            <li>
              <a
                href="/mobile/worklog"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/report.png"
                  alt="작업일지"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">작업일지</span>
              </a>
            </li>
            <li>
              <a
                href="/mobile/sites"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/site-info.svg"
                  alt="현장정보"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">현장정보</span>
              </a>
            </li>
            <li>
              <a
                href="/mobile/documents"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/documents.svg"
                  alt="문서함"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">문서함</span>
              </a>
            </li>
            <li>
              <a
                href="/mobile/requests"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/headquarters-request.svg"
                  alt="본사요청"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">본사요청</span>
              </a>
            </li>
            <li>
              <a
                href="/mobile/materials"
                className="flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:transform hover:-translate-y-1 hover:scale-105"
              >
                <img
                  src="/icons/inventory.svg"
                  alt="재고관리"
                  className="w-12 h-12 mb-1 transition-transform duration-300 hover:scale-110"
                />
                <span className="text-xs font-semibold text-[#1A254F] text-center">재고관리</span>
              </a>
            </li>
          </ul>
        </section>

        {/* Notice Section */}
        <section id="notice-section" className="mb-3">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-5">
            <div className="notice-content relative overflow-hidden h-12">
              {notices.map((notice, index) => (
                <div
                  key={notice.id}
                  className={`notice-item absolute inset-0 transition-transform duration-500 flex items-center gap-2 ${
                    index === currentNotice
                      ? 'transform translate-y-0'
                      : index < currentNotice
                        ? 'transform -translate-y-full'
                        : 'transform translate-y-full'
                  }`}
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium text-white ${
                      notice.tag === 'notice'
                        ? 'bg-[#1A254F]'
                        : notice.tag === 'update'
                          ? 'bg-[#0068FE]'
                          : 'bg-[#00BCD4]'
                    }`}
                  >
                    {notice.type}
                  </span>
                  <span className="text-sm text-[#101828] font-medium">{notice.content}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Work Log Input Form Section */}
        <section id="worklog-input-section" className="mb-3">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e6eaf2] p-5">
            {/* Site Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#1A254F] font-['Noto_Sans_KR']">
                  현장선택<span className="text-[#EA3829]">*</span>
                </span>
                <span className="text-xs text-gray-600 font-semibold">
                  <span className="text-[#0068FE]">필수입력값(*) 작성 후 저장</span>
                </span>
              </div>
              <select
                value={workLogForm.site}
                onChange={e => handleInputChange('site', e.target.value)}
                className="w-full h-12 px-3 border border-[#e6eaf2] rounded-xl bg-white text-sm font-['Noto_Sans_KR'] focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
              >
                <option value="">선택</option>
                <option value="현장1">현장 1</option>
                <option value="현장2">현장 2</option>
                <option value="현장3">현장 3</option>
              </select>
            </div>

            {/* Work Info Input */}
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-sm font-semibold text-[#1A254F] font-['Noto_Sans_KR']">
                  작성 정보 입력 <span className="text-[#EA3829]">*</span>
                </span>
                <div className="bg-[#1A254F] text-white text-xs px-2 py-1 rounded">작성자</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">작업일자</label>
                  <input
                    type="date"
                    value={workLogForm.workDate}
                    onChange={e => handleInputChange('workDate', e.target.value)}
                    className="w-full h-12 px-3 border border-[#e6eaf2] rounded-xl text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">작성자</label>
                  <input
                    type="text"
                    placeholder="작성자명"
                    value={workLogForm.author}
                    onChange={e => handleInputChange('author', e.target.value)}
                    className="w-full h-12 px-3 border border-[#e6eaf2] rounded-xl text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                  />
                </div>
              </div>
            </div>

            {/* Work Content */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-[#1A254F] mb-2">작업내용</div>
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">부재명</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['기둥', '보', '슬래브'].map(part => (
                    <button
                      key={part}
                      onClick={() => toggleChip('parts', part)}
                      className={`px-3 py-2 border rounded-lg text-xs transition-all duration-200 active:scale-95 ${
                        selectedParts.includes(part)
                          ? 'bg-[#0068FE]/20 border-[#0068FE] text-[#0068FE]'
                          : 'bg-gray-100 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {part}
                    </button>
                  ))}
                  <input
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs flex-1 min-w-[120px] focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="기타 직접입력"
                    value={workLogForm.partsCustom}
                    onChange={e => handleInputChange('partsCustom', e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">작업공정</div>
                <div className="flex flex-wrap gap-2">
                  {['균열', '면', '마감'].map(process => (
                    <button
                      key={process}
                      onClick={() => toggleChip('processes', process)}
                      className={`px-3 py-2 border rounded-lg text-xs transition-all duration-200 active:scale-95 ${
                        selectedProcesses.includes(process)
                          ? 'bg-[#0068FE]/20 border-[#0068FE] text-[#0068FE]'
                          : 'bg-gray-100 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {process}
                    </button>
                  ))}
                  <input
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs flex-1 min-w-[120px] focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="기타 직접입력"
                    value={workLogForm.processesCustom}
                    onChange={e => handleInputChange('processesCustom', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Work Area */}
            <div className="mb-4">
              <div className="border-t border-[#E6ECF4] my-4"></div>
              <div className="text-sm font-semibold text-[#1A254F] mb-3">작업구간</div>
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">작업유형</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {['신축', '보수'].map(type => (
                    <button
                      key={type}
                      onClick={() => toggleChip('workType', type)}
                      className={`px-3 py-2 border rounded-lg text-xs transition-all duration-200 active:scale-95 ${
                        selectedWorkType.includes(type)
                          ? 'bg-[#0068FE]/20 border-[#0068FE] text-[#0068FE]'
                          : 'bg-gray-100 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <input
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs flex-1 min-w-[120px] focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="기타 직접입력"
                    value={workLogForm.workTypeCustom}
                    onChange={e => handleInputChange('workTypeCustom', e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">블럭 / 동 / 호수</div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 h-12 px-3 border border-[#e6eaf2] rounded-xl text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="블럭"
                    value={workLogForm.block}
                    onChange={e => handleInputChange('block', e.target.value)}
                  />
                  <input
                    className="flex-1 h-12 px-3 border border-[#e6eaf2] rounded-xl text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="동"
                    type="number"
                    value={workLogForm.dong}
                    onChange={e => handleInputChange('dong', e.target.value)}
                  />
                  <input
                    className="flex-1 h-12 px-3 border border-[#e6eaf2] rounded-xl text-sm focus:border-[#0068FE] focus:ring-2 focus:ring-[#0068FE]/20"
                    placeholder="호수"
                    type="number"
                    value={workLogForm.hosu}
                    onChange={e => handleInputChange('hosu', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-[#1A254F] mb-3">사진업로드</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-600 mb-2">작업 전 (0)</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-20 flex items-center justify-center bg-gray-50">
                    <button className="text-gray-500 text-xs">+ 사진 추가</button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-2">작업 후 (0)</div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg h-20 flex items-center justify-center bg-gray-50">
                    <button className="text-gray-500 text-xs">+ 사진 추가</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Work Hours Input */}
            <div className="mb-4">
              <div className="text-sm font-semibold text-[#1A254F] mb-3">공수입력</div>
              <div className="flex items-center justify-center">
                <div className="flex items-center bg-white border border-[#e6eaf2] rounded-2xl h-12">
                  <button
                    onClick={decrementHours}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-[#1A254F] active:scale-95 transition-all duration-200"
                    disabled={workLogForm.workHours <= 0.5}
                  >
                    -
                  </button>
                  <div className="px-4 py-2 text-center min-w-[60px] font-medium">
                    {workLogForm.workHours.toFixed(1)}
                  </div>
                  <button
                    onClick={incrementHours}
                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-[#1A254F] active:scale-95 transition-all duration-200"
                    disabled={workLogForm.workHours >= 24}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 active:scale-95 transition-all duration-200"
              >
                초기화
              </button>
              <button
                onClick={handleSave}
                className="flex-1 h-12 bg-[#1A254F] text-white rounded-xl font-semibold hover:bg-[#152041] active:scale-95 transition-all duration-200"
              >
                저장하기
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <MobileNav userRole={profile?.role === 'site_manager' ? 'site_manager' : 'worker'} />
    </div>
  )
}
