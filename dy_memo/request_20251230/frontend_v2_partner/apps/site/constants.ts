import { Site } from '@inopnc/shared/types'

export const INITIAL_SITES: Site[] = [
  {
    id: 1,
    pinned: true,
    status: 'ing',
    affil: '대구지사',
    name: '자이 아파트 101동 신축공사',
    addr: '대구광역시 동구 동부로 149',
    days: 245,
    mp: 3,
    manager: '이현수 소장',
    safety: '김안전 과장',
    phoneM: '010-1234-5678',
    phoneS: '010-9876-5432',
    lodge: '동구 비즈니스 호텔 304호',
    note: '',
    lastDate: '2025-12-09',
    lastTime: '10:30',
    drawings: {
      construction: [
        {
          name: '101동 평면도.png',
          type: 'img',
          url: 'https://picsum.photos/800/600',
          createdAt: '2025-12-01',
        },
      ],
      progress: [],
      completion: [],
    },
    ptw: {
      title: '작업허가서(PTW)',
      status: '승인완료',
      date: '2025.07.07',
      company: '이노피앤씨',
      department: 'H서비스 남부팀 광주지점',
      period: '2025. 07. 09 ~ 12',
      location: '지하주차장 일원',
      writer: '김재형',
      phone: '010-1234-5678',
      workType: '균열보수',
      workContent: '지하주차장 균열 누수 보수',
      teamLeader: '김재형',
      equipment: '고소작업대(시저형) 1대',
      workers: '3명',
      safety: '안전화, 안전모, 각반, 안전띠',
      requirements: '관리감독자 상주, TBM실시',
      weather: '지하주차장 실내 작업',
      safetyManagerName: '노동연',
      risks: [
        {
          work: '고소작업대 작업',
          risk: '작업자 추락',
          level: '상',
          measure: '근로자 안전고리 착용',
        },
        {
          work: '고소작업대 작업',
          risk: '작업자 협착',
          level: '중',
          measure: '작업대 이동 시 탑승 금지 및 신호수 통제',
        },
        {
          work: '고소작업대 작업',
          risk: '고소작업대 전도',
          level: '중',
          measure: '작업구획 이동 시 바닥상태 확인 후 경사지 이동 지양',
        },
      ],
    },
    workLog: {
      title: '작업 완료 보고서',
      status: '작성완료',
      docNumber: 'WR-20250421-1',
      date: '2025-04-21',
      weather: '-',
      temp: '-',
      workers: { total: 3, manager: 0, engineer: 0, worker: 3 },
      materials: [
        { name: '에폭시 주제/경화제', unit: 'set', quantity: 2, note: '본사' },
        { name: '퍼티', unit: 'kg', quantity: 5, note: '본사' },
      ],
      workContent: '지하주차장 PC부재 균열보수 완료\n주변 정리정돈 완료',
      issues: '특이사항 없음',
      nextPlan: '-',
      inspector: '이현수',
      safetyOfficer: '김안전',
    },
    images: [
      {
        src: 'https://picsum.photos/600/400?random=1',
        member: '지하주차장 PC부재',
        process: '균열보수',
        content: '보수전',
      },
      {
        src: 'https://picsum.photos/600/400?random=2',
        member: '지하주차장 PC부재',
        process: '균열보수',
        content: '보수후 (완료)',
      },
      {
        src: 'https://picsum.photos/600/400?random=3',
        member: '지하주차장 PC부재',
        process: '균열보수',
        content: '보수전',
      },
      {
        src: 'https://picsum.photos/600/400?random=4',
        member: '지하주차장 PC부재',
        process: '균열보수',
        content: '보수후 (완료)',
      },
    ],
    doc: { title: '안전 점검표', status: '제출완료', content: '점검 완료' },
    punch: {
      title: '펀치리스트 점검 보고서',
      status: '미조치',
      list: [
        {
          no: 'P-01',
          loc: '1층 로비',
          issue: '천장 페인트 오염',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-02',
          loc: '101호 입구',
          issue: '타일 파손 교체 요망',
          before: '',
          after: '',
          status: '완료',
        },
        {
          no: 'P-03',
          loc: '101호 거실',
          issue: '걸레받이 들뜸 시공 불량',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-04',
          loc: '공용부 복도',
          issue: '비상구 유도등 미점등',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-05',
          loc: '주차장 B1',
          issue: '트렌치 커버 소음 발생',
          before: '',
          after: '',
          status: '완료',
        },
      ],
      content: '총 5건의 지적사항 중 2건 조치완료, 3건 미조치 상태입니다.',
    },
    isLocal: false,
  },
  {
    id: 8,
    pinned: true,
    status: 'ing',
    affil: '본사',
    name: '테스트 현장 8구역',
    addr: '서울시 강남구 역삼동 88',
    days: 20,
    mp: 5,
    manager: '박소장',
    safety: '이안전',
    phoneM: '010-8888-8888',
    phoneS: '010-9999-9999',
    lodge: '역삼 호텔 202호',
    note: '',
    lastDate: '2025-12-08',
    lastTime: '14:00',
    drawings: { construction: [], progress: [], completion: [] },
    ptw: null,
    workLog: null,
    doc: null,
    punch: {
      title: '펀치리스트 점검 보고서',
      status: '진행중',
      list: [
        {
          no: 'P-01',
          loc: '1층 로비',
          issue: '천장 페인트 오염',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-02',
          loc: '101호 입구',
          issue: '타일 파손 교체 요망',
          before: '',
          after: '',
          status: '완료',
        },
        {
          no: 'P-03',
          loc: '101호 거실',
          issue: '걸레받이 들뜸 시공 불량',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-04',
          loc: '공용부 복도',
          issue: '비상구 유도등 미점등',
          before: '',
          after: '',
          status: '미조치',
        },
        {
          no: 'P-05',
          loc: '주차장 B1',
          issue: '트렌치 커버 소음 발생',
          before: '',
          after: '',
          status: '완료',
        },
      ],
      content: '주요 하자 사항 점검 완료.',
    },
    images: [],
    isLocal: false,
  },
]

// Add mock sites
for (let i = 2; i <= 7; i++) {
  if (i !== 8) {
    INITIAL_SITES.push({
      id: i,
      pinned: false,
      status: i % 2 === 0 ? 'done' : 'wait',
      affil: '본사',
      name: `테스트 현장 ${i}구역`,
      addr: `서울시 강남구 ${i}번지`,
      days: 10 + i,
      mp: 0,
      manager: `관리자${i}`,
      safety: `안전${i}`,
      phoneM: '010-0000-0000',
      phoneS: '010-0000-0000',
      lodge: '-',
      note: '-',
      lastDate: '2025-12-01',
      lastTime: '09:00',
      drawings: { construction: [], progress: [], completion: [] },
      ptw: null,
      workLog: null,
      doc: null,
      punch: null,
      images: [],
      isLocal: false,
    })
  }
}

export const WEATHER_DATA: Record<string, { text: string; icon: any }> = {
  서울: { text: '흐림 21°C', icon: 'cloud' },
  경기: { text: '비 19°C', icon: 'cloud-rain' },
  부산: { text: '맑음 24°C', icon: 'sun' },
  대구: { text: '맑음 27°C', icon: 'sun' },
}

export const DEFAULT_WEATHER = { text: '맑음 20°C', icon: 'sun' }

export const A3_SAMPLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="850" height="600" viewBox="0 0 850 600">
  <rect width="850" height="600" fill="#ffffff"/>
  <rect x="12" y="12" width="826" height="576" fill="none" stroke="#1a254f" stroke-width="6"/>
  <rect x="40" y="120" width="770" height="420" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
  <g stroke="#94a3b8" stroke-width="1">
    <line x1="40" y1="180" x2="810" y2="180"/>
    <line x1="40" y1="240" x2="810" y2="240"/>
    <line x1="40" y1="300" x2="810" y2="300"/>
    <line x1="40" y1="360" x2="810" y2="360"/>
    <line x1="40" y1="420" x2="810" y2="420"/>
    <line x1="40" y1="480" x2="810" y2="480"/>
    <line x1="120" y1="120" x2="120" y2="540"/>
    <line x1="200" y1="120" x2="200" y2="540"/>
    <line x1="280" y1="120" x2="280" y2="540"/>
    <line x1="360" y1="120" x2="360" y2="540"/>
    <line x1="440" y1="120" x2="440" y2="540"/>
    <line x1="520" y1="120" x2="520" y2="540"/>
    <line x1="600" y1="120" x2="600" y2="540"/>
    <line x1="680" y1="120" x2="680" y2="540"/>
    <line x1="760" y1="120" x2="760" y2="540"/>
  </g>
  <text x="425" y="78" font-family="Pretendard, sans-serif" font-size="34" font-weight="800" fill="#1a254f" text-anchor="middle">A3 가로형 예시 도면</text>
  <text x="425" y="102" font-family="Pretendard, sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">모바일 화면에 맞춰 자동 배율 적용</text>
  <text x="65" y="565" font-family="Pretendard, sans-serif" font-size="12" fill="#64748b">INOPNC • SAMPLE DRAWING</text>
</svg>`
