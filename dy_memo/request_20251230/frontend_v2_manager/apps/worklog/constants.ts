import { WorkLog } from '@inopnc/shared'

// Helper to get date string relative to today
const getDay = (diff: number) => {
  const d = new Date()
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export const MOCK_LOGS: WorkLog[] = [
  // Today's Work (Drafts - to be batch approved)
  {
    id: 1,
    site: '자이 아파트 101동',
    siteId: 'site1',
    date: getDay(0),
    updatedAt: `${getDay(0)} 17:30`,
    status: 'draft',
    affiliation: '본사',
    member: '101동 15층',
    process: '미장 작업',
    type: '내부 마감',
    location: '1501호',
    manpower: [
      { role: '기공', val: 1.0, worker: '이현수' },
      { role: '조공', val: 1.0, worker: '김철수' },
    ],
    materials: [{ name: '시멘트', qty: '3포', type: 'HQ' }],
    missing: ['확인서'],
    photos: [{ id: 101, url: 'https://picsum.photos/200/200?random=1', tag: '작업중' }],
    drawings: [],
    confirmationFiles: [],
    isPinned: true,
  },
  {
    id: 2,
    site: '자이 아파트 101동',
    siteId: 'site1',
    date: getDay(0),
    updatedAt: `${getDay(0)} 16:15`,
    status: 'draft',
    affiliation: '본사',
    member: '101동 15층',
    process: '타일 줄눈',
    type: '내부 마감',
    location: '1502호',
    manpower: [{ role: '타일공', val: 1.0, worker: '박영희' }],
    materials: [{ name: '백시멘트', qty: '1포', type: 'Worker' }],
    missing: ['사진', '도면'],
    photos: [],
    drawings: [],
    confirmationFiles: [],
  },
  {
    id: 3,
    site: '삼성 반도체 P3',
    siteId: 'site2',
    date: getDay(0),
    updatedAt: `${getDay(0)} 14:20`,
    status: 'draft',
    affiliation: '배관팀',
    member: 'P3 라인',
    process: '배관 용접',
    type: '설비',
    location: 'Zone A',
    manpower: [{ role: '용접사', val: 2.0, worker: '정민수' }],
    materials: [],
    missing: ['사진 1건'],
    photos: [],
    drawings: [],
    confirmationFiles: [],
  },

  // Yesterday (Rejected - needs correction and re-approval)
  {
    id: 4,
    site: '자이 아파트 101동',
    siteId: 'site1',
    date: getDay(-1),
    updatedAt: `${getDay(-1)} 09:10`,
    status: 'rejected',
    affiliation: '본사',
    member: '지하 주차장',
    process: '에폭시 코팅',
    type: '도장',
    location: 'B1 구역',
    manpower: [{ role: '도장공', val: 3.0, worker: '최지영' }],
    materials: [{ name: '에폭시 주제', qty: '10말', type: 'HQ' }],
    rejectReason: '시공 사진이 너무 어둡습니다. 재촬영 후 등록바랍니다.',
    photos: [{ id: 201, url: 'https://picsum.photos/200/200?random=2', tag: '시공후' }],
    drawings: [],
    confirmationFiles: [],
  },
  {
    id: 5,
    site: '삼성 반도체 P3',
    siteId: 'site2',
    date: getDay(-1),
    updatedAt: `${getDay(-1)} 11:45`,
    status: 'rejected',
    affiliation: '전기팀',
    member: 'EPS실',
    process: '트레이 설치',
    type: '전기',
    location: '3층',
    manpower: [{ role: '전공', val: 1.0, worker: '오지호' }],
    materials: [],
    rejectReason: '출력 인원 공수 산정 오류 (0.5 -> 1.0 확인 요망)',
    photos: [{ id: 202, url: 'https://picsum.photos/200/200?random=3', tag: '설치중' }],
    drawings: [{ id: 301, url: 'https://picsum.photos/200/200?random=4', tag: '도면' }],
    confirmationFiles: [],
  },

  // 2 Days Ago (Approved - Reference for Copying)
  {
    id: 6,
    site: '힐스테이트 센트럴',
    siteId: 'site3',
    date: getDay(-2),
    updatedAt: `${getDay(-2)} 18:00`,
    status: 'approved',
    affiliation: '토목팀',
    member: '단지 내 도로',
    process: '보도블럭',
    type: '토목',
    location: '정문',
    manpower: [{ role: '조경공', val: 4.0, worker: '홍길동' }],
    materials: [{ name: '모래', qty: '1루베', type: 'HQ' }],
    missing: [],
    photos: [{ id: 401, url: 'https://picsum.photos/200/200?random=5', tag: '완료' }],
    drawings: [],
    confirmationFiles: [
      {
        name: '작업확인서.pdf',
        size: 1024500,
        url: '#',
        type: 'application/pdf',
        uploadedAt: getDay(-2),
      },
    ],
  },
  {
    id: 7,
    site: '자이 아파트 101동',
    siteId: 'site1',
    date: getDay(-2),
    updatedAt: `${getDay(-2)} 17:50`,
    status: 'approved',
    affiliation: '본사',
    member: '101동 14층',
    process: '미장 작업',
    type: '내부 마감',
    location: '1401호',
    manpower: [
      { role: '기공', val: 1.0, worker: '이현수' },
      { role: '조공', val: 1.0, worker: '김철수' },
    ],
    materials: [{ name: '시멘트', qty: '3포', type: 'HQ' }],
    missing: [],
    photos: [{ id: 402, url: 'https://picsum.photos/200/200?random=6', tag: '완료' }],
    drawings: [],
    confirmationFiles: [],
  },
]

export const SITE_OPTIONS = [
  { id: 'site1', name: '자이 아파트 101동', region: '수도권', dept: 'HQ' },
  { id: 'site2', name: '삼성 반도체 P3', region: '수도권', dept: 'HQ' },
  { id: 'site3', name: '힐스테이트 센트럴', region: '수도권', dept: 'HQ' },
  { id: 'site4', name: '대전 테크노밸리', region: '충청권', dept: 'HQ' },
  { id: 'site5', name: '청주 산업단지', region: '충청권', dept: 'HQ' },
  { id: 'site6', name: '광주 첨단단지', region: '전라권', dept: 'HQ' },
  { id: 'site7', name: '전주 혁신도시', region: '전라권', dept: 'HQ' },
  { id: 'site8', name: '부산 해운대', region: '경상권', dept: 'HQ' },
  { id: 'site9', name: '울산 산업단지', region: '경상권', dept: 'HQ' },
  { id: 'site10', name: '대구 첨단단지', region: '경상권', dept: 'HQ' },
  { id: 'site11', name: '강릉 관광단지', region: '강원권', dept: 'HQ' },
  { id: 'site12', name: '기타 현장', region: '기타', dept: 'HQ' },
]

export const REGION_SITES = {
  서울: [
    { value: 'S01', text: '강남 아파트 현장', dept: 'HQ' },
    { value: 'S02', text: '성수동 오피스 현장', dept: 'HQ' },
  ],
  경기: [
    { value: 'G01', text: '분당 테크노밸리', dept: 'HQ' },
    { value: 'G02', text: '판교 신도시', dept: 'HQ' },
  ],
  충청: [
    { value: 'C01', text: '대전 산업단지', dept: 'HQ' },
    { value: 'C02', text: '청주 혁신도시', dept: 'HQ' },
  ],
  전라: [
    { value: 'J01', text: '광주 첨단단지', dept: 'HQ' },
    { value: 'J02', text: '전주 복합단지', dept: 'HQ' },
  ],
  경상: [
    { value: 'K01', text: '부산 해운대', dept: 'HQ' },
    { value: 'K02', text: '울산 공단', dept: 'HQ' },
  ],
  강원: [
    { value: 'K3', text: '강릉 리조트', dept: 'HQ' },
    { value: 'K4', text: '춘천 레저타운', dept: 'HQ' },
  ],
}

export const PREDEFINED_WORKERS = ['이현수', '김철수', '박영희', '정민수', '최지영']
export const MEMBER_CHIPS = ['보', '기둥', '슬래브', '벽체', '기타']
export const PROCESS_CHIPS = ['균열주입', '표면처리', '치핑', '보수', '기타']
export const TYPE_CHIPS = ['보수', '보강', '점검', '시공', '기타']
