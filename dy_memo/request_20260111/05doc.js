/* eslint-disable */
// ================================================================
// 상수 및 Mock 데이터
// ================================================================

// 현장 데이터 (@mainpage.html과 동일)
const REGION_SITES = {
  전체: [],
  수도권: [
    { value: 'site1', text: '자이 아파트 101동', dept: 'HQ' },
    { value: 'site2', text: '삼성 반도체 P3', dept: 'HQ' },
    { value: 'site3', text: '힐스테이트 센트럴', dept: 'HQ' },
    { value: 'site13', text: '서울 롯데타워 보수', dept: 'HQ' },
    { value: 'site14', text: '인천 공항 제2터미널', dept: 'HQ' },
    { value: 'site15', text: '광명 무역센터', dept: 'HQ' },
  ],
  충청권: [
    { value: 'site4', text: '대전 테크노밸리', dept: 'HQ' },
    { value: 'site5', text: '청주 산업단지', dept: 'HQ' },
    { value: 'site16', text: '천안 아산 배방지구', dept: 'HQ' },
    { value: 'site17', text: '세종 정부청사 별관', dept: 'HQ' },
  ],
  전라권: [
    { value: 'site6', text: '광주 첨단단지', dept: 'HQ' },
    { value: 'site7', text: '전주 혁신도시', dept: 'HQ' },
    { value: 'site18', text: '여수 국가산업단지', dept: 'HQ' },
  ],
  경상권: [
    { value: 'site8', text: '부산 해운대 엘시티', dept: 'HQ' },
    { value: 'site9', text: '울산 현대자동차 공장', dept: 'HQ' },
    { value: 'site10', text: '대구 수성구 범어동', dept: 'HQ' },
    { value: 'site19', text: '포항 제철소 2고로', dept: 'HQ' },
    { value: 'site20', text: '창원 국가산단', dept: 'HQ' },
  ],
  강원권: [
    { value: 'site11', text: '강릉 관광단지', dept: 'HQ' },
    { value: 'site12', text: '원주 혁신도시', dept: 'HQ' },
    { value: 'site21', text: '춘천 레고랜드', dept: 'HQ' },
  ],
}

const IMG_CONCRETE =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2000&auto=format&fit=crop'
const IMG_CRACK =
  'https://images.unsplash.com/photo-1581094271901-8022df4466f9?q=80&w=2000&auto=format&fit=crop'
const IMG_WALL =
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2000&auto=format&fit=crop'

const REQUIRED_DOC_TYPES = [
  {
    code: 'id_card',
    title: '신분증 사본',
    description: '주민등록증 또는 운전면허증 앞면',
    required: true,
  },
  {
    code: 'safety_edu',
    title: '기초안전보건교육이수증',
    description: '4시간 교육 이수증',
    required: true,
  },
  {
    code: 'bank_copy',
    title: '통장 사본',
    description: '본인 명의의 입출금 통장 앞면',
    required: true,
  },
  {
    code: 'health_check',
    title: '채용 건강검진표',
    description: '최근 1년 이내 검진 결과',
    required: false,
  },
  {
    code: 'pledge',
    title: '보안 서약서',
    description: '현장 보안 준수 서약',
    required: true,
  },
]

const MOCK_DOCS = {
  'my-docs': [
    {
      id: 'id_card',
      title: '신분증 사본',
      description: '주민등록증 또는 운전면허증 앞면',
      required: true,
      status: 'approved',
      author: '홍길동',
      date: '2025-01-10',
      time: '09:00',
      files: [
        {
          id: 'f1',
          type: 'img',
          url: 'https://images.unsplash.com/photo-1633265486064-084b219563de?q=80&w=200&auto=format&fit=crop',
        },
      ],
    },
    {
      id: 'safety_edu',
      title: '기초안전보건교육이수증',
      description: '4시간 교육 이수증',
      required: true,
      status: 'pending',
      author: '홍길동',
      date: '2025-01-12',
      time: '14:30',
      files: [
        {
          id: 'f2',
          type: 'img',
          url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=200&auto=format&fit=crop',
        },
      ],
    },
    {
      id: 'bank_copy',
      title: '통장 사본',
      description: '본인 명의의 입출금 통장 앞면',
      required: true,
      status: 'not_submitted',
      author: '-',
      date: '-',
      time: '-',
      files: [],
    },
    {
      id: 'health_check',
      title: '채용 건강검진표',
      description: '최근 1년 이내 검진 결과',
      required: false,
      status: 'rejected',
      reason: '유효기간 만료 (2024년 검진표 불가)',
      author: '홍길동',
      date: '2025-01-05',
      time: '11:00',
      files: [],
    },
    {
      id: 'pledge',
      title: '보안 서약서',
      description: '현장 보안 준수 서약',
      required: true,
      status: 'not_submitted',
      author: '-',
      date: '-',
      time: '-',
      files: [],
    },
  ],
  'company-docs': [
    {
      id: 'c1',
      category: 'safety',
      title: '2025년 안전보건 관리계획서',
      author: '본사 안전팀',
      date: '2025-01-02',
      fileSize: '12.5MB',
      fileType: 'pdf',
      downloadCount: 124,
      description: '2025년도 현장 안전보건 관리 계획 전체본입니다.',
      isNew: true,
    },
    {
      id: 'c2',
      category: 'rules',
      title: '취업규칙 (2025 개정)',
      author: '인사팀',
      date: '2025-01-10',
      fileSize: '3.2MB',
      fileType: 'pdf',
      downloadCount: 85,
      description: '2025년 1월부로 개정된 취업규칙입니다.',
      isNew: true,
    },
    {
      id: 'c3',
      category: 'forms',
      title: '휴가신청서 양식',
      author: '인사팀',
      date: '2024-12-20',
      fileSize: '45KB',
      fileType: 'hwp',
      downloadCount: 542,
      description: '연차/반차/병가 신청 시 사용하십시오.',
      isNew: false,
    },
    {
      id: 'c4',
      category: 'forms',
      title: '지출결의서 양식',
      author: '재무팀',
      date: '2024-11-15',
      fileSize: '52KB',
      fileType: 'xlsx',
      downloadCount: 890,
      description: '법인카드 및 현금 지출 증빙용',
      isNew: false,
    },
    {
      id: 'c5',
      category: 'manual',
      title: '현장관리 시스템 사용자 매뉴얼 v2.0',
      author: 'DX팀',
      date: '2025-02-01',
      fileSize: '8.4MB',
      fileType: 'pdf',
      downloadCount: 45,
      description: '앱 업데이트에 따른 신규 매뉴얼',
      isNew: true,
    },
  ],
  drawings: [
    {
      id: 'wd1',
      type: 'worklog',
      date: '2025-12-08',
      siteName: '송파 B현장',
      desc: '슬라브/균열/지하',
      author: '김설계',
      status: 'ing',
      drawings: [
        {
          id: 'd1',
          title: '1F_배관평면도.jpg',
          type: 'blueprint',
          source: 'file',
          date: '2025-12-08',
          url: '',
        },
        {
          id: 'd2',
          title: '1F_배관상세도(마킹).jpg',
          type: 'progress',
          source: 'markup',
          date: '2025-12-08',
          url: '',
        },
      ],
    },
    {
      id: 'wd2',
      type: 'worklog',
      date: '2025-12-09',
      siteName: '판교 IT센터',
      desc: '거더/면/지상',
      author: '이전기',
      status: 'open',
      drawings: [],
    },
    {
      id: 'wd3',
      type: 'worklog',
      date: '2025-12-10',
      siteName: '강남 오피스텔',
      desc: '기둥/마감/지붕',
      author: '박방수',
      status: 'done',
      drawings: [
        {
          id: 'd3',
          title: 'B1 방수 시공 상세',
          type: 'progress',
          source: 'markup',
          date: '2025-12-10',
          url: '',
        },
      ],
    },
  ],
  photos: [
    {
      id: 'ph1',
      title: '송파 B현장',
      contractor: 'GS건설',
      affiliation: '협력업체',
      author: '이시공',
      date: '2025-12-09',
      time: '16:45',
      desc: '슬라브/면/지하 ',
      photos: [
        {
          id: 'ph1-1',
          url: IMG_CONCRETE,
          type: 'after',
          caption: '배관 설치 완료',
          date: '2025-12-09 14:00',
        },
        {
          id: 'ph1-2',
          url: IMG_WALL,
          type: 'before',
          caption: '설치 전',
          date: '2025-12-09 10:00',
        },
        {
          id: 'ph1-3',
          url: IMG_CRACK,
          type: 'ref',
          caption: '참고 도면 마킹',
          date: '2025-12-09 13:30',
        },
      ],
    },
    {
      id: 'ph2',
      title: '판교 IT센터',
      contractor: '대림산업',
      affiliation: 'HQ',
      author: '김전기',
      date: '2025-12-10',
      time: '09:30',
      desc: '거더/면/지상',
      photos: [
        {
          id: 'ph2-1',
          url: IMG_WALL,
          type: 'ing',
          caption: '배선 작업 중',
          date: '2025-12-10 09:15',
        },
      ],
    },
  ],
  punch: [
    {
      id: 'p1',
      title: '서울역 복합개발',
      contractor: 'GS건설',
      affiliation: '협력업체',
      author: '김감리',
      date: '2025-12-20',
      time: '14:30',
      status: 'open',
      files: [
        {
          id: 'p1f1',
          name: '현장사진',
          type: 'img',
          currentView: 'before',
          url: IMG_CRACK,
          url_before: IMG_CRACK,
          url_after: '',
          size: '2.5MB',
          ext: 'JPG',
        },
      ],
      punchItems: [
        {
          id: 'p1i1',
          location: 'A동 1층',
          issue: '콘크리트 균열',
          priority: '높음',
          status: 'ing',
          assignee: '이시공',
          dueDate: '2025-12-25',
          date: '2025-12-20',
        },
        {
          id: 'p1i2',
          location: 'A동 2층',
          issue: '방수 시공 불량',
          priority: '중간',
          status: 'open',
          assignee: '박시공',
          dueDate: '2025-12-26',
          date: '2025-12-20',
        },
      ],
    },
    {
      id: 'p2',
      title: '부산 해운대 구축',
      contractor: '삼성물산',
      affiliation: '직영',
      author: '안전팀',
      date: '2025-12-22',
      time: '09:15',
      status: 'done',
      files: [
        {
          id: 'p2f1',
          name: '보수완료',
          type: 'img',
          currentView: 'after',
          url: IMG_WALL,
          url_before: IMG_CRACK,
          url_after: IMG_WALL,
          size: '2.1MB',
          ext: 'JPG',
        },
      ],
      punchItems: [
        {
          id: 'p2i1',
          location: 'B동 1층 로비',
          issue: '타일 들뜨 현상',
          priority: '중간',
          status: 'done',
          assignee: '박시공',
          dueDate: '2025-12-28',
          date: '2025-12-22',
        },
      ],
    },
    {
      id: 'p3',
      title: '강남 오피스텔 3차',
      contractor: 'GS건설',
      affiliation: '협력업체',
      author: '최감리',
      date: '2025-12-23',
      time: '11:00',
      status: 'open',
      files: [
        {
          id: 'p3f1',
          name: '현장사진',
          type: 'img',
          currentView: 'before',
          url: IMG_CONCRETE,
          url_before: IMG_CONCRETE,
          url_after: '',
          size: '3.0MB',
          ext: 'JPG',
        },
      ],
      punchItems: [
        {
          id: 'p3i1',
          location: 'C동 지하 1층',
          issue: '철근 부식',
          priority: '높음',
          status: 'open',
          assignee: '최시공',
          dueDate: '2025-12-27',
          date: '2025-12-23',
        },
        {
          id: 'p3i2',
          location: 'C동 옥상',
          issue: '누수',
          priority: '낮음',
          status: 'ing',
          assignee: '이시공',
          dueDate: '2025-12-29',
          date: '2025-12-23',
        },
      ],
    },
    {
      id: 'p4',
      title: '판교 IT센터',
      contractor: '대림산업',
      affiliation: 'HQ',
      author: '정소장',
      date: '2025-12-24',
      time: '15:20',
      status: 'open',
      files: [
        {
          id: 'p4f1',
          name: '누수위치.jpg',
          type: 'img',
          currentView: 'before',
          url: IMG_CONCRETE,
          url_before: IMG_CONCRETE,
          url_after: '',
          size: '1.5MB',
          ext: 'JPG',
        },
      ],
      punchItems: [
        {
          id: 'p4i1',
          location: '5층 화장실',
          issue: '배관 누수 의심',
          priority: '높음',
          status: 'open',
          assignee: '김설비',
          dueDate: '2025-12-26',
          date: '2025-12-24',
        },
      ],
    },
  ],
}

// ================================================================
// 상태 관리
// ================================================================

const state = {
  activeTab: 'my-docs',
  documents: JSON.parse(JSON.stringify(MOCK_DOCS)),
  selectedIds: new Set(),

  editingId: null,
  companyDocCategory: 'all',
  visibleCount: 5,
  searchQuery: '',
  siteFilter: '',
  punchStatusFilter: 'all',
  selectedGroupId: null,
  isPunchEditMode: false,
  editingPunchData: null,
  previewImageUrl: null,
  previewImageTitle: '',
  // 보고서 에디터 상태
  isReportEditorOpen: false,
  reportZoom: 0.5,
  reportPosition: { x: 0, y: 0 },
  isReportPanning: false,
  reportDragStart: { x: 0, y: 0 },

  // 도면함 내부 상태
  drawingTabState: {}, // { [worklogId]: 'list' | 'upload' | 'tool' }
  drawingUploadType: {}, // { [worklogId]: 'progress' | 'blueprint' }
  expandedWorklogs: new Set(['wd1']), // 기본적으로 첫 번째 항목 펼침

  // 사진함 내부 상태
  photoTabState: {}, // { [groupId]: 'list' | 'upload' | 'registry' }
  expandedPhotoGroups: new Set(['ph1']), // 사진함 첫번째 펼침
  selectedRegistryPhotos: new Set(), // 사진대지용 선택된 사진들
}

// ================================================================
// 헬퍼 함수
// ================================================================

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[0].slice(2)}.${parts[1]}.${parts[2]}`
  }
  return dateStr
}

function getPunchStats() {
  return state.documents['punch'].reduce(
    (acc, site) => {
      if (site.punchItems && Array.isArray(site.punchItems)) {
        site.punchItems.forEach(item => {
          acc.total++
          if (item.status === 'open') acc.open++
          if (item.status === 'done') acc.done++
        })
      }
      return acc
    },
    { total: 0, open: 0, done: 0 }
  )
}

function getFilteredDocs() {
  const q = state.searchQuery.toLowerCase()

  return state.documents[state.activeTab].filter(doc => {
    // 펀치 탭: 현장 필터 적용
    if (state.activeTab === 'punch' && state.siteFilter && doc.title !== state.siteFilter) {
      return false
    }

    // 검색어 매칭 로직
    let matchesSearch
    if (state.activeTab === 'punch') {
      // 펀치: 현장명, 원청사, 소속, 구간별 위치/내용으로 검색
      matchesSearch =
        doc.title.toLowerCase().includes(q) ||
        (doc.contractor && doc.contractor.includes(q)) ||
        (doc.affiliation && doc.affiliation.includes(q)) ||
        (doc.punchItems &&
          doc.punchItems.some(item => item.location.includes(q) || item.issue.includes(q)))

      // 상태 필터 적용
      if (state.punchStatusFilter !== 'all') {
        const hasMatchingStatus =
          doc.punchItems && doc.punchItems.some(item => item.status === state.punchStatusFilter)
        return matchesSearch && hasMatchingStatus
      }
      return matchesSearch
    } else if (state.activeTab === 'drawings') {
      // 도면함: 현장명, 작업 내용, 작성자로 검색
      matchesSearch =
        doc.siteName.toLowerCase().includes(q) ||
        doc.desc.toLowerCase().includes(q) ||
        doc.author.toLowerCase().includes(q)
    } else {
      // 도면, 사진함: 현장명(title)으로만 검색
      matchesSearch = doc.title.toLowerCase().includes(q)
    }

    return matchesSearch
  })
}

function getCurrentGroup() {
  if (!state.selectedGroupId) return null
  return state.documents[state.activeTab].find(g => g.id === state.selectedGroupId)
}

function getStatusText(status) {
  const statusMap = { open: '제출', ing: '제출', done: '승인' }
  return statusMap[status] || status
}

function getPriorityLine(priority) {
  const priorityMap = {
    높음: '<span class="priority-line high">높음</span>',
    중간: '<span class="priority-line medium">중간</span>',
    낮음: '<span class="priority-line low">낮음</span>',
  }
  return priorityMap[priority] || priority
}

function getPriorityBadge(priority) {
  const badgeMap = {
    높음: '<span class="priority-badge high"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>높음</span>',
    중간: '<span class="priority-badge medium"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>중간</span>',
    낮음: '<span class="priority-badge low"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>낮음</span>',
  }
  return badgeMap[priority] || priority
}

function getStatusLine(status) {
  const statusMap = {
    open: '<span class="status-line open">미조치</span>',
    ing: '<span class="status-line ing">진행중</span>',
    done: '<span class="status-line done">완료</span>',
  }
  return statusMap[status] || status
}

// ================================================================
// 내문서함 (필수서류 제출) 기능 함수
// ================================================================

// ================================================================
// 내문서함 (필수서류 제출) 기능 함수 - Array 구조 기반 수정
// ================================================================

function getRequiredDocStatus(doc) {
  if (!doc) return { status: 'not_submitted', label: '미제출', color: '#94a3b8', bg: '#f1f5f9' }

  switch (doc.status) {
    case 'approved':
      return { status: 'approved', label: '승인완료', color: '#166534', bg: '#dcfce7' }
    case 'pending':
      return { status: 'pending', label: '심사중', color: '#d97706', bg: '#fef3c7' }
    case 'rejected':
      return { status: 'rejected', label: '반려됨', color: '#b91c1c', bg: '#fee2e2' }
    default:
      return { status: 'not_submitted', label: '미제출', color: '#94a3b8', bg: '#f1f5f9' }
  }
}

function renderMyDocsTab() {
  let html = `<div style="padding-bottom:24px;">`

  // 1. 안내 문구

  html += `<div style="display:flex; flex-direction:column; gap:12px;">`

  const docs = state.documents['my-docs'] // 이제 Array

  // docs가 없거나 배열이 아닌 경우 방어 코드
  if (!Array.isArray(docs)) {
    console.error('my-docs data is not an array:', docs)
    return html + '<div style="color:red">데이터 오류 발생</div></div>'
  }

  docs.forEach(doc => {
    const statusInfo = getRequiredDocStatus(doc)
    const isSelected = state.selectedIds.has(doc.id)
    const hasFile = doc.files && doc.files.length > 0
    const thumbUrl = hasFile ? doc.files[0].url : ''
    const isRejected = doc.status === 'rejected'

    // Origin Style Card Structure
    html += `
        <div class="doc-card ${isSelected ? 'selected' : ''}" onclick="/* 상세보기 없음, 클릭 시 선택토글 */ toggleSelection('${doc.id}')">
          <div class="card-content mydocs-card" style="align-items: center;">
            <!-- Checkbox -->
            <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${doc.id}')">
              <div class="checkbox ${isSelected ? 'checked' : ''}">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
            </div>

            <!-- Thumbnail -->
             <div class="card-thumbnail" style="width: 80px; height: 80px; flex-shrink: 0;">
              ${
                hasFile && thumbUrl
                  ? `<img src="${thumbUrl}" alt="thumb" style="width:100%; height:100%; object-fit:cover;">`
                  : `<div style="width:100%; height:100%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#cbd5e1;"><i data-lucide="file-text" class="icon-32"></i></div>`
              }
            </div>

            <!-- Info & Actions -->
            <div class="card-info" style="flex:1; margin-left: 12px;">
              <div class="card-title-row" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                 <div style="flex: 1; min-width: 0; margin-right: 8px;">
                    <div class="card-title" style="font-size:20px; font-weight:800; color:#1e293b; margin-bottom:4px;">${doc.title}</div>
                    <div style="font-size:15px; font-weight:500; color:#64748b; line-height: 1.3;">${doc.description}</div>
                 </div>
                 <span style="font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px; background:${statusInfo.bg}; color:${statusInfo.color}; white-space:nowrap; flex-shrink: 0;">
                    ${statusInfo.label}
                 </span>
              </div>

               <!-- Rejection Reason -->
               ${
                 isRejected
                   ? `
                <div style="background:#fff1f2; border-radius:6px; padding:8px 10px; margin:8px 0; border:1px solid #fecdd3;">
                  <div style="font-size:15px; font-weight:700; color:#be123c; margin-bottom:2px; display:flex; align-items:center; gap:4px;">
                    <i data-lucide="alert-circle" style="width:16px;"></i> 반려 사유
                  </div>
                  <div style="font-size:15px; color:#9f1239;">${doc.reason}</div>
                </div>
              `
                   : ''
               }

              <div class="card-meta-second-line" style="display:flex; gap:8px; margin-top:12px;">
                 ${
                   hasFile
                     ? `
                  <button class="action-btn icon-action ${hasFile ? 'has-file' : 'no-file'}" onclick="event.stopPropagation(); previewImage('${thumbUrl}', '${doc.title}')">
                    <i data-lucide="eye" class="icon-lg"></i>
                    <span>미리보기</span>
                  </button>
                 `
                     : ''
                 }
                 
                 <button class="action-btn primary icon-action" onclick="event.stopPropagation(); triggerRequiredDocUpload('${doc.id}')"
                    style="height:36px; padding:0 12px; border:1px solid #e0f2fe; border-radius:8px; background:#f0f9ff; color:#0284c7; font-size:13px; font-weight:600; display:flex; align-items:center; gap:4px;">
                    <i data-lucide="${hasFile ? 'refresh-cw' : 'upload'}" style="width:16px;"></i> ${hasFile ? '변경' : '업로드'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      `
  })

  html += `</div></div>`
  return html
}

// 필수서류 업로드 트리거
let currentUploadDocCode = null
function triggerRequiredDocUpload(code) {
  currentUploadDocCode = code
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,application/pdf' // 이미지 및 PDF 허용
  input.onchange = handleRequiredDocUpload
  input.click()
}

function renderCompanyDocsTab() {
  const allDocs = state.documents['company-docs'] || []

  // 검색어 필터만 유지 (카테고리 필터 제거)
  const searchQuery = state.searchQuery.toLowerCase()
  const filtered = searchQuery
    ? allDocs.filter(d => d.title.toLowerCase().includes(searchQuery))
    : allDocs

  if (filtered.length === 0) {
    return `
       <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center;">
          <div style="width:64px; height:64px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
            <i data-lucide="search-x" style="width:32px; height:32px; color:#94a3b8; opacity:0.8;"></i>
          </div>
          <div style="font-size:16px; font-weight:700; color:#475569; margin-bottom:4px;">문서가 없습니다</div>
       </div>
     `
  }

  let html = `<div style="display:flex; flex-direction:column; gap:12px;">`

  filtered.forEach(doc => {
    const isSelected = state.selectedIds.has(doc.id)
    let iconName = 'file-text'
    let iconColor = '#94a3b8'
    if (doc.fileType === 'pdf') {
      iconName = 'file-text'
      iconColor = '#ef4444'
    } else if (doc.fileType === 'xlsx' || doc.fileType === 'xls') {
      iconName = 'file-spreadsheet'
      iconColor = '#10b981'
    } else if (doc.fileType === 'hwp') {
      iconName = 'file-type-2'
      iconColor = '#3b82f6'
    }

    html += `
      <div class="doc-card ${isSelected ? 'selected' : ''}" onclick="toggleSelection('${doc.id}')" style="padding: 0;">
         <div class="card-content mydocs-card" style="align-items: center; padding: 16px;">
           <!-- Checkbox -->
           <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${doc.id}')">
             <div class="checkbox ${isSelected ? 'checked' : ''}">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
             </div>
           </div>

           <!-- Large Thumbnail/Icon -->
           <div class="card-thumbnail" style="width: 80px; height: 80px; flex-shrink: 0; display:flex; align-items:center; justify-content:center; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
              <i data-lucide="${iconName}" style="color:${iconColor}; width:40px; height:40px;"></i>
           </div>

           <!-- Info -->
           <div class="card-info" style="flex:1; margin-left: 16px; min-width:0;">
              <div class="card-title" style="font-size:20px; font-weight:800; color:#1e293b; margin-bottom:2px; line-height:1.0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${doc.title}</div>
              
              <div style="font-size:15px; font-weight:500; color:#64748b; display:flex; align-items:center;">
                 <span>${doc.author}</span>
                 <span style="margin:0 8px; color:#cbd5e1;">|</span>
                 <span>${doc.date}</span>
              </div>
           </div>
         </div>
      </div>
    `
  })

  html += `</div>`
  return html
}

function handleRequiredDocUpload(e) {
  if (!currentUploadDocCode) return
  const file = e.target.files[0]
  if (!file) return

  // Array 구조에서 해당 doc 찾기
  const docs = state.documents['my-docs']
  const doc = docs.find(d => d.id === currentUploadDocCode)

  if (doc) {
    const manualUrl = URL.createObjectURL(file)
    doc.status = 'pending'
    doc.files = [
      {
        id: 'new_f_' + Date.now(),
        type: 'img', // 편의상 이미지로 가정
        url: manualUrl,
        name: file.name,
      },
    ]
    doc.date = new Date().toISOString().split('T')[0]
  }

  currentUploadDocCode = null
  renderDocumentList() // 목록 새로고침
  // Batch bar update if needed
  if (typeof updateBatchBar === 'function') updateBatchBar()

  // 토스트 메시지 대신 간단 알림
  // (실제 앱에서는 토스트 사용 권장)
  if (typeof alert !== 'undefined') {
    // alert('제출이 완료되었습니다.');
  }
}

// ================================================================
// 렌더링 함수
// ================================================================

function renderDocumentList() {
  try {
    // [1] 내문서함 (필수서류 제출 View) - 별도 렌더링
    if (state.activeTab === 'my-docs') {
      const listEl = document.getElementById('documentList')
      const emptyEl = document.getElementById('emptyState')
      const loadMoreBtn = document.getElementById('loadMoreButton')
      const collapseBtn = document.getElementById('collapseButton')

      if (emptyEl) emptyEl.classList.add('hidden')
      if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
      if (collapseBtn) collapseBtn.classList.add('hidden')

      if (listEl) {
        listEl.innerHTML = renderMyDocsTab()
      }

      if (typeof lucide !== 'undefined') lucide.createIcons()
      return
    }

    if (state.activeTab === 'company-docs') {
      const listEl = document.getElementById('documentList')
      const emptyEl = document.getElementById('emptyState')
      if (emptyEl) emptyEl.classList.add('hidden')
      const loadMoreBtn = document.getElementById('loadMoreButton')
      const collapseBtn = document.getElementById('collapseButton')
      if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
      if (collapseBtn) collapseBtn.classList.add('hidden')

      if (listEl) {
        listEl.innerHTML = renderCompanyDocsTab()
      }
      if (typeof lucide !== 'undefined') lucide.createIcons()
      return
    }

    // [2] 나머지 탭 (공통 리스트 렌더링)
    const filteredDocs = getFilteredDocs()
    const displayDocs = filteredDocs.slice(0, state.visibleCount)
    const listEl = document.getElementById('documentList')
    const emptyEl = document.getElementById('emptyState')
    const loadMoreBtn = document.getElementById('loadMoreButton')
    const collapseBtn = document.getElementById('collapseButton')

    if (!listEl) {
      console.error('documentList element not found')
      return
    }

    if (displayDocs.length === 0) {
      listEl.innerHTML = ''
      if (emptyEl) emptyEl.classList.remove('hidden')
      if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
      if (collapseBtn) collapseBtn.classList.add('hidden')
      return
    }

    if (emptyEl) emptyEl.classList.add('hidden')

    // 안전한 HTML 생성을 위해 DocumentFragment 사용
    const fragment = document.createDocumentFragment()
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = displayDocs
      .map(doc => {
        const isPunch = state.activeTab === 'punch'
        const isMyDocs = state.activeTab === 'my-docs'
        const isSelected = state.selectedIds.has(doc.id)
        const docFiles = doc.files || []
        const hasFile = docFiles.length > 0
        const repImg = docFiles.find(f => f.type === 'img')
        const thumbUrl = repImg
          ? (repImg.currentView === 'after' ? repImg.url_after : repImg.url_before) || repImg.url
          : IMG_CONCRETE

        if (state.activeTab === 'drawings') {
          const isExpanded = state.expandedWorklogs.has(doc.id)
          const activeSubTab = state.drawingTabState[doc.id] || 'list'
          const drawingCount = doc.drawings ? doc.drawings.length : 0

          return `
        <div class="doc-card ${isSelected ? 'selected' : ''}" style="display:block; cursor:default;">
          <div class="card-title-row" onclick="toggleWorklogExpand('${doc.id}')" style="cursor: pointer; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:20px; font-weight:800; color:var(--text-main); flex:1;">${doc.desc}</span>
            <span class="status-badge ${doc.status === 'done' ? 'status-ok' : 'status-none'}" style="margin:0; flex-shrink:0;">
              ${getStatusText(doc.status)}
            </span>
          </div>
          
          <div class="card-meta-first-line" onclick="toggleWorklogExpand('${doc.id}')" style="cursor: pointer;">
            <span class="text-author">${doc.author}</span>
            <span class="text-separator">|</span>
            <span>${doc.siteName}</span>
            <span class="text-separator">|</span>
            <span>${formatDateShort(doc.date)}</span>
            <span style="margin-left:auto; font-size:12px; font-weight:700; color:var(--primary); background:#eff6ff; padding:2px 8px; border-radius:4px; white-space:nowrap; flex-shrink:0;">도면 ${drawingCount}건</span>
          </div>

          ${
            isExpanded
              ? `
            <div style="margin-top:16px; border-top:1px solid var(--border); padding-top:12px;">
              <!-- 서브 탭 -->
              <div class="sub-tab-group">
                <button class="sub-tab-btn ${activeSubTab === 'list' ? 'active' : ''}" onclick="setDrawingTab('${doc.id}', 'list')">목록</button>
                <button class="sub-tab-btn ${activeSubTab === 'upload' ? 'active' : ''}" onclick="setDrawingTab('${doc.id}', 'upload')">업로드</button>
                <button class="sub-tab-btn ${activeSubTab === 'tool' ? 'active' : ''}" onclick="setDrawingTab('${doc.id}', 'tool')">마킹도구</button>
              </div>

              <!-- 탭 컨텐츠 -->
              <div class="tab-content">
                ${renderDrawingTabContent(doc, activeSubTab)}
              </div>
            </div>
          `
              : ''
          }
        </div>
      `
        }

        if (state.activeTab === 'photos') {
          const isExpanded = state.expandedPhotoGroups.has(doc.id)
          const activeSubTab = state.photoTabState[doc.id] || 'list'
          const photoCount = doc.photos ? doc.photos.length : 0
          // 미리보기용 썸네일 (최대 3개)
          const previewPhotos = doc.photos ? doc.photos.slice(0, 3) : []

          return `
        <div class="doc-card ${isSelected ? 'selected' : ''}" style="display:block; cursor:default; padding-bottom:${isExpanded ? '16px' : '12px'};">
          <!-- 헤더 영역 (클릭 시 확장/축소) -->
          <div onclick="togglePhotoGroupExpand('${doc.id}')" style="cursor: pointer;">
            <div class="card-title-row">
               <span style="font-size:20px; font-weight:800; color:var(--text-main); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${doc.desc || doc.title}
               </span>
            </div>
            
            <div class="card-meta-first-line">
              <span class="text-author">${doc.author}</span>
              <span class="text-separator">|</span>
              <span>${doc.title}</span>
              <span class="text-separator">|</span>
              <span>${formatDateShort(doc.date)}</span>
              <span style="margin-left:auto; font-size:12px; font-weight:700; color:var(--primary); background:#eff6ff; padding:2px 8px; border-radius:4px; white-space:nowrap; flex-shrink:0;">사진 ${photoCount}장</span>
            </div>

            <!-- 접혀있을 때 미리보기 (최근 4장) -->
            ${
              !isExpanded && previewPhotos.length > 0
                ? `
              <div style="display:flex; gap:6px; margin-top:12px; overflow:hidden;">
                ${previewPhotos
                  .map(
                    p => `
                  <div style="width:40px; height:40px; border-radius:6px; background:#f1f5f9; overflow:hidden;">
                    <img src="${p.url}" style="width:100%; height:100%; object-fit:cover;">
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }
          </div>

          <!-- 확장 영역 (전/후 분리 뷰) -->
          ${
            isExpanded
              ? `
            <div style="margin-top:16px; border-top:1px solid var(--border); padding-top:16px;">
              ${renderPhotoGroupContent(doc)}
            </div>
          `
              : ''
          }
        </div>
      `
        }

        if (isPunch) {
          // 구간별 정보 통계
          const punchItems = doc.punchItems || []
          const openCount = punchItems.filter(item => item.status === 'open').length
          const doneCount = punchItems.filter(item => item.status === 'done').length
          const totalCount = punchItems.length
          const hasOpen = openCount > 0

          // 첫 번째 구간 정보 (미리보기용)
          const firstItem = punchItems[0] || {}

          return `
        <div class="doc-card ${isSelected ? 'selected' : ''}" onclick="handleCardClick('${doc.id}')">
          <span class="punch-status-badge ${hasOpen ? 'open' : 'done'}">
            ${hasOpen ? '미조치' : '완료'}
          </span>
          <div class="card-content">
            <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${doc.id}')">
              <div class="checkbox ${isSelected ? 'checked' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
            </div>
            <div class="card-thumbnail">
              <img src="${thumbUrl}" alt="${doc.title}" />
            </div>
            <div class="card-info">
              <div class="badge-group">
                ${doc.contractor ? `<span class="sub-badge contractor">${doc.contractor}</span>` : ''}
              </div>
              <div class="card-title">${doc.title}</div>
              <div class="card-meta">
                ${doc.author} <span class="text-separator">|</span> ${formatDateShort(doc.date)} <span class="text-placeholder">${doc.time}</span>
              </div>
              <div class="punch-issue-row">
                <div class="punch-issue">
                  총 ${totalCount}건 (미조치 ${openCount}, 완료 ${doneCount})
                </div>
              </div>
            </div>
          </div>
        </div>
      `
        }

        if (isMyDocs) {
          const badgeClass = hasFile ? 'status-ok' : 'status-none'
          const badgeText = hasFile ? '등록완료' : '미등록'
          const myThumbUrl = repImg
            ? (repImg.currentView === 'after' && (repImg.url_after || repImg.url)
                ? repImg.url_after || repImg.url
                : repImg.url_before || repImg.url) || repImg.url
            : ''

          return `
        <div class="doc-card ${isSelected ? 'selected' : ''}" onclick="handleCardClick('${doc.id}')">
          <div class="card-content mydocs-card">
            <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${doc.id}')">
              <div class="checkbox ${isSelected ? 'checked' : ''}">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
              </div>
            </div>
            <div class="card-thumbnail">
              ${hasFile && myThumbUrl ? `<img src="${myThumbUrl}" alt="thumb">` : '<i data-lucide="file-text" class="icon-32 icon-placeholder"></i>'}
            </div>
            <div class="card-info">
              <div class="card-title-row">
                <div class="card-title">${doc.title}</div>
              </div>
              <div class="card-meta-first-line">
                <span class="text-author">${doc.author || ''}</span>
                <span class="text-separator">|</span>
                <span class="text-author">${formatDateShort(doc.date)}</span>
                <span class="text-separator">|</span>
                <span class="text-placeholder">${doc.time || ''}</span>
              </div>
              <div class="card-meta-second-line">
                <button class="action-btn icon-action ${hasFile ? 'has-file' : 'no-file'}" ${hasFile ? '' : 'disabled'} onclick="event.stopPropagation(); previewMyDoc('${doc.id}')">
                  <i data-lucide="eye" class="icon-lg"></i>
                  <span>미리보기</span>
                </button>
                <button class="action-btn primary icon-action" onclick="event.stopPropagation(); openMyDocsQuickUpload('${doc.id}')">
                  <i data-lucide="${hasFile ? 'refresh-cw' : 'upload'}" class="icon-lg"></i>
                  <span>${hasFile ? '변경' : '업로드'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `
        }

        return `
      <div class="doc-card ${isSelected ? 'selected' : ''}" onclick="handleCardClick('${doc.id}')">
        <div class="card-content">
          <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${doc.id}')">
            <div class="checkbox ${isSelected ? 'checked' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
            </div>
          </div>
          <div class="card-thumbnail">
            ${thumbUrl ? `<img src="${thumbUrl}" alt="${doc.title}" />` : '<i data-lucide="folder" class="icon-32 icon-placeholder"></i>'}
          </div>
          <div class="card-info">
            ${
              doc.contractor || doc.affiliation
                ? `
              <div class="badge-group">
                ${doc.contractor ? `<span class="sub-badge contractor">${doc.contractor}</span>` : ''}
              </div>
            `
                : ''
            }
            <div class="card-title">${doc.title}</div>
            <div class="card-meta">
              ${doc.author} <span class="text-separator">|</span> ${formatDateShort(doc.date)} <span class="text-placeholder">${doc.time}</span>
            </div>
          </div>
          <i data-lucide="chevron-right" class="icon-xl icon-chevron"></i>
        </div>
      </div>
    `
      })
      .join('')

    // fragment에 자식 요소들 추가
    while (tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }

    // 기존 내용을 안전하게 지우고 새 내용 추가
    listEl.innerHTML = ''
    listEl.appendChild(fragment)

    // 더보기/접기 버튼
    if (filteredDocs.length > state.visibleCount) {
      if (loadMoreBtn) loadMoreBtn.classList.remove('hidden')
      if (collapseBtn) collapseBtn.classList.add('hidden')
    } else if (state.visibleCount > 5 && filteredDocs.length <= state.visibleCount) {
      if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
      if (collapseBtn) collapseBtn.classList.remove('hidden')
    } else {
      if (loadMoreBtn) loadMoreBtn.classList.add('hidden')
      if (collapseBtn) collapseBtn.classList.add('hidden')
    }

    // 아이콘 생성
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        lucide.createIcons()
      }, 50)
    }
  } catch (error) {
    console.error('Error in renderDocumentList:', error)
  }
}

function updatePunchSummary() {
  const stats = getPunchStats()
  document.getElementById('punchTotalCount').textContent = stats.total
  document.getElementById('punchOpenCount').textContent = stats.open
  document.getElementById('punchDoneCount').textContent = stats.done
}

function updateBatchBar() {
  const batchBar = document.getElementById('batchBar')
  const fabButton = document.getElementById('fabButton')
  const editBtn = document.getElementById('batchEdit')
  const shareBtn = document.getElementById('batchShare')
  const downloadBtn = document.getElementById('batchDownload')
  const deleteBtn = document.getElementById('batchDelete')

  const hasSelection = state.selectedIds.size > 0
  const hasFab = state.activeTab !== 'company-docs' && !state.selectedGroupId
  const isCompanyDocs = state.activeTab === 'company-docs'
  const isDrawingTab = state.activeTab === 'drawings'
  const isDetailView = !!state.selectedGroupId

  // 초기화
  if (editBtn) editBtn.style.display = 'none'
  if (shareBtn) shareBtn.style.display = 'flex'
  if (downloadBtn) downloadBtn.style.display = 'flex'
  if (deleteBtn) deleteBtn.style.display = 'flex'

  // 탭별 버튼 제어
  if (isCompanyDocs) {
    deleteBtn.style.display = 'none'
    if (editBtn) editBtn.style.display = 'none'
  } else if (isDrawingTab) {
    // 도면 탭: 수정, 다운로드, 삭제
    if (editBtn) editBtn.style.display = 'flex'
    if (shareBtn) shareBtn.style.display = 'none'
  } else {
    // 기타 탭
    deleteBtn.style.display = 'flex'
  }

  if (hasSelection) {
    batchBar.classList.add('show')
    if (hasFab && !isDetailView) {
      batchBar.classList.add('with-fab')
      batchBar.classList.remove('no-fab')
    } else {
      batchBar.classList.add('no-fab')
      batchBar.classList.remove('with-fab')
    }
  } else {
    batchBar.classList.remove('show')
  }
}

function renderDetailView() {
  const currentGroup = getCurrentGroup()
  if (!currentGroup) return

  const contentEl = document.getElementById('detailContentInner')
  const isApproved = currentGroup.status === 'done' // 승인완료 상태 확인
  const titleEl = document.getElementById('detailTitle')
  const reportBtn = document.getElementById('reportButton')
  const isCompanyDocs = state.activeTab === 'company-docs'

  titleEl.textContent = currentGroup.title

  if (state.activeTab === 'punch') {
    reportBtn.classList.remove('hidden')
    const punchItems = currentGroup.punchItems || []

    // @doc.html 방식: 보고서 버튼 클릭 이벤트 설정
    reportBtn.onclick = function () {
      openReportEditor()
    }

    // 통계 계산
    const totalCount = punchItems.length
    const openCount = punchItems.filter(item => item.status !== 'done').length
    const doneCount = punchItems.filter(item => item.status === 'done').length

    // 통계 카드 HTML (하늘색/레드/회색, 테두리 1px)
    const statsHTML = `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
      <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 16px; border-radius: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #0284c7; margin-bottom: 4px;">${totalCount}</div>
        <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">전체</div>
      </div>
      <div style="background: #fef2f2; border: 1px solid #ef4444; padding: 16px; border-radius: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #dc2626; margin-bottom: 4px;">${openCount}</div>
        <div style="font-size: 11px; font-weight: 700; color: #b91c1c; text-transform: uppercase; letter-spacing: 0.5px;">미조치</div>
      </div>
      <div style="background: #f8fafc; border: 1px solid #94a3b8; padding: 16px; border-radius: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #475569; margin-bottom: 4px;">${doneCount}</div>
        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">완료</div>
      </div>
    </div>
  `

    // 구간별 정보 카드 형태로 표시 (React 스타일)
    let punchItemsHTML = statsHTML

    // 조치 내역 헤더
    punchItemsHTML += `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 0 4px;">
      <i data-lucide="file-text" style="width: 20px; height: 20px; color: var(--primary);"></i>
      <h3 style="font-size: 18px; font-weight: 900; color: var(--text-main); margin: 0;">조치 내역 (${punchItems.length})</h3>
    </div>
  `

    if (punchItems.length === 0) {
      punchItemsHTML +=
        '<div style="padding: 40px; text-align: center; color: var(--text-sub); background: var(--bg-surface); border-radius: 16px; border: 2px dashed var(--border);">등록된 조치 정보가 없습니다.<br><small style="font-size: 13px; margin-top: 8px; display: block;">아래 버튼을 눌러 새로운 하자 내용을 추가하세요.</small></div>'
    } else {
      punchItemsHTML += punchItems
        .map(
          (item, index) => `
      <div class="punch-item-card" data-item-id="${item.id}" style="background: white; border: none; border-radius: 24px; padding: 20px; margin-bottom: 16px; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.08); transition: all 0.2s;">
        <!-- 삭제 버튼 (승인완료 상태에서 숨김) -->
        ${
          !isApproved
            ? `
        <button onclick="deletePunchItem('${item.id}')" style="position: absolute; top: 16px; right: 16px; background: none; border: none; color: #cbd5e1; cursor: pointer; padding: 4px; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#cbd5e1'">
          <i data-lucide="trash-2" style="width: 20px; height: 20px;"></i>
        </button>
        `
            : ''
        }
        
        <!-- 위치 입력 -->
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
          <i data-lucide="map-pin" style="width: 18px; height: 18px; color: var(--primary); flex-shrink: 0;"></i>
          <input 
            type="text" 
            value="${item.location || ''}" 
            placeholder="위치 (예: 101동 302호)"
            oninput="updatePunchItemField('${item.id}', 'location', this.value)"
            style="font-size: 16px; font-weight: 800; color: var(--text-main); background: transparent; padding: 0; border: none; outline: none; flex: 1; min-width: 0; ${isApproved ? 'pointer-events: none; opacity: 0.7;' : ''}"
            ${isApproved ? 'readonly' : ''}
          />
        </div>
        
        <!-- 지적 내용 입력 -->
        <textarea 
          placeholder="지적 내용을 상세히 입력하세요..."
          oninput="updatePunchItemField('${item.id}', 'issue', this.value)"
          style="width: 100%; font-size: 17px; font-weight: 700; color: var(--text-main); background: transparent; border: none; outline: none; resize: none; line-height: 1.4; min-height: 48px; padding: 0; margin-bottom: 12px; ${isApproved ? 'pointer-events: none; opacity: 0.7;' : ''}"
          ${isApproved ? 'readonly' : ''}
        >${item.issue || ''}</textarea>
        
        <!-- 우선순위 & 상태 -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; gap: 4px; flex-wrap: wrap; width: calc(50% - 4px); min-width: 120px;">
            ${[
              {
                key: '높음',
                activeBg: '#fee2e2',
                activeColor: '#dc2626',
                inactiveBg: '#f8fafc',
                inactiveColor: '#94a3b8',
              },
              {
                key: '중간',
                activeBg: '#fef3c7',
                activeColor: '#d97706',
                inactiveBg: '#f8fafc',
                inactiveColor: '#94a3b8',
              },
              {
                key: '낮음',
                activeBg: '#d1fae5',
                activeColor: '#059669',
                inactiveBg: '#f8fafc',
                inactiveColor: '#94a3b8',
              },
            ]
              .map(
                p => `
              <button 
                onclick="updatePunchItemField('${item.id}', 'priority', '${p.key}')"
                class="punch-priority-btn"
                style="padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; border: none; cursor: ${isApproved ? 'not-allowed' : 'pointer'}; transition: all 0.2s; min-height: 32px; flex: 1; ${item.priority === p.key ? `background: ${p.activeBg}; color: ${p.activeColor};` : `background: ${p.inactiveBg}; color: ${p.inactiveColor};`} ${isApproved ? 'pointer-events: none; opacity: 0.6;' : ''}"
              >${p.key}</button>
            `
              )
              .join('')}
          </div>
          <div style="display: flex; background: #f1f5f9; border-radius: 9999px; padding: 2px; flex-shrink: 0; width: calc(50% - 4px); min-width: 120px; justify-content: center;">
            ${[
              { key: 'open', label: '미조치', color: '#ef4444' },
              { key: 'ing', label: '진행중', color: '#3b82f6' },
              { key: 'done', label: '완료', color: '#1e293b' },
            ]
              .map(
                s => `
              <button 
                onclick="updatePunchItemField('${item.id}', 'status', '${s.key}')"
                class="punch-status-btn"
                style="padding: 5px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: none; cursor: ${isApproved ? 'not-allowed' : 'pointer'}; transition: all 0.2s; min-height: 28px; flex: 1; ${item.status === s.key ? `background: white; color: ${s.color}; box-shadow: 0 1px 2px rgba(0,0,0,0.05);` : 'background: transparent; color: #94a3b8;'} ${isApproved ? 'pointer-events: none; opacity: 0.6;' : ''}"
              >${s.label}</button>
            `
              )
              .join('')}
          </div>
        </div>
        
        <!-- 이미지 업로드 영역 -->
        <div style="display: flex; gap: 12px; margin-top: 12px; width: 100%;">
          ${['beforePhoto', 'afterPhoto']
            .map(
              type => `
            <div 
              onclick="triggerPunchPhotoUpload('${item.id}', '${type}')"
              style="flex: 1; aspect-ratio: 1 / 1; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: ${isApproved ? 'not-allowed' : 'pointer'}; transition: all 0.2s; overflow: hidden; position: relative; ${isApproved ? 'pointer-events: none; opacity: 0.6;' : ''}"
              ${!isApproved ? `onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#94a3b8'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#cbd5e1'"` : ''}
            >
              ${
                item[type]
                  ? `
                <img src="${item[type]}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;" />
                <div style="position: absolute; top: 8px; left: 8px; background: ${type === 'beforePhoto' ? '#1e293b' : '#0ea5e9'}; color: white; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 6px;">${type === 'beforePhoto' ? '보수전' : '보수후'}</div>
                <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; justify-center; color: white; font-size: 11px; font-weight: 900;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">이미지 변경</div>
              `
                  : `
                <i data-lucide="camera" style="width: 28px; height: 28px; color: #cbd5e1; margin-bottom: 4px;"></i>
                <span style="font-size: 11px; font-weight: 900; color: #94a3b8;">${type === 'beforePhoto' ? '보수전' : '보수후'}</span>
              `
              }
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
        )
        .join('')
    }

    contentEl.innerHTML = `
    <div style="margin-bottom: 16px;">
      ${punchItemsHTML}
      
      <!-- 새로운 하자 내용 추가 버튼 (박스라운드) -->
      ${
        !isApproved
          ? `
      <button 
        onclick="addNewPunchItem()"
        style="width: 100%; height: 50px; padding: 0 20px; border: 1px dashed #38bdf8; border-radius: 12px; background: #f0f9ff; color: #0ea5e9; font-size: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; margin-top: 16px;"
        onmouseover="this.style.background='#e0f2fe'; this.style.borderColor='#0ea5e9'; this.style.color='#0ea5e9'"
        onmouseout="this.style.background='#f0f9ff'; this.style.borderColor='#38bdf8'; this.style.color='#0ea5e9'"
      >
        <i data-lucide="plus" style="width: 24px; height: 24px;"></i>
        <span>새로운 하자 내용 추가</span>
      </button>
      `
          : `
      <div style="width: 100%; height: 50px; padding: 0 20px; border: 1px dashed #e2e8f0; border-radius: 12px; background: #f8fafc; color: #94a3b8; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 16px; opacity: 0.6;">
        <i data-lucide="lock" style="width: 24px; height: 24px;"></i>
        <span>승인완료 - 조회만 가능</span>
      </div>
      `
      }
    </div>
  `
  } else {
    reportBtn.classList.add('hidden')
    contentEl.innerHTML = `
    <div class="section-margin">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 class="section-title" style="margin-bottom: 0;">첨부 파일</h3>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="select-all-container" onclick="toggleSelectAllFiles()" style="cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 14px; color: var(--text-sub); font-weight: 600;">
            <div class="file-checkbox ${currentGroup.files.length > 0 && currentGroup.files.every(f => state.selectedIds.has(f.id)) ? 'checked' : ''}" id="selectAllFilesBox" style="position: static;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
            </div>
            <span>전체선택</span>
          </div>
        </div>
      </div>
      <div class="file-grid">
        ${
          !isCompanyDocs
            ? `
          <div class="file-card add-file" onclick="triggerAppendUpload()">
            <div class="add-file-content">
              <i data-lucide="plus" class="icon-32"></i>
              <span>추가</span>
            </div>
          </div>
        `
            : ''
        }
        ${currentGroup.files
          .map(f => {
            const isSelected = state.selectedIds.has(f.id)
            const displayUrl =
              f.currentView === 'after' && f.url_after ? f.url_after : f.url_before || f.url
            return `
          <div class="file-card ${isSelected ? 'selected' : ''}">
            <div class="file-checkbox ${isSelected ? 'checked' : ''}" onclick="event.stopPropagation(); toggleFileSelection('${f.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
            </div>
            ${!isCompanyDocs ? `<button class="file-reupload-btn" onclick="event.stopPropagation(); triggerReupload('${f.id}')"><i data-lucide="refresh-cw" style="width:14px;"></i></button>` : ''}
            <div class="file-preview" onclick="previewImage('${displayUrl}', '${f.name}')">
              ${f.type === 'img' ? `<img src="${displayUrl}" alt="${f.name}" />` : `<i data-lucide="file" class="icon-48 icon-placeholder"></i>`}
              ${state.activeTab === 'photos' && f.type === 'img' && f.currentView ? `<span class="file-badge ${f.currentView}" onclick="event.stopPropagation(); togglePhotoView('${f.id}')">${f.currentView === 'before' ? '보수전' : '보수후'}</span>` : ''}
              ${state.activeTab === 'drawings' && f.drawingState ? `<span class="file-badge ${f.drawingState}" onclick="event.stopPropagation(); toggleDrawingState('${f.id}')">${f.drawingState === 'ing' ? '진행도면' : '완료도면'}</span>` : ''}
            </div>
            <div class="file-info">
              <div class="file-name">${f.name}</div>
              <div class="file-size">${f.size}</div>
            </div>
          </div>
        `
          })
          .join('')}
      </div>
    </div>
  `
  }

  lucide.createIcons()
}

// ================================================================
// 이벤트 핸들러
// ================================================================

function handleTabChange(tab) {
  state.activeTab = tab
  state.selectedIds.clear()
  state.searchQuery = ''
  state.siteFilter = ''
  state.visibleCount = 5

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab)
  })

  const siteSearchWrapper = document.getElementById('siteSearchWrapper')
  const punchSummary = document.getElementById('punchSummary')
  const fabButton = document.getElementById('fabButton')
  const mainSearchInput = document.getElementById('mainSearchInput')

  if (tab === 'punch') {
    siteSearchWrapper.classList.remove('hidden')
    punchSummary.classList.remove('hidden')
    mainSearchInput.placeholder = '위치 또는 내용 검색...'
    updatePunchSummary()
  } else if (tab === 'drawings' || tab === 'photos') {
    siteSearchWrapper.classList.add('hidden')
    punchSummary.classList.add('hidden')
    mainSearchInput.placeholder = '현장명 검색'
  } else {
    siteSearchWrapper.classList.add('hidden')
    punchSummary.classList.add('hidden')
    mainSearchInput.placeholder = '문서명 검색...'
  }

  if (tab === 'company-docs') {
    fabButton.classList.add('hidden')
  } else {
    fabButton.classList.remove('hidden')
  }

  renderDocumentList()
  updateBatchBar()
}

function handleSearch(value) {
  state.searchQuery = value
  const icon = document.getElementById('mainSearchIcon')
  const clearBtn = document.getElementById('mainClearButton')

  if (value) {
    icon.classList.add('hidden')
    clearBtn.classList.add('show')
  } else {
    icon.classList.remove('hidden')
    clearBtn.classList.remove('show')
  }

  renderDocumentList()
}

function toggleSelection(id) {
  if (state.selectedIds.has(id)) {
    state.selectedIds.delete(id)
  } else {
    state.selectedIds.add(id)
  }
  renderDocumentList()
  updateBatchBar()
}

function handleCardClick(id) {
  state.selectedGroupId = id
  state.isPunchEditMode = false
  state.editingPunchData = null
  renderDetailView()
  document.getElementById('detailOverlay').classList.add('open')
}

function closeDetailView() {
  state.selectedGroupId = null
  state.isPunchEditMode = false
  state.editingPunchData = null
  state.selectedIds.clear()
  document.getElementById('detailOverlay').classList.remove('open')
  updateBatchBar()
}

function startPunchEdit() {
  const currentGroup = getCurrentGroup()
  if (!currentGroup) return
  state.isPunchEditMode = true
  const punchItems = currentGroup.punchItems || []
  const firstItem = punchItems[0] || {}
  state.editingPunchData = JSON.parse(JSON.stringify(firstItem))
  renderDetailView()
}

function cancelPunchEdit() {
  state.isPunchEditMode = false
  state.editingPunchData = null
  renderDetailView()
}

function setPriority(priority) {
  if (!state.editingPunchData) return
  state.editingPunchData.priority = priority
  renderDetailView()
}

function savePunchEdit() {
  const currentGroup = getCurrentGroup()
  if (!currentGroup || !state.editingPunchData) return

  state.editingPunchData.location = document.getElementById('editLocation').value
  state.editingPunchData.issue = document.getElementById('editIssue').value
  state.editingPunchData.status = document.getElementById('editStatus').value
  state.editingPunchData.assignee = document.getElementById('editAssignee').value
  state.editingPunchData.dueDate = document.getElementById('editDueDate').value

  // 첫 번째 punchItem에 수정 내용 저장
  if (currentGroup.punchItems && currentGroup.punchItems.length > 0) {
    currentGroup.punchItems[0] = state.editingPunchData
  }

  state.isPunchEditMode = false
  state.editingPunchData = null

  renderDetailView()
  renderDocumentList()
  updatePunchSummary()
  alert('펀치 정보가 저장되었습니다.')
}

function uploadPhotoBefore() {
  document.getElementById('photoBeforeInput').click()
}

function uploadPhotoAfter() {
  document.getElementById('photoAfterInput').click()
}

function togglePhotoView(fileId) {
  const currentGroup = getCurrentGroup()
  if (!currentGroup) return

  const file = currentGroup.files.find(f => f.id === fileId)
  if (!file) return

  file.currentView = file.currentView === 'before' ? 'after' : 'before'
  renderDetailView()
  renderDocumentList()
}

function toggleDrawingState(fileId) {
  const currentGroup = getCurrentGroup()
  if (!currentGroup) return

  const file = currentGroup.files.find(f => f.id === fileId)
  if (!file) return

  // Cycle through: ing -> done -> ing
  if (file.drawingState === 'ing') {
    file.drawingState = 'done'
  } else {
    file.drawingState = 'ing'
  }

  renderDetailView()
  renderDocumentList()
}

// Preview state management
const previewState = {
  zoom: 1,
  position: { x: 0, y: 0 },
  isPanning: false,
  dragStart: { x: 0, y: 0 },
}

function previewImage(url, title) {
  if (!url) return
  state.previewImageUrl = url
  state.previewImageTitle = title

  // Reset preview state
  previewState.zoom = 1
  previewState.position = { x: 0, y: 0 }
  previewState.isPanning = false

  // Update UI
  document.getElementById('previewImage').src = url
  document.getElementById('previewTitleMain').textContent = title || '이미지 미리보기'
  document.getElementById('previewTitleSub').textContent = '이미지 보기'
  document.getElementById('previewModal').classList.add('show')

  updatePreviewTransform()
}

function previewMyDoc(id) {
  const g = state.documents['my-docs']?.find(x => x.id === id)
  if (!g || !g.files || g.files.length === 0) return
  const f = g.files.find(x => x.type === 'img') || g.files[0]
  if (!f || !f.url) return

  // previewImage 모달은 이미지 기반이므로, 이미지가 아니면 새 창(데이터URL)으로 처리
  if (f.type !== 'img') {
    window.open(f.url, '_blank')
    return
  }
  previewImage(f.url, g.title)
}

// my-docs(내문서함) 카드에서 즉시 업로드/변경 (바텀시트 사용 안함)
function openMyDocsQuickUpload(id) {
  state.editingId = id
  const input = document.getElementById('myDocsQuickFileInput')
  if (!input) return
  input.value = ''
  input.click()
}

function handleMyDocsQuickUpload(e) {
  const input = e.target
  const id = state.editingId
  if (!id) {
    input.value = ''
    return
  }

  const g = state.documents['my-docs']?.find(x => x.id === id)
  if (!g) {
    state.editingId = null
    input.value = ''
    return
  }

  const file = input.files && input.files[0]
  if (!file) {
    state.editingId = null
    return
  }

  const reader = new FileReader()
  reader.onload = function (ev) {
    const isImg = (file.type || '').startsWith('image/')
    const newFile = {
      id: 'f' + Date.now(),
      name: file.name,
      type: isImg ? 'img' : 'file',
      url: ev.target.result,
    }

    g.files = [newFile]
    if (!g.date) g.date = new Date().toISOString().slice(0, 10)
    g.time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

    renderDocumentList()
    updateBatchBar()

    state.editingId = null
    input.value = ''
  }

  reader.readAsDataURL(file)
}

function closePreview() {
  document.getElementById('previewModal').classList.remove('show')
  state.previewImageUrl = null
  state.previewImageTitle = ''
}

function updatePreviewTransform() {
  const image = document.getElementById('previewImage')
  image.style.transform = `translate(${previewState.position.x}px, ${previewState.position.y}px) scale(${previewState.zoom})`
}

function handlePreviewZoomIn() {
  previewState.zoom = Math.min(3, previewState.zoom + 0.2)
  updatePreviewTransform()
}

function handlePreviewZoomOut() {
  previewState.zoom = Math.max(0.3, previewState.zoom - 0.2)
  updatePreviewTransform()
}

function togglePreviewPan() {
  previewState.isPanning = !previewState.isPanning
  const viewport = document.getElementById('previewViewport')
  const toggleBtn = document.getElementById('previewTogglePan')

  viewport.classList.toggle('panning', previewState.isPanning)
  toggleBtn.classList.toggle('active', previewState.isPanning)
}

function sharePreview() {
  const img = document.getElementById('previewImage')
  const shareData = {
    title: '이미지 공유',
    text: state.previewImageTitle || '이미지',
    url: img.src,
  }

  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      navigator.share(shareData)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Error sharing', error)
        fallbackShare()
      }
    }
  } else {
    fallbackShare()
  }
}

function fallbackShare() {
  const img = document.getElementById('previewImage')
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(img.src)
      .then(() => {
        alert('이미지 링크가 클립보드에 복사되었습니다.')
      })
      .catch(() => {
        alert('공유 기능을 사용할 수 없습니다.')
      })
  } else {
    alert('공유 기능을 사용할 수 없습니다.')
  }
}

function downloadPreview() {
  const img = document.getElementById('previewImage')
  const link = document.createElement('a')
  link.href = img.src
  link.download = state.previewImageTitle || 'image.jpg'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function toggleFileSelection(fileId) {
  if (state.selectedIds.has(fileId)) {
    state.selectedIds.delete(fileId)
  } else {
    state.selectedIds.add(fileId)
  }
  renderDetailView()
  updateBatchBar()
}

function toggleSelectAllFiles() {
  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.files || currentGroup.files.length === 0) return

  const allSelected =
    currentGroup.files.length > 0 && currentGroup.files.every(f => state.selectedIds.has(f.id))

  if (allSelected) {
    currentGroup.files.forEach(f => state.selectedIds.delete(f.id))
  } else {
    currentGroup.files.forEach(f => state.selectedIds.add(f.id))
  }

  // Update select all checkbox visual state
  const selectAllBox = document.getElementById('selectAllFilesBox')
  if (selectAllBox) {
    selectAllBox.classList.toggle('checked', !allSelected)
  }

  renderDetailView()
  updateBatchBar()
}

let fileToReplaceId = null

function triggerReupload(fileId) {
  fileToReplaceId = fileId
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*,.pdf,.hwp,.doc,.docx'
  input.onchange = e => handleReplaceFile(e.target)
  input.click()
}

function handleReplaceFile(input) {
  if (!input.files[0] || !fileToReplaceId || !state.selectedGroupId) return

  const file = input.files[0]
  const currentGroup = getCurrentGroup()
  const fileIndex = currentGroup.files.findIndex(f => f.id === fileToReplaceId)

  if (fileIndex > -1) {
    const reader = new FileReader()
    reader.onload = e => {
      const isImg = file.type.startsWith('image/')
      currentGroup.files[fileIndex].name = file.name
      currentGroup.files[fileIndex].type = isImg ? 'img' : 'file'
      currentGroup.files[fileIndex].url = e.target.result
      currentGroup.files[fileIndex].size = (file.size / (1024 * 1024)).toFixed(2) + 'MB'

      if (state.activeTab === 'punch' && isImg) {
        if (currentGroup.files[fileIndex].currentView === 'before') {
          currentGroup.files[fileIndex].url_before = e.target.result
        } else {
          currentGroup.files[fileIndex].url_after = e.target.result
        }
      }

      alert('파일이 교체되었습니다.')
      renderDetailView()
      renderDocumentList()
    }
    reader.readAsDataURL(file)
  }
  fileToReplaceId = null
}

function triggerAppendUpload() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/*,.pdf,.hwp,.doc,.docx'
  input.onchange = e => handleAppendFiles(e.target)
  input.click()
}

function handleAppendFiles(input) {
  if (!input.files.length || !state.selectedGroupId) return

  const currentGroup = getCurrentGroup()
  if (!currentGroup) return

  let filesProcessed = 0
  const totalFiles = input.files.length

  Array.from(input.files).forEach((file, index) => {
    const reader = new FileReader()
    reader.onload = e => {
      const isImg = file.type.startsWith('image/')
      const newFile = {
        id: 'f' + Date.now() + index,
        name: file.name,
        type: isImg ? 'img' : 'file',
        url: e.target.result,
        size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        ext: file.name.split('.').pop().toUpperCase(),
      }

      if (state.activeTab === 'punch' && isImg) {
        newFile.currentView = 'after'
        newFile.url_before = ''
        newFile.url_after = e.target.result
      }

      if (state.activeTab === 'photos' && isImg) {
        newFile.currentView = 'after'
        newFile.url_before = ''
        newFile.url_after = e.target.result
      }

      if (state.activeTab === 'drawings') {
        newFile.drawingState = 'ing'
      }

      currentGroup.files.push(newFile)
      filesProcessed++

      if (filesProcessed === totalFiles) {
        alert(`${totalFiles}개 파일이 추가되었습니다.`)
        renderDetailView()
        renderDocumentList()
      }
    }
    reader.readAsDataURL(file)
  })
}

function openUploadSheet(editId = null) {
  // (evt) 형태로 들어오는 경우 방어
  if (editId && typeof editId === 'object') editId = null
  const titleInput = document.getElementById('uploadTitleInput')
  // my-docs 탭 신규 등록: 현장명 대신 문서명 입력
  if (state.activeTab === 'my-docs' && !editId) {
    titleInput.placeholder = '문서명을 입력하세요'
  } else {
    titleInput.placeholder = '현장명을 입력하세요'
  }
  const dateInput = document.getElementById('uploadDateInput')
  const overlay = document.getElementById('uploadSheetOverlay')
  const sheet = document.getElementById('uploadSheet')
  const sheetTitleEl = document.querySelector('#uploadSheet .sheet-title')
  const titleLabel = document.getElementById('uploadTitleLabel')

  // 기본값
  state.editingId = null
  titleInput.readOnly = false
  titleInput.value = ''
  dateInput.value = new Date().toISOString().split('T')[0]

  // 탭별 라벨/플레이스홀더
  // 탭별 라벨/플레이스홀더
  // DOM 요소 참조
  const dateLabel = document.getElementById('uploadDateLabel')
  const worklogInput = document.getElementById('uploadWorklogInput')

  // 사진/도면 탭: 작업일지 선택
  if (state.activeTab === 'drawings' || state.activeTab === 'photos') {
    if (dateLabel) dateLabel.textContent = '작업일지'
    if (dateInput) dateInput.classList.add('hidden')
    if (worklogInput) {
      worklogInput.classList.remove('hidden')
      // 필요하다면 기본값 선택 (예: 첫번째 옵션)
      worklogInput.selectedIndex = 0
    }

    // 현장명/문서명 설정
    titleLabel.textContent = '현장명'
    titleInput.placeholder = '현장명을 입력하세요'
  }
  // 내문서함: 등록일 입력
  else if (state.activeTab === 'my-docs') {
    if (dateLabel) dateLabel.textContent = '등록일'
    if (dateInput) {
      dateInput.classList.remove('hidden')
      // 날짜 초기화는 위에서 수행됨
    }
    if (worklogInput) worklogInput.classList.add('hidden')

    titleLabel.textContent = '서류명'
    titleInput.placeholder = '서류명을 입력하세요'
    hideUploadSiteDropdown()
  } else {
    // 그 외 (기본)
    if (dateLabel) dateLabel.textContent = '등록일'
    if (dateInput) dateInput.classList.remove('hidden')
    if (worklogInput) worklogInput.classList.add('hidden')

    titleLabel.textContent = '현장명'
    titleInput.placeholder = '현장명을 입력하세요'
  }

  // my-docs: 기존 항목 파일 교체(업데이트) 모드
  if (state.activeTab === 'my-docs' && editId) {
    const target = state.documents['my-docs'].find(d => d.id === editId)
    if (target) {
      state.editingId = editId
      titleInput.value = target.title || ''
      titleInput.readOnly = true // 서류명은 고정(파일만 교체)
      if (sheetTitleEl) sheetTitleEl.textContent = '자료 변경'
    }
  } else {
    if (sheetTitleEl) sheetTitleEl.textContent = '자료 등록'
  }

  overlay.classList.add('show')
  sheet.classList.add('show')

  if (!titleInput.readOnly) {
    updateUploadClearButton(titleInput)
  } else {
    const clearBtn = titleInput.parentNode?.querySelector('.upload-clear-button')
    if (clearBtn) clearBtn.remove()
  }
}

function closeUploadSheet() {
  document.getElementById('uploadSheetOverlay').classList.remove('show')
  document.getElementById('uploadSheet').classList.remove('show')
  hideUploadSiteDropdown()

  // my-docs 편집 상태 초기화
  state.editingId = null
  const titleInput = document.getElementById('uploadTitleInput')
  // my-docs 탭 신규 등록: 현장명 대신 문서명 입력
  if (state.activeTab === 'my-docs' && !editId) {
    titleInput.placeholder = '문서명을 입력하세요'
  } else {
    titleInput.placeholder = '현장명을 입력하세요'
  }
  if (titleInput) titleInput.readOnly = false
  const sheetTitleEl = document.querySelector('#uploadSheet .sheet-title')
  if (sheetTitleEl) sheetTitleEl.textContent = '자료 등록'
}

function handleUploadTitleInput(e) {
  // my-docs(내문서함)는 현장 자동완성 제외(서류명 고정/직접입력)
  if (state.activeTab !== 'my-docs') {
    showUploadSiteDropdown()
  } else {
    // 내문서함에서는 드롭다운을 표시하지 않음
    hideUploadSiteDropdown()
  }
  updateUploadClearButton(e.target)
}

function updateUploadClearButton(input) {
  let clearBtn = input.parentNode.querySelector('.upload-clear-button')

  if (input.value.length > 0) {
    if (!clearBtn) {
      clearBtn = document.createElement('button')
      clearBtn.type = 'button'
      clearBtn.className = 'upload-clear-button'
      clearBtn.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px;"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>'
      clearBtn.style.cssText = `
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: var(--btn-clear-bg);
      border: none;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      color: #ffffff;
      transition: opacity 0.2s;
      z-index: 10;
      opacity: 1;
    `

      clearBtn.addEventListener('click', () => {
        input.value = ''
        hideUploadSiteDropdown()
        clearBtn.remove()
        input.focus()
      })

      input.parentNode.appendChild(clearBtn)
    }
    clearBtn.style.display = 'flex'
  } else {
    if (clearBtn) {
      clearBtn.remove()
    }
  }
}

function getAllSites() {
  return Object.values(REGION_SITES).flat().reverse()
}

function showUploadSiteDropdown() {
  const input = document.getElementById('uploadTitleInput')
  const value = input.value.trim().toLowerCase()

  // Get all sites from REGION_SITES
  const allSites = getAllSites()
  const filtered = value
    ? allSites.filter(site => site.text.toLowerCase().includes(value))
    : allSites

  const dropdown = document.getElementById('uploadSiteDropdown')
  if (!dropdown) return

  if (filtered.length === 0) {
    dropdown.innerHTML =
      '<li style="padding: 14px 16px; text-align: center; color: var(--text-placeholder);">검색 결과가 없습니다</li>'
    dropdown.style.display = 'block'
    return
  }

  dropdown.innerHTML = filtered
    .map(
      site => `
  <li class="site-dropdown-item" onclick="selectUploadSite('${site.text.replace(/'/g, "\\'")}')"
      style="padding: 14px 16px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background-color 0.2s; font-size: 15px; font-weight: 500; color: var(--text-main);">
    ${site.text}
  </li>
`
    )
    .join('')

  dropdown.style.display = 'block'
}

function hideUploadSiteDropdown() {
  const dropdown = document.getElementById('uploadSiteDropdown')
  if (dropdown) {
    dropdown.style.display = 'none'
  }
}

function selectUploadSite(name) {
  const input = document.getElementById('uploadTitleInput')
  if (input) {
    input.value = name
  }
  hideUploadSiteDropdown()
}

function submitUpload() {
  const title = document.getElementById('uploadTitleInput').value
  const date = document.getElementById('uploadDateInput').value
  const fileInput = document.getElementById('uploadFileInput')

  if (!title) {
    alert('제목을 입력해주세요.')
    return
  }
  const isMyDocsUpdate = state.activeTab === 'my-docs' && !!state.editingId
  const targetGroup = isMyDocsUpdate
    ? state.documents['my-docs'].find(d => d.id === state.editingId)
    : null

  // Create new document group (신규 등록용)
  const newGroup = {
    id: 'g' + Date.now(),
    title: title,
    date: date,
    time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    author: '사용자',
    files: [],
  }

  // Add punch data for punch tab
  if (state.activeTab === 'punch') {
    newGroup.punchData = {
      location: '',
      issue: '',
      priority: '낮음',
      status: 'open',
      assignee: '',
      dueDate: '',
    }
  }

  // my-docs 업데이트 모드에서는 파일 선택이 필수
  if (fileInput.files.length === 0) {
    if (isMyDocsUpdate) {
      alert('변경할 파일을 선택해주세요.')
      return
    }

    // Create empty group (title only)
    state.documents[state.activeTab].push(newGroup)

    // Update UI
    renderDocumentList()
    updateBatchBar()

    if (state.activeTab === 'punch') {
      updatePunchSummary()
    }

    alert('제목만 등록되었습니다. 파일은 나중에 추가할 수 있습니다.')
    closeUploadSheet()
    fileInput.value = ''
    return
  }

  const totalFiles = fileInput.files.length
  let filesProcessed = 0

  // 업로드 대상 그룹(신규 vs my-docs 교체)
  const destGroup = isMyDocsUpdate && targetGroup ? targetGroup : newGroup

  // my-docs 교체: 기존 파일 초기화 + 메타 갱신(제목은 고정)
  if (isMyDocsUpdate && targetGroup) {
    destGroup.files = []
    destGroup.date = date
    destGroup.time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  Array.from(fileInput.files).forEach((file, index) => {
    const reader = new FileReader()

    reader.onload = function (e) {
      const isImg = file.type.startsWith('image/')
      const newFile = {
        id: 'f' + Date.now() + index,
        name: file.name,
        type: isImg ? 'img' : 'file',
        url: e.target.result,
        size: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        ext: file.name.split('.').pop().toUpperCase(),
      }

      // Set file states based on active tab
      if (state.activeTab === 'punch' && isImg) {
        newFile.currentView = 'after'
        newFile.url_before = ''
        newFile.url_after = e.target.result
      } else if (state.activeTab === 'photos' && isImg) {
        newFile.currentView = 'after'
        newFile.url_before = ''
        newFile.url_after = e.target.result
      } else if (state.activeTab === 'drawings') {
        newFile.drawingState = 'ing'
      }

      destGroup.files.push(newFile)
      filesProcessed++

      if (filesProcessed === totalFiles) {
        // Add to documents list (신규일 때만 push)
        if (!(isMyDocsUpdate && targetGroup)) {
          state.documents[state.activeTab].push(newGroup)
        }

        // Update UI
        renderDocumentList()
        updateBatchBar()

        if (state.activeTab === 'punch') {
          updatePunchSummary()
        }

        alert(
          isMyDocsUpdate
            ? `${totalFiles}개 파일이 변경되었습니다.`
            : `${totalFiles}개 파일이 업로드되었습니다.`
        )
        closeUploadSheet()
        fileInput.value = ''
        state.editingId = null
      }
    }

    reader.readAsDataURL(file)
  })
}

// ================================================================
// 보고서 에디터 함수
// ================================================================

// @doc.html 방식: 보고서 이벤트 리스너 설정
function setupReportEventListeners() {
  // 확대/축소 버튼
  const zoomInBtn = document.getElementById('zoomIn')
  const zoomOutBtn = document.getElementById('zoomOut')
  const togglePanBtn = document.getElementById('togglePan')
  const shareBtn = document.getElementById('shareReportControl')

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      state.reportZoom = Math.min(2, state.reportZoom + 0.1)
      updateReportTransform()
    })
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      state.reportZoom = Math.max(0.3, state.reportZoom - 0.1)
      updateReportTransform()
    })
  }

  if (togglePanBtn) {
    togglePanBtn.addEventListener('click', () => {
      toggleReportPan()
    })
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      alert('링크가 복사되었습니다.')
    })
  }

  console.log('Report event listeners setup completed')
}

// 보고서 에디터 열기 (@doc.html React 기반 완벽 이식)
function openReportEditor() {
  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.punchItems || currentGroup.punchItems.length === 0) {
    alert('보고서를 생성할 조치 항목이 없습니다.')
    return
  }

  const overlay = document.getElementById('reportEditorOverlay')
  if (!overlay) return

  overlay.classList.remove('hidden')
  overlay.style.display = 'flex'

  // [핵심 로직] 모바일 화면 너비에 맞춰 자동 줌 계산
  // A4 너비(210mm)는 약 794px (96dpi 기준)
  const A4_WIDTH_PX = 794
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // 화면 너비에서 좌우 여백(약 20px)을 뺀 공간에 A4가 꽉 차도록 비율 계산
  let initialScale = (viewportWidth - 20) / A4_WIDTH_PX

  // 너무 커지거나 작아지는 것 방지 (모바일은 보통 0.4~0.5 수준이 됨)
  if (initialScale > 1.2) initialScale = 1.0
  if (initialScale < 0.3) initialScale = 0.3

  // 상태 업데이트
  state.reportZoom = initialScale
  state.reportPosition = { x: 0, y: 0 } // 위치 초기화
  state.isReportPanning = false
  state.reportEditorOpen = true

  // 보고서 데이터 바인딩
  const reportSiteName = document.getElementById('reportSiteName')
  const reportInfoSiteName = document.getElementById('reportInfoSiteName')
  const reportInfoDate = document.getElementById('reportInfoDate')

  if (reportSiteName && currentGroup.title) {
    reportSiteName.textContent = `${currentGroup.title} 점검보고서`
  }

  if (reportInfoSiteName) {
    reportInfoSiteName.textContent = currentGroup.title || ''
  }

  if (reportInfoDate) {
    const today = new Date()
    reportInfoDate.textContent = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
  }

  // 보고서 내용 렌더링 (실시간 편집 가능)
  renderReportTable()

  // Transform 초기화
  updateReportTransform()

  // 이벤트 리스너 설정
  setupReportEventListeners()

  // Lucide 아이콘 초기화
  lucide.createIcons()

  console.log('Report editor opened with React-style state management')
}

function closeReportEditor() {
  console.log('closeReportEditor called')
  state.isReportEditorOpen = false
  const reportOverlay = document.getElementById('reportEditorOverlay')
  if (reportOverlay) {
    reportOverlay.classList.add('hidden')
    reportOverlay.style.display = 'none'
  }
  console.log('closeReportEditor completed')
}

function renderReportTable() {
  const tbody = document.getElementById('reportTableBody')
  const currentGroup = getCurrentGroup()

  if (!currentGroup) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-center">현장 정보가 없습니다.</td></tr>'
    return
  }

  const punchItems = currentGroup.punchItems || []

  if (punchItems.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="table-center">등록된 구간별 조치 정보가 없습니다.</td></tr>'
    return
  }

  // @doc.html 방식: 현장 사진 가져오기
  const siteFiles = currentGroup.files || []

  tbody.innerHTML = punchItems
    .map((item, index) => {
      // @doc.html 방식: 각 구간별 사진 찾기
      // @doc.html 방식: 이미지 데이터 매핑 수정
      const imgBefore = item.beforePhoto || ''
      const imgAfter = item.afterPhoto || ''

      // @doc.html 방식: 상태 텍스트
      const statusText =
        item.status === 'done' ? '완료' : item.status === 'ing' ? '진행중' : '미조치'

      return `
    <tr data-item-index="${index}">
      <td class="report-table-center report-table-bold">${index + 1}</td>
      <td class="report-table-center" contenteditable="true" data-field="location">${item.location || ''}</td>
      <td class="report-table-left" contenteditable="true" data-field="issue">${item.issue || ''}</td>
      <td style="padding: 4px;">
        ${imgBefore ? `<div style="position: relative; width: 100%; height: 80px;"><img src="${imgBefore}" alt="조치전" style="width: 100%; height: 80px; object-fit: cover; display: block; cursor: pointer; border: 2px solid #e2e8f0; border-radius: 4px;" onclick="triggerReportImageUpload(${index}, 'before')" /><div class="report-image-overlay" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; pointer-events: none;">클릭: 교체/삭제</div></div>` : `<div class="report-image-placeholder" style="width: 100%; height: 80px; display: flex; align-items: center; justify-center; background: #f8fafc; color: #94a3b8; font-size: 11px; cursor: pointer; border: 1px dashed #cbd5e1; border-radius: 4px;" onclick="triggerReportImageUpload(${index}, 'before')">사진없음</div>`}
      </td>
      <td style="padding: 4px;">
        ${imgAfter ? `<div style="position: relative; width: 100%; height: 80px;"><img src="${imgAfter}" alt="조치후" style="width: 100%; height: 80px; object-fit: cover; display: block; cursor: pointer; border: 2px solid #e2e8f0; border-radius: 4px;" onclick="triggerReportImageUpload(${index}, 'after')" /><div class="report-image-overlay" style="position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; pointer-events: none;">클릭: 교체/삭제</div></div>` : `<div class="report-image-placeholder" style="width: 100%; height: 80px; display: flex; align-items: center; justify-center; background: #f8fafc; color: #94a3b8; font-size: 11px; cursor: pointer; border: 1px dashed #cbd5e1; border-radius: 4px;" onclick="triggerReportImageUpload(${index}, 'after')">사진없음</div>`}
      </td>
      <td class="report-table-center">
        <button class="report-status-btn ${item.status || 'open'}" onclick="toggleReportPunchItemStatus(${index})" style="white-space: nowrap;">
          ${statusText}
        </button>
      </td>
    </tr>
  `
    })
    .join('')

  // contenteditable 셀의 변경사항을 자동 저장
  setTimeout(() => {
    const editableCells = tbody.querySelectorAll('td[contenteditable="true"]')
    editableCells.forEach(cell => {
      cell.addEventListener('blur', function () {
        const row = this.closest('tr')
        const itemIndex = parseInt(row.dataset.itemIndex)
        const field = this.dataset.field
        const newValue = this.textContent.trim()

        if (currentGroup.punchItems && currentGroup.punchItems[itemIndex]) {
          currentGroup.punchItems[itemIndex][field] = newValue
          renderDetailView() // 상세 뷰도 업데이트
          updatePunchSummary() // 통계 업데이트
        }
      })
    })
  }, 100)
}

function toggleReportPunchItemStatus(itemIndex) {
  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.punchItems) return

  const item = currentGroup.punchItems[itemIndex]
  if (!item) return

  // 상태 순환: open -> ing -> done -> open
  if (item.status === 'open') {
    item.status = 'ing'
  } else if (item.status === 'ing') {
    item.status = 'done'
  } else {
    item.status = 'open'
  }

  renderReportTable()
  renderDetailView() // 상세 뷰 업데이트
  renderDocumentList()
  updatePunchSummary()
}

function toggleReportStatus(id) {
  // 이전 호환성을 위해 유지
  const item = state.documents['punch'].find(doc => doc.id === id)
  if (!item?.punchItems) return

  const firstItem = item.punchItems[0]
  if (!firstItem) return

  if (firstItem.status === 'open') {
    firstItem.status = 'ing'
  } else if (firstItem.status === 'ing') {
    firstItem.status = 'done'
  } else {
    firstItem.status = 'open'
  }

  renderReportTable()
  renderDetailView() // 상세 뷰 업데이트
  renderDocumentList()
  updatePunchSummary()
}

// @doc.html 방식: 보고서 이미지 업로드 트리거 (교체/삭제 기능 추가, 승인완료 상태 체크)
function triggerReportImageUpload(itemIndex, type) {
  if (isGroupApproved()) {
    alert('승인완료된 현장기록은 이미지를 수정할 수 없습니다. 조회만 가능합니다.')
    return
  }

  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.punchItems) return

  const item = currentGroup.punchItems[itemIndex]
  if (!item) return

  const hasImage = (type === 'before' && item.beforePhoto) || (type === 'after' && item.afterPhoto)

  if (hasImage) {
    // 이미지가 있는 경우: 교체 또는 삭제 선택
    const choice = confirm(`이미지를 교체하시겠습니까?\n\n확인: 교체하기\n취소: 삭제하기`)
    if (choice) {
      // 교체
      uploadNewImage(itemIndex, type)
    } else {
      // 삭제
      if (confirm('이미지를 삭제하시겠습니까?')) {
        if (type === 'before') {
          item.beforePhoto = ''
        } else {
          item.afterPhoto = ''
        }
        renderReportTable()
        renderDetailView()
        lucide.createIcons()
      }
    }
  } else {
    // 이미지가 없는 경우: 새 이미지 업로드
    uploadNewImage(itemIndex, type)
  }
}

function uploadNewImage(itemIndex, type) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = e => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      const currentGroup = getCurrentGroup()
      if (!currentGroup || !currentGroup.punchItems) return

      const item = currentGroup.punchItems[itemIndex]
      if (!item) return

      // @doc.html 방식: 이미지 데이터 저장
      if (type === 'before') {
        item.beforePhoto = e.target.result
      } else {
        item.afterPhoto = e.target.result
      }

      // 보고서 테이블 다시 렌더링
      renderReportTable()
      renderDetailView() // 상세 뷰도 업데이트

      lucide.createIcons()
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function uploadReportImage(id, type) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = e => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const item = state.documents['punch'].find(doc => doc.id === id)
      if (!item) return

      let targetFile = item.files.find(f => f.type === 'img')
      if (!targetFile) {
        targetFile = {
          id: `${id}_img`,
          name: '이미지',
          type: 'img',
          url: '',
          url_before: '',
          url_after: '',
          size: '2MB',
          ext: 'JPG',
        }
        item.files.push(targetFile)
      }

      if (type === 'before') {
        targetFile.url_before = event.target.result
        targetFile.currentView = 'before'
        targetFile.url = event.target.result
      } else {
        targetFile.url_after = event.target.result
        targetFile.currentView = 'after'
        targetFile.url = event.target.result
      }

      renderReportTable()
      renderDetailView()
    }
    reader.readAsDataURL(file)
  }
  input.click()
}

function updateReportTransform() {
  const content = document.getElementById('reportContent')
  if (content) {
    // scale()이 top center 기준이므로 x, y 이동만 적용하면 됨
    content.style.transform = `translate(${state.reportPosition.x}px, ${state.reportPosition.y}px) scale(${state.reportZoom})`
  }
}

function handleReportZoomIn() {
  state.reportZoom = Math.min(2, state.reportZoom + 0.1)
  updateReportTransform()
}

function handleReportZoomOut() {
  state.reportZoom = Math.max(0.3, state.reportZoom - 0.1)
  updateReportTransform()
}

function toggleReportPan() {
  state.isReportPanning = !state.isReportPanning
  const viewport = document.getElementById('reportViewport')
  const toggleBtn = document.getElementById('togglePan')

  if (state.isReportPanning) {
    viewport.style.cursor = 'grabbing'
    toggleBtn.classList.add('active')
  } else {
    viewport.style.cursor = 'grab'
    toggleBtn.classList.remove('active')
  }
}

function generateReportPDF() {
  const content = document.getElementById('reportContent')
  if (!content) {
    alert('콘텐츠를 찾을 수 없습니다.')
    return
  }

  try {
    const original = content
    const clone = original.cloneNode(true)

    // Filter out rows that are purely empty placeholders in the clone
    const rows = Array.from(clone.querySelectorAll('tbody tr'))
    rows.forEach(row => {
      if (row.textContent?.trim() === '') {
        row.remove()
      }
    })

    // Hide photo upload placeholders text in the clone
    const uploadPlaceholders = Array.from(clone.querySelectorAll('.report-image-placeholder'))
    uploadPlaceholders.forEach(el => {
      el.style.display = 'none'
    })

    // Hide image overlay text in the clone
    const imageOverlays = Array.from(clone.querySelectorAll('.report-image-overlay'))
    imageOverlays.forEach(el => {
      el.style.display = 'none'
    })

    // Remove borders from image containers for the PDF
    const imageContainers = Array.from(clone.querySelectorAll('.report-image-cell'))
    imageContainers.forEach(el => {
      el.style.border = 'none'
    })

    clone.style.transform = 'none'
    clone.style.width = '210mm'
    clone.style.minHeight = '297mm'
    clone.style.background = 'white'
    clone.style.margin = '0'
    clone.style.padding = '20mm 10mm'

    const hiddenContainer = document.createElement('div')
    hiddenContainer.style.position = 'absolute'
    hiddenContainer.style.top = '-10000px'
    hiddenContainer.style.left = '-10000px'
    hiddenContainer.style.width = '0'
    hiddenContainer.style.height = '0'
    hiddenContainer.style.overflow = 'hidden'

    hiddenContainer.appendChild(clone)
    document.body.appendChild(hiddenContainer)

    const images = Array.from(clone.querySelectorAll('img'))
    Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
        })
      })
    ).then(() => {
      html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794, // A4 기준 폭으로 최적화
      })
        .then(canvas => {
          document.body.removeChild(hiddenContainer)

          const { jsPDF } = window.jspdf
          const pdf = new jsPDF('p', 'mm', 'a4')

          const pageWidthMm = 210
          const pageHeightMm = 297
          const marginX = 10
          const marginY = 12
          const usableW = pageWidthMm - marginX * 2
          const usableH = pageHeightMm - marginY * 2
          const mmPerPx = usableW / canvas.width

          // Calculate row positions to avoid cutting through table rows
          const tableRows = Array.from(clone.querySelectorAll('tbody tr'))
          const rowBottomsCanvasPx = []

          tableRows.forEach(row => {
            const rect = row.getBoundingClientRect()
            const cloneRect = clone.getBoundingClientRect()
            const relativeBottom = (rect.bottom - cloneRect.top) * 2 // scale factor
            rowBottomsCanvasPx.push(relativeBottom)
          })

          const pageHeightPx = Math.floor(usableH / mmPerPx)
          let y = 0
          let pageIndex = 0

          while (y < canvas.height - 1) {
            if (pageIndex > 0) pdf.addPage()

            const targetEnd = Math.min(y + pageHeightPx, canvas.height)
            let breakY = targetEnd

            // Find the last row bottom that fits within this page
            for (let i = rowBottomsCanvasPx.length - 1; i >= 0; i--) {
              const rb = rowBottomsCanvasPx[i]
              if (rb > y + 50 && rb <= targetEnd) {
                breakY = rb
                break
              }
            }

            const sliceH = breakY - y
            const sliceCanvas = document.createElement('canvas')
            sliceCanvas.width = canvas.width
            sliceCanvas.height = sliceH
            sliceCanvas
              .getContext('2d')
              .drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

            const sliceHeightMm = sliceH * mmPerPx
            pdf.addImage(
              sliceCanvas.toDataURL('image/jpeg', 0.9),
              'JPEG',
              marginX,
              marginY,
              usableW,
              sliceHeightMm
            )

            pageIndex++
            y = breakY
          }

          const currentGroup = getCurrentGroup()
          const siteName = currentGroup?.title || '현장'
          pdf.save(`점검보고서_${siteName}_${Date.now()}.pdf`)
        })
        .catch(error => {
          document.body.removeChild(hiddenContainer)
          console.error('html2canvas error:', error)
          alert('PDF 생성 중 오류가 발생했습니다.')
        })
    })
  } catch (e) {
    console.error(e)
    alert('PDF 생성 중 오류가 발생했습니다.')
  }
}

function handlePunchStatusFilter(filter) {
  state.punchStatusFilter = filter
  document.querySelectorAll('.punch-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter)
  })
  renderDocumentList()
}

// ================================================================
// 조치 항목 동적 관리 함수들
// ================================================================

// 새로운 조치 항목 추가 (승인완료 상태 체크 추가)
function addNewPunchItem() {
  if (isGroupApproved()) {
    alert('승인완료된 현장기록은 항목을 추가할 수 없습니다. 조회만 가능합니다.')
    return
  }

  const currentGroup = getCurrentGroup()
  if (!currentGroup) return

  const newItem = {
    id: 'pi_' + Date.now(),
    location: '',
    issue: '',
    priority: '중간',
    status: 'open',
    assignee: '',
    dueDate: '',
    date: new Date().toISOString().split('T')[0],
    beforePhoto: null,
    afterPhoto: null,
  }

  if (!currentGroup.punchItems) {
    currentGroup.punchItems = []
  }

  // 리스트 상단에 추가
  currentGroup.punchItems.unshift(newItem)

  renderDetailView()
  lucide.createIcons()

  // 새로 추가된 항목으로 스크롤
  setTimeout(() => {
    const newCard = document.querySelector(`[data-item-id="${newItem.id}"]`)
    if (newCard) {
      newCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const input = newCard.querySelector('input')
      if (input) input.focus()
    }
  }, 100)
}

// 그룹 상태 확인 함수
function isGroupApproved() {
  const currentGroup = getCurrentGroup()
  return currentGroup && currentGroup.status === 'done'
}

// 조치 항목 삭제 (승인완료 상태 체크 추가)
function deletePunchItem(itemId) {
  if (isGroupApproved()) {
    alert('승인완료된 현장기록은 삭제할 수 없습니다. 조회만 가능합니다.')
    return
  }

  if (!confirm('이 항목을 삭제하시겠습니까?')) return

  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.punchItems) return

  currentGroup.punchItems = currentGroup.punchItems.filter(item => item.id !== itemId)

  renderDetailView()
  renderReportTable()
  lucide.createIcons()
}

// 조치 항목 필드 업데이트 (승인완료 상태 체크 추가)
function updatePunchItemField(itemId, field, value) {
  if (isGroupApproved()) {
    alert('승인완료된 현장기록은 수정할 수 없습니다. 조회만 가능합니다.')
    return
  }

  const currentGroup = getCurrentGroup()
  if (!currentGroup || !currentGroup.punchItems) return

  const item = currentGroup.punchItems.find(i => i.id === itemId)
  if (!item) return

  item[field] = value

  // 상태나 우선순위 변경 시 UI 즉시 업데이트
  if (field === 'status' || field === 'priority') {
    renderDetailView()
    renderReportTable()
    lucide.createIcons()
  }
}

// 조치 항목 사진 업로드 트리거 (승인완료 상태 체크 추가)
let currentPhotoUpload = null
function triggerPunchPhotoUpload(itemId, photoType) {
  if (isGroupApproved()) {
    alert('승인완료된 현장기록은 사진을 업로드할 수 없습니다. 조회만 가능합니다.')
    return
  }

  currentPhotoUpload = { itemId, photoType }

  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = handlePunchPhotoUpload
  input.click()
}

// 조치 항목 사진 업로드 처리 (Base64 변환)
function handlePunchPhotoUpload(event) {
  const file = event.target.files[0]
  if (!file || !currentPhotoUpload) return

  const reader = new FileReader()
  reader.onload = e => {
    const currentGroup = getCurrentGroup()
    if (!currentGroup || !currentGroup.punchItems) return

    const item = currentGroup.punchItems.find(i => i.id === currentPhotoUpload.itemId)
    if (!item) return

    item[currentPhotoUpload.photoType] = e.target.result

    renderDetailView()
    renderReportTable()
    lucide.createIcons()

    currentPhotoUpload = null
  }
  reader.readAsDataURL(file)
}

// ================================================================
// 도면함 기능 함수 (B 기능 이식)
// ================================================================

function toggleWorklogExpand(id) {
  if (state.expandedWorklogs.has(id)) {
    state.expandedWorklogs.delete(id)
  } else {
    state.expandedWorklogs.add(id)
  }
  renderDocumentList()
  lucide.createIcons()
}

function setDrawingTab(worklogId, tabName) {
  state.drawingTabState[worklogId] = tabName
  renderDocumentList()
  lucide.createIcons()
}

function setDrawingUploadType(worklogId, type) {
  state.drawingUploadType[worklogId] = type
  renderDocumentList()
  lucide.createIcons()
}

function renderDrawingTabContent(worklog, tab) {
  if (tab === 'list') {
    if (!worklog.drawings || worklog.drawings.length === 0) {
      return `
      <div style="text-align:center; padding:32px 0; color:#94a3b8;">
        <i data-lucide="folder-open" class="icon-32" style="margin-bottom:8px; opacity:0.5;"></i>
        <p style="font-size:13px;">연결된 도면이 없습니다.</p>
      </div>
    `
    }
    return worklog.drawings
      .map(d => {
        const isSelected = state.selectedIds.has(d.id)
        return `
    <div class="drawing-item-card ${isSelected ? 'selected' : ''}" style="position:relative;" onclick="toggleSelection('${d.id}')">
      <!-- Checkbox -->
      <div class="checkbox-wrapper" onclick="event.stopPropagation(); toggleSelection('${d.id}')">
        <div class="checkbox ${isSelected ? 'checked' : ''}">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="check" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>
        </div>
      </div>

      <div class="drawing-thumb">
        ${d.url ? `<img src="${d.url}" />` : '<i data-lucide="image"></i>'}
      </div>
      
      <div class="drawing-info" style="flex:1; display:flex; flex-direction:column; justify-content:center;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
          <div class="drawing-list-title" style="margin-bottom:0; flex:1; margin-right:8px; line-height:1.3;">${d.title}</div>
          <div style="display:flex; gap:4px; flex-shrink:0;">
            <span class="badge-mini ${d.source === 'markup' ? 'badge-purple' : 'badge-blue'}">
              ${d.source === 'markup' ? '마킹' : '파일'}
            </span>
            ${d.type === 'progress' ? '<span class="badge-mini badge-green">진행도면</span>' : '<span class="badge-mini badge-yellow">공도면</span>'}
          </div>
        </div>
        <div class="drawing-meta">
          <span style="font-size:13px; color:#94a3b8;">${d.date}</span>
        </div>
      </div>
    </div>
  `
      })
      .join('')
  }

  if (tab === 'upload') {
    const currentType = state.drawingUploadType[worklog.id] || 'progress'
    return `
    <div>
      <div class="type-select-group">
        <button class="type-btn ${currentType === 'progress' ? 'active' : ''}" onclick="setDrawingUploadType('${worklog.id}', 'progress')">진행 도면</button>
        <button class="type-btn ${currentType === 'blueprint' ? 'active' : ''}" onclick="setDrawingUploadType('${worklog.id}', 'blueprint')">공 도면</button>
      </div>
      
      <div class="upload-zone" onclick="alert('파일 선택')">
        <div style="width:48px; height:48px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <i data-lucide="upload-cloud" class="icon-2xl icon-primary"></i>
        </div>
        <div style="text-align:center;">
          <p style="font-size:16px; font-weight:700; color:var(--text-main);">파일을 선택하거나 촬영하세요</p>
          <p style="font-size:14px; color:var(--text-sub); margin-top:4px;">JPG, PNG, PDF 지원</p>
        </div>
      </div>
      
      <button class="full-width-btn" style="margin-top:16px;" onclick="alert('업로드')">
        <i data-lucide="link"></i>
        <span>현재 작업일지에 도면 연동</span>
      </button>
    </div>
  `
  }

  if (tab === 'tool') {
    return `
    <div>
       <div style="background:#eff6ff; border-radius:12px; padding:16px; margin-bottom:16px;">
         <h4 style="font-size:16px; font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
           <span>📏</span> 도면마킹도구 연동
         </h4>
         <p style="font-size:14px; color:#475569; line-height:1.4;">
           촬영한 사진이나 업로드된 도면에 마킹(치수, 텍스트)을 하여 현재 작업일지의 연계 도면으로 즉시 저장합니다.
         </p>
       </div>
       
       <button class="full-width-btn" style="background:white; color:var(--text-main); border:1px solid var(--border);" onclick="alert('마킹 도구 실행')">
         <i data-lucide="image-plus" class="icon-primary"></i>
         <span>마킹할 도면 불러오기</span>
       </button>
    </div>
  `
  }
}

// 전역 객체에 할당 (안전장치)
window.toggleWorklogExpand = toggleWorklogExpand
window.setDrawingTab = setDrawingTab
window.setDrawingUploadType = setDrawingUploadType

// ================================================================
// 사진함 기능 함수 (Accordion + SubTabs)
// ================================================================

function togglePhotoGroupExpand(id) {
  if (state.expandedPhotoGroups.has(id)) {
    state.expandedPhotoGroups.delete(id)
  } else {
    state.expandedPhotoGroups.add(id)
  }
  renderDocumentList()
  if (typeof lucide !== 'undefined') lucide.createIcons()
}

function setPhotoTab(groupId, tabName) {
  state.photoTabState[groupId] = tabName
  renderDocumentList()
  if (typeof lucide !== 'undefined') lucide.createIcons()
}

function toggleRegistrySelection(photoId) {
  if (state.selectedRegistryPhotos.has(photoId)) {
    state.selectedRegistryPhotos.delete(photoId)
  } else {
    state.selectedRegistryPhotos.add(photoId)
  }
  renderDocumentList() // re-render to update selection UI
}

function renderPhotoTabContent(group, tab) {
  if (tab === 'list') {
    if (!group.photos || group.photos.length === 0) {
      return `
      <div style="text-align:center; padding:32px 0; color:#94a3b8;">
        <i data-lucide="image-off" class="icon-32" style="margin-bottom:8px; opacity:0.5;"></i>
        <p style="font-size:13px;">등록된 사진이 없습니다.</p>
      </div>
    `
    }

    return `
    <div class="photo-grid-expanded">
      ${group.photos
        .map(
          p => `
        <div class="photo-item-card" onclick="previewImage('${p.url}', '${group.desc}')">
          <img src="${p.url}" loading="lazy" />
          ${
            p.type
              ? `<div class="photo-tag ${p.type === 'before' ? 'badge-gray' : p.type === 'after' ? 'badge-blue' : 'badge-purple'}" 
               style="${p.type === 'before' ? 'background:#1e293b;' : p.type === 'after' ? 'background:#0ea5e9;' : 'background:#7c3aed;'}">
               ${p.type === 'before' ? '전' : p.type === 'after' ? '후' : '참고'}
             </div>`
              : ''
          }
        </div>
      `
        )
        .join('')}
    </div>
    <div style="text-align:right; margin-top:8px;">
      <span style="font-size:12px; color:#94a3b8;">총 ${group.photos.length}장</span>
    </div>
  `
  }

  if (tab === 'upload') {
    return `
    <div>
      <div class="upload-zone" onclick="alert('사진 파일 선택')">
        <div style="width:48px; height:48px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <i data-lucide="camera" class="icon-2xl icon-primary"></i>
        </div>
        <div style="text-align:center;">
          <p style="font-size:16px; font-weight:700; color:var(--text-main);">사진 촬영 또는 업로드</p>
          <p style="font-size:14px; color:var(--text-sub); margin-top:4px;">카메라로 즉시 촬영하거나 파일을 선택하세요</p>
        </div>
      </div>
      
      <div style="display:flex; gap:8px; margin-top:12px;">
        <button class="type-btn active" style="flex:1;">시공 전</button>
        <button class="type-btn" style="flex:1;">시공 중</button>
        <button class="type-btn" style="flex:1;">시공 후</button>
      </div>

      <button class="full-width-btn" style="margin-top:16px;" onclick="alert('업로드 실행')">
        <i data-lucide="upload-cloud"></i>
        <span>사진 등록하기</span>
      </button>
    </div>
  `
  }

  if (tab === 'registry') {
    return `
    <div>
       <div style="background:#f8fafc; border-radius:12px; padding:12px; margin-bottom:16px; border:1px solid var(--border);">
         <h4 style="font-size:15px; font-weight:700; margin-bottom:4px;">사진대지 생성</h4>
         <p style="font-size:13px; color:#64748b; line-height:1.4;">
           사진을 선택하여 PDF 사진대지를 생성합니다. 아래 목록에서 대지에 포함할 사진을 선택해주세요.
         </p>
       </div>

       <!-- 사진 선택 그리드 -->
       <div class="photo-grid-expanded" style="max-height:240px; overflow-y:auto; padding-right:4px;">
          ${
            group.photos && group.photos.length > 0
              ? group.photos
                  .map(
                    p => `
              <div class="photo-item-card ${state.selectedRegistryPhotos.has(p.id) ? 'selected' : ''}" 
                   onclick="toggleRegistrySelection('${p.id}')">
                <img src="${p.url}" />
                <div class="photo-select-overlay">
                  <div style="width:24px; height:24px; background:#0ea5e9; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                    <i data-lucide="check" style="width:16px; height:16px; color:white; stroke-width:3;"></i>
                  </div>
                </div>
              </div>
            `
                  )
                  .join('')
              : '<p style="grid-column:1/-1; text-align:center; color:#cbd5e1; font-size:13px;">선택할 사진이 없습니다.</p>'
          }
       </div>

       <button class="full-width-btn" style="background:var(--header-navy); margin-top:16px;" 
         onclick="openReportEditor()" ${state.selectedRegistryPhotos.size === 0 ? 'disabled' : ''}>
         <i data-lucide="file-check"></i>
         <span>선택한 ${state.selectedRegistryPhotos.size}장으로 대지 생성</span>
       </button>
    </div>
  `
  }
}

window.togglePhotoGroupExpand = togglePhotoGroupExpand
window.setPhotoTab = setPhotoTab
window.toggleRegistrySelection = toggleRegistrySelection

// ================================================================
// 사진함 기능 함수 (Accordion + SubTabs)
// ================================================================

function togglePhotoGroupExpand(id) {
  if (state.expandedPhotoGroups.has(id)) {
    state.expandedPhotoGroups.delete(id)
  } else {
    state.expandedPhotoGroups.add(id)
  }
  renderDocumentList()
  if (typeof lucide !== 'undefined') lucide.createIcons()
}

function setPhotoTab(groupId, tabName) {
  state.photoTabState[groupId] = tabName
  renderDocumentList()
  if (typeof lucide !== 'undefined') lucide.createIcons()
}

function toggleRegistrySelection(photoId) {
  if (state.selectedRegistryPhotos.has(photoId)) {
    state.selectedRegistryPhotos.delete(photoId)
  } else {
    state.selectedRegistryPhotos.add(photoId)
  }
  renderDocumentList() // re-render to update selection UI
}

function renderPhotoGroupContent(doc) {
  const photos = doc.photos || []
  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  // '기타'나 '참조'는 '후'에 포함시키거나 별도로 처리할 수 있지만, 요구사항인 '전/후' 2분할에 중점
  // B 화면에서 전/후만 강조하므로 2개 섹션으로 구성

  return `
    <div>
      <!-- 1. 사진 업로드 섹션 -->
      <div>
         <div style="font-size:15px; font-weight:500; color:#1f2942; margin-bottom:8px;">사진 업로드</div>
         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
           <div class="split-upload-box" onclick="alert('시공 전 사진 업로드')" style="padding: 8px;">
             <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:8px;">
               <div style="font-size:15px; font-weight:700; color:#1f2942;">시공 전</div>
               <span class="upload-desc" style="position:static; margin-top:0;">0/30장</span>
             </div>
             <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
               <i data-lucide="plus" style="width:16px; height:16px; color:#64748b;"></i>
             </div>
           </div>
           
           <div class="split-upload-box" onclick="alert('시공 후 사진 업로드')" style="padding: 8px;">
             <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:8px;">
               <div style="font-size:15px; font-weight:700; color:#1f2942;">시공 후</div>
               <span class="upload-desc" style="position:static; margin-top:0;">0/30장</span>
             </div>
             <div style="width:32px; height:32px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="plus" style="width:16px; height:16px; color:#64748b;"></i>
             </div>
           </div>
         </div>
      </div>

      <!-- 2. 업로드 된 사진 섹션 -->
      <div style="margin-top: 24px;">
         <div style="font-size:15px; font-weight:500; color:#1f2942; margin-bottom:8px;">업로드 된 사진</div>
         <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
           <!-- Before -->
           <div class="photo-column-box">
             <div class="column-header">시공 전</div>
             ${
               beforePhotos.length > 0
                 ? `<div class="mini-photo-grid">
                     ${beforePhotos
                       .map(
                         p => `
                       <div class="mini-photo-item" onclick="previewImage('${p.url}', '${doc.title}')">
                         <img src="${p.url}" loading="lazy" />
                       </div>
                     `
                       )
                       .join('')}
                   </div>`
                 : `<div style="text-align:center; padding:12px 0; color:#cbd5e1; font-size:10px;">사진 없음</div>`
             }
           </div>
           
           <!-- After -->
           <div class="photo-column-box">
             <div class="column-header">시공 후</div>
             ${
               afterPhotos.length > 0
                 ? `<div class="mini-photo-grid">
                     ${afterPhotos
                       .map(
                         p => `
                       <div class="mini-photo-item" onclick="previewImage('${p.url}', '${doc.title}')">
                         <img src="${p.url}" loading="lazy" />
                       </div>
                     `
                       )
                       .join('')}
                   </div>`
                 : `<div style="text-align:center; padding:12px 0; color:#cbd5e1; font-size:10px;">사진 없음</div>`
             }
           </div>
         </div>
      </div>
    </div>
  `
}

window.togglePhotoGroupExpand = togglePhotoGroupExpand
// Remove setPhotoTab, toggleRegistrySelection as they are no longer needed

// ================================================================
// 초기화
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 탭 버튼 이벤트
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => handleTabChange(btn.dataset.tab))
  })

  // 검색 이벤트
  document.getElementById('mainSearchInput').addEventListener('input', e => {
    state.searchQuery = e.target.value
    state.visibleCount = 5
    updateClearButton(e.target, document.getElementById('mainClearButton'))
    renderDocumentList()
  })

  // 현장 검색 이벤트
  document.getElementById('siteSearchInput').addEventListener('input', e => {
    state.siteSearchQuery = e.target.value
    updateClearButton(e.target, document.getElementById('siteClearButton'))
    renderDocumentList()
  })

  function updateClearButton(input, button) {
    if (input.value.trim()) {
      button.classList.add('show')
    } else {
      button.classList.remove('show')
    }
  }

  // 지우기 버튼 클릭 이벤트
  document.getElementById('mainClearButton').addEventListener('click', () => {
    const input = document.getElementById('mainSearchInput')
    input.value = ''
    state.searchQuery = ''
    document.getElementById('mainClearButton').classList.remove('show')
    input.focus()
    renderDocumentList()
  })

  document.getElementById('siteClearButton').addEventListener('click', () => {
    const input = document.getElementById('siteSearchInput')
    input.value = ''
    state.siteSearchQuery = ''
    document.getElementById('siteClearButton').classList.remove('show')
    input.focus()
    renderDocumentList()
  })

  // 펀치 필터 이벤트
  document.querySelectorAll('.punch-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => handlePunchStatusFilter(btn.dataset.filter))
  })

  // 더보기/접기 버튼
  document.getElementById('loadMoreButton').addEventListener('click', () => {
    state.visibleCount += 5
    renderDocumentList()
  })

  document.getElementById('collapseButton').addEventListener('click', () => {
    state.visibleCount = 5
    renderDocumentList()
  })

  // FAB 버튼
  document.getElementById('fabButton').addEventListener('click', openUploadSheet)

  // 상세 화면
  document.getElementById('backButton').addEventListener('click', closeDetailView)
  document.getElementById('reportButton').addEventListener('click', openReportEditor)

  // 업로드 시트
  document.getElementById('uploadArea').addEventListener('click', () => {
    document.getElementById('uploadFileInput').click()
  })
  document.getElementById('closeUploadSheet').addEventListener('click', closeUploadSheet)
  document.getElementById('uploadSheetOverlay').addEventListener('click', closeUploadSheet)
  document.getElementById('cancelUpload').addEventListener('click', closeUploadSheet)
  document.getElementById('submitUpload').addEventListener('click', submitUpload)

  // my-docs 즉시 업로드/변경 입력
  const myDocsQuickInput = document.getElementById('myDocsQuickFileInput')
  if (myDocsQuickInput) myDocsQuickInput.addEventListener('change', handleMyDocsQuickUpload)

  // Upload title input autocomplete for punch tab
  const uploadTitleInput = document.getElementById('uploadTitleInput')
  uploadTitleInput.addEventListener('input', handleUploadTitleInput)
  uploadTitleInput.addEventListener('focus', e => {
    // 내문서함 탭이면 드롭다운 표시 안 함
    if (state.activeTab !== 'my-docs') {
      showUploadSiteDropdown()
    }
  })
  uploadTitleInput.addEventListener('blur', () => {
    setTimeout(hideUploadSiteDropdown, 200)
  })

  // Preview modal controls
  document.getElementById('closePreview').addEventListener('click', closePreview)
  document.getElementById('previewModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePreview()
  })
  document.getElementById('previewZoomIn').addEventListener('click', handlePreviewZoomIn)
  document.getElementById('previewZoomOut').addEventListener('click', handlePreviewZoomOut)
  document.getElementById('previewTogglePan').addEventListener('click', togglePreviewPan)

  // Preview viewport pan and zoom events
  const previewViewport = document.getElementById('previewViewport')

  previewViewport.addEventListener('pointerdown', e => {
    if (!previewState.isPanning) return
    e.preventDefault()
    previewState.dragStart = {
      x: e.clientX - previewState.position.x,
      y: e.clientY - previewState.position.y,
    }
    previewViewport.setPointerCapture(e.pointerId)
  })

  previewViewport.addEventListener('pointermove', e => {
    if (!previewState.isPanning || !previewViewport.hasPointerCapture(e.pointerId)) return
    previewState.position = {
      x: e.clientX - previewState.dragStart.x,
      y: e.clientY - previewState.dragStart.y,
    }
    updatePreviewTransform()
  })

  previewViewport.addEventListener('pointerup', e => {
    if (previewState.isPanning) previewViewport.releasePointerCapture(e.pointerId)
  })

  previewViewport.addEventListener('wheel', e => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    previewState.zoom = Math.max(0.3, Math.min(3, previewState.zoom + delta))
    updatePreviewTransform()
  })

  // 이미지 미리보기
  document.getElementById('closePreview').addEventListener('click', closePreview)
  document.getElementById('previewModal').addEventListener('click', e => {
    if (e.target.id === 'previewModal') closePreview()
  })

  // 사진 업로드
  document.getElementById('photoBeforeInput').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const currentGroup = getCurrentGroup()
      if (currentGroup && currentGroup.files[0]) {
        currentGroup.files[0].url_before = event.target.result
        currentGroup.files[0].currentView = 'before'
        currentGroup.files[0].url = event.target.result
        renderDetailView()
      }
    }
    reader.readAsDataURL(file)
  })

  document.getElementById('photoAfterInput').addEventListener('change', e => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = event => {
      const currentGroup = getCurrentGroup()
      if (currentGroup && currentGroup.files[0]) {
        currentGroup.files[0].url_after = event.target.result
        currentGroup.files[0].currentView = 'after'
        currentGroup.files[0].url = event.target.result
        renderDetailView()
      }
    }
    reader.readAsDataURL(file)
  })

  // 배치 액션
  // 용량 최적화 함수: 이미지 압축
  async function optimizeImage(file) {
    return new Promise(resolve => {
      // 이미지가 아닌 경우 원본 반환
      if (!file.url || !file.url.startsWith('data:image')) {
        resolve(file)
        return
      }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // 최대 크기 제한 (1920x1920)
        let width = img.width
        let height = img.height
        const maxSize = 1920

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        // JPEG 품질 0.8로 압축
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve({ ...file, url: optimizedUrl })
      }

      img.onerror = () => resolve(file)
      img.src = file.url
    })
  }

  document.getElementById('batchDownload').addEventListener('click', async () => {
    const itemsToDownload = []

    if (state.selectedGroupId) {
      // Detail view: download selected files
      const currentGroup = getCurrentGroup()
      if (currentGroup) {
        currentGroup.files.forEach(f => {
          if (state.selectedIds.has(f.id)) {
            itemsToDownload.push(f)
          }
        })
      }
    } else {
      // List view: download all files from selected groups
      state.documents[state.activeTab].forEach(g => {
        if (state.selectedIds.has(g.id)) {
          itemsToDownload.push(...g.files)
        }
      })
    }

    if (itemsToDownload.length === 0) {
      alert('선택된 파일이 없습니다.')
      return
    }

    // 내문서함/회사서류/도면함/사진함 탭의 경우 용량 최적화 묶음 저장
    if (['my-docs', 'company-docs', 'drawings', 'photos', 'punch'].includes(state.activeTab)) {
      try {
        // 조치 탭의 경우 punchItems의 이미지도 수집
        if (state.activeTab === 'punch' && state.selectedGroupId) {
          const currentGroup = getCurrentGroup()
          if (currentGroup && currentGroup.punchItems) {
            currentGroup.punchItems.forEach((item, index) => {
              if (item.beforePhoto) {
                itemsToDownload.push({
                  id: `${item.id}_before`,
                  name: `${item.location || '위치미상'}_조치전_${index + 1}.jpg`,
                  url: item.beforePhoto,
                  type: 'img',
                })
              }
              if (item.afterPhoto) {
                itemsToDownload.push({
                  id: `${item.id}_after`,
                  name: `${item.location || '위치미상'}_조치후_${index + 1}.jpg`,
                  url: item.afterPhoto,
                  type: 'img',
                })
              }
            })
          }
        }

        if (itemsToDownload.length === 0) {
          alert('선택된 파일이 없습니다.')
          return
        }

        // 용량 최적화 진행
        const optimizedFiles = await Promise.all(itemsToDownload.map(file => optimizeImage(file)))

        // 묶음 저장 (순차적 다운로드)
        for (let i = 0; i < optimizedFiles.length; i++) {
          const file = optimizedFiles[i]
          await new Promise(resolve => {
            setTimeout(async () => {
              try {
                if (file.url && file.url.startsWith('data:')) {
                  const res = await fetch(file.url)
                  const blob = await res.blob()
                  const blobUrl = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = blobUrl
                  link.download = file.name || `file_${i + 1}`
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
                } else {
                  const link = document.createElement('a')
                  link.href = file.url
                  link.download = file.name || `file_${i + 1}`
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }
              } catch (error) {
                console.error('Download error:', error)
              }
              resolve()
            }, i * 200)
          })
        }

        alert(`${optimizedFiles.length}개 파일이 용량 최적화되어 저장되었습니다.`)
      } catch (error) {
        console.error('Optimization error:', error)
        alert('파일 저장 중 오류가 발생했습니다.')
      }
    } else {
      // 조치 탭은 기존 방식 유지
      itemsToDownload.forEach((file, index) => {
        setTimeout(() => {
          try {
            if (file.url && file.url.startsWith('data:')) {
              fetch(file.url)
                .then(res => res.blob())
                .then(blob => {
                  const blobUrl = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = blobUrl
                  link.download = file.name || `file_${index + 1}`
                  link.style.display = 'none'
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  setTimeout(() => URL.revokeObjectURL(blobUrl), 100)
                })
                .catch(err => console.error('Download error:', err))
            } else {
              const link = document.createElement('a')
              link.href = file.url
              link.download = file.name || `file_${index + 1}`
              link.style.display = 'none'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }
          } catch (error) {
            console.error('Download error:', error)
          }
        }, index * 200)
      })
    }

    state.selectedIds.clear()
    if (state.selectedGroupId) {
      renderDetailView()
    } else {
      renderDocumentList()
    }
    updateBatchBar()
  })

  document.getElementById('batchShare').addEventListener('click', async () => {
    // 모든 탭에 용량 최적화 묶음 공유 적용
    if (['my-docs', 'company-docs', 'drawings', 'photos', 'punch'].includes(state.activeTab)) {
      const itemsToShare = []

      if (state.selectedGroupId) {
        const currentGroup = getCurrentGroup()
        if (currentGroup) {
          currentGroup.files.forEach(f => {
            if (state.selectedIds.has(f.id)) {
              itemsToShare.push(f)
            }
          })

          // 조치 탭의 경우 punchItems의 이미지도 수집
          if (state.activeTab === 'punch' && currentGroup.punchItems) {
            currentGroup.punchItems.forEach((item, index) => {
              if (item.beforePhoto) {
                itemsToShare.push({
                  id: `${item.id}_before`,
                  name: `${item.location || '위치미상'}_조치전_${index + 1}.jpg`,
                  url: item.beforePhoto,
                  type: 'img',
                })
              }
              if (item.afterPhoto) {
                itemsToShare.push({
                  id: `${item.id}_after`,
                  name: `${item.location || '위치미상'}_조치후_${index + 1}.jpg`,
                  url: item.afterPhoto,
                  type: 'img',
                })
              }
            })
          }
        }
      } else {
        state.documents[state.activeTab].forEach(g => {
          if (state.selectedIds.has(g.id)) {
            itemsToShare.push(...g.files)
          }
        })
      }

      if (itemsToShare.length === 0) {
        alert('공유할 파일이 없습니다.')
        return
      }

      try {
        // 용량 최적화 진행
        const optimizedFiles = await Promise.all(itemsToShare.map(file => optimizeImage(file)))

        // 최적화된 파일들을 Blob 배열로 변환
        const fileBlobs = await Promise.all(
          optimizedFiles.map(async (file, index) => {
            if (file.url && file.url.startsWith('data:')) {
              const res = await fetch(file.url)
              const blob = await res.blob()
              return new File([blob], file.name || `file_${index + 1}.jpg`, {
                type: blob.type,
              })
            }
            return null
          })
        )

        const validFiles = fileBlobs.filter(f => f !== null)

        if (
          validFiles.length > 0 &&
          navigator.canShare &&
          navigator.canShare({ files: validFiles })
        ) {
          await navigator.share({
            title: 'INOPNC 파일 공유',
            text: `${validFiles.length}개의 최적화된 파일을 공유합니다.`,
            files: validFiles,
          })
          // 공유 성공 시에만 메시지 표시
          alert(`${validFiles.length}개 파일이 용량 최적화되어 공유되었습니다.`)
        } else {
          // 파일 공유를 지원하지 않는 경우 링크 공유
          try {
            await navigator.clipboard.writeText(window.location.href)
            alert('공유 링크가 클립보드에 복사되었습니다.')
          } catch (clipboardError) {
            console.error('Clipboard error:', clipboardError)
            alert('공유 기능을 사용할 수 없습니다. 브라우저 설정을 확인해주세요.')
          }
        }
      } catch (error) {
        console.error('Share error:', error)
        // 사용자가 공유를 취소한 경우는 조용히 처리
        if (error.name !== 'AbortError') {
          alert('공유 중 오류가 발생했습니다.')
        }
      } finally {
        // 항상 상태 초기화
        state.selectedIds.clear()
        if (state.selectedGroupId) {
          renderDetailView()
        } else {
          renderDocumentList()
        }
        updateBatchBar()
      }
      return // 조기 반환으로 중복 실행 방지
    } else {
      // 조치 탭은 기존 방식 유지
      const shareData = {
        title: 'INOPNC 공유',
        text: `${state.selectedIds.size}개의 항목을 공유합니다.`,
        url: window.location.href,
      }

      try {
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData)
          // 공유 성공 시에만 메시지 표시 (선택사항)
        } else {
          // 폴백: 클립보드 복사
          await navigator.clipboard.writeText(window.location.href)
          alert('공유 링크가 클립보드에 복사되었습니다.')
        }
      } catch (error) {
        console.error('Share error:', error)
        // 사용자가 공유를 취소한 경우는 조용히 처리
        if (error.name !== 'AbortError') {
          alert('공유 기능을 사용할 수 없습니다. 브라우저 설정을 확인해주세요.')
        }
      } finally {
        // 항상 상태 초기화
        state.selectedIds.clear()
        if (state.selectedGroupId) {
          renderDetailView()
        } else {
          renderDocumentList()
        }
        updateBatchBar()
      }
      return // 조기 반환으로 중복 실행 방지
    }

    state.selectedIds.clear()
    if (state.selectedGroupId) {
      renderDetailView()
    } else {
      renderDocumentList()
    }
    updateBatchBar()
  })

  document.getElementById('batchDelete').addEventListener('click', () => {
    if (confirm(`${state.selectedIds.size}개 항목을 삭제하시겠습니까?`)) {
      if (state.selectedGroupId) {
        // Detail view: delete selected files
        const currentGroup = getCurrentGroup()
        if (currentGroup) {
          currentGroup.files = currentGroup.files.filter(f => !state.selectedIds.has(f.id))
          if (currentGroup.files.length === 0) {
            // If no files left, delete the group
            state.documents[state.activeTab] = state.documents[state.activeTab].filter(
              g => g.id !== state.selectedGroupId
            )
            closeDetailView()
          } else {
            renderDetailView()
          }
        }
      } else {
        // List view: delete selected groups
        state.documents[state.activeTab] = state.documents[state.activeTab].filter(
          g => !state.selectedIds.has(g.id)
        )
      }
      state.selectedIds.clear()
      renderDocumentList()
      updateBatchBar()
      updatePunchSummary()
      alert('삭제가 완료되었습니다.')
    }
  })

  // 보고서 에디터 이벤트
  document.getElementById('closeReportEditor').addEventListener('click', closeReportEditor)
  document.getElementById('downloadReport').addEventListener('click', generateReportPDF)
  document.getElementById('shareReportControl').addEventListener('click', async () => {
    const currentGroup = getCurrentGroup()
    const siteName = currentGroup?.title || '현장'
    const shareData = {
      title: `${siteName} 펀치리스트 보고서`,
      text: `${siteName}의 펀치리스트 점검 보고서를 공유합니다.`,
      url: window.location.href,
    }

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Error sharing', error)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('공유 링크가 클립보드에 복사되었습니다.')
      } catch (err) {
        alert('공유 기능을 사용할 수 없습니다.')
      }
    }
  })
  document.getElementById('zoomIn').addEventListener('click', handleReportZoomIn)
  document.getElementById('zoomOut').addEventListener('click', handleReportZoomOut)
  document.getElementById('togglePan').addEventListener('click', toggleReportPan)

  // Site search input with autocomplete
  const siteSearchInput = document.getElementById('siteSearchInput')
  siteSearchInput.addEventListener('input', handleSiteSearchInput)
  siteSearchInput.addEventListener('focus', showSiteDropdown)
  siteSearchInput.addEventListener('blur', () => {
    setTimeout(hideSiteDropdown, 200)
  })

  function handleSiteSearchInput(e) {
    const value = e.target.value
    updateClearButton(e.target, document.getElementById('siteClearButton'))

    if (!value.trim()) {
      state.siteFilter = ''
      renderDocumentList()
      return
    }

    showSiteDropdown()
  }

  function showSiteDropdown() {
    const input = document.getElementById('siteSearchInput')
    const value = input.value.trim().toLowerCase()

    // Get all sites from REGION_SITES
    const allSites = getAllSites()
    const filtered = value
      ? allSites.filter(site => site.text.toLowerCase().includes(value))
      : allSites

    const dropdown = document.getElementById('siteDropdown')
    if (!dropdown) return

    if (filtered.length === 0) {
      dropdown.innerHTML =
        '<li style="padding: 14px 16px; text-align: center; color: var(--text-placeholder);">검색 결과가 없습니다</li>'
      dropdown.style.display = 'block'
      return
    }

    dropdown.innerHTML = filtered
      .map(
        site => `
    <li onclick="selectUploadSite('${site.text.replace(/'/g, "\\'")}')">${site.text}</li>
  `
      )
      .join('')

    dropdown.style.display = 'block'
  }

  // Toggle dropdown list when chevron is clicked
  window.toggleSiteDropdownList = function () {
    const dropdown = document.getElementById('siteDropdown')
    if (dropdown.style.display === 'block') {
      dropdown.style.display = 'none'
    } else {
      showSiteDropdown()
    }
  }

  function hideSiteDropdown() {
    const dropdown = document.getElementById('siteDropdown')
    if (dropdown) {
      dropdown.style.display = 'none'
    }
  }

  window.selectSite = function (siteName) {
    const input = document.getElementById('siteSearchInput')
    input.value = siteName
    state.siteFilter = siteName
    hideSiteDropdown()
    renderDocumentList()
  }

  // 업로드 시트 현장명 선택 함수 (원청사, 소속 표기 자동 연동)
  window.selectUploadSite = function (siteName) {
    const input = document.getElementById('uploadTitleInput')
    const allSites = getAllSites()
    const selectedSite = allSites.find(site => site.text === siteName)

    if (selectedSite) {
      // 원청사, 소속 표기 자동 연동
      const fullTitle = `${siteName} (${selectedSite.dept})`
      input.value = fullTitle
    } else {
      input.value = siteName
    }

    hideSiteDropdown()
  }

  document.getElementById('siteClearButton').addEventListener('click', () => {
    siteSearchInput.value = ''
    state.siteFilter = ''
    updateClearButton(siteSearchInput, document.getElementById('siteClearButton'))
    renderDocumentList()
  })

  document.getElementById('mainClearButton').addEventListener('click', () => {
    const mainInput = document.getElementById('mainSearchInput')
    mainInput.value = ''
    state.searchQuery = ''
    updateClearButton(mainInput, document.getElementById('mainClearButton'))
    renderDocumentList()
  })

  // @site.html 방식: 메인 검색 입력 필드 이벤트 효과 적용
  const mainSearchInput = document.getElementById('mainSearchInput')
  mainSearchInput.addEventListener('input', e => {
    const value = e.target.value
    state.searchQuery = value.toLowerCase()
    updateClearButton(e.target, document.getElementById('mainClearButton'))
    renderDocumentList()
  })

  mainSearchInput.addEventListener('focus', () => {
    // @site.html 방식: 포커스 시 드롭다운 표시 (필요시)
    updateClearButton(mainSearchInput, document.getElementById('mainClearButton'))
  })

  mainSearchInput.addEventListener('blur', () => {
    // @site.html 방식: 블러 시 지연 처리
    setTimeout(() => {
      updateClearButton(mainSearchInput, document.getElementById('mainClearButton'))
    }, 200)
  })

  // 보고서 에디터 패닝 이벤트
  const reportViewport = document.getElementById('reportViewport')
  const reportContent = document.getElementById('reportContent')

  reportViewport.addEventListener('pointerdown', e => {
    if (!state.isReportPanning) return
    e.preventDefault()
    state.reportDragStart = {
      x: e.clientX - state.reportPosition.x,
      y: e.clientY - state.reportPosition.y,
    }
    reportViewport.setPointerCapture(e.pointerId)
  })

  reportViewport.addEventListener('pointermove', e => {
    if (!state.isReportPanning || !reportViewport.hasPointerCapture(e.pointerId)) return
    state.reportPosition = {
      x: e.clientX - state.reportDragStart.x,
      y: e.clientY - state.reportDragStart.y,
    }
    updateReportTransform()
  })

  reportViewport.addEventListener('pointerup', e => {
    if (state.isReportPanning) reportViewport.releasePointerCapture(e.pointerId)
  })

  reportViewport.addEventListener('wheel', e => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    state.reportZoom = Math.max(0.3, Math.min(2, state.reportZoom + delta))
    updateReportTransform()
  })

  // PDF 다운로드 버튼 이벤트
  const downloadBtn = document.getElementById('downloadReport')
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      generateReportPDF() // A4 최적화 PDF 생성
    })
  }

  // 초기 렌더링
  handleTabChange('my-docs')
  lucide.createIcons()
})
