// Centralized UI strings and simple lookup helper
// Korean defaults; extendable to multi-language later.

type Dictionary = Record<string, string | Dictionary>

const ko: Dictionary = {
  common: {
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    edit: '수정',
    add: '추가',
    create: '생성',
    new: '신규',
    register: '등록',
    search: '검색',
    filter: '필터',
    apply: '적용',
    reset: '초기화',
    confirm: '확인',
    close: '닫기',
    details: '상세',
    list: '목록',
    export: '내보내기',
    import: '가져오기',
    download: '다운로드',
    upload: '업로드',
    approve: '승인',
    reject: '반려',
    submit: '제출',
    assign: '할당',
    unassign: '해제',
    complete: '완료',
    start: '시작',
    stop: '중지',
    pause: '일시중지',
    resume: '재개',
    print: '인쇄',
    refresh: '새로고침',
    sync: '동기화',
    remove: '제거',
    duplicate: '복제',
    copy: '복사',
    paste: '붙여넣기',
    cut: '잘라내기',
    prev: '이전',
    next: '다음',
    back: '뒤로',
    logout: '로그아웃',
  },
  admin: {
    dashboard: '관리자 대시보드',
    accountSettings: '계정 설정',
    notifications: '알림',
    searchPlaceholder: '검색…',
    toggleSidebarOpen: '사이드바 펼치기',
    toggleSidebarClose: '사이드바 접기',
  },
  commonExtra: {
    unassigned: '미지정',
    unknown: '미정',
  },
  users: {
    title: '사용자 관리',
    subtitle: '시스템에 등록된 사용자 계정과 역할을 조회할 수 있습니다.',
    invitePlanned: '사용자 초대 예정',
    searchPlaceholder: '이름, 이메일 검색',
    roleFilter: '역할 필터',
    statusFilter: '상태 필터',
    empty: '조건에 맞는 사용자가 없습니다.',
    stats: {
      total: '전체 사용자',
    },
    filters: {
      roleSelected: '선택된 역할',
      statusSelected: '선택된 상태',
    },
    errors: {
      fetchList: '목록을 불러오는 중 문제가 발생했습니다.',
      fetchUsers: '사용자 목록을 불러오지 못했습니다.',
      fetchUser: '사용자 정보를 불러오지 못했습니다.',
    },
    noName: '이름 미등록',
    table: {
      user: '사용자',
      role: '역할',
      organization: '조직',
      status: '상태',
      lastActivity: '최근 활동',
      details: '상세',
    },
  },
  sites: {
    title: '현장 관리',
    subtitle: '진행 중인 현장과 담당자 배정을 관리합니다.',
    create: '현장 등록',
    searchPlaceholder: '현장명, 주소 검색',
    statusFilter: '상태 필터',
    empty: '조건에 맞는 현장이 없습니다.',
    stats: {
      total: '전체 현장',
      activeOnPage: '활성 현장 (현재 페이지)',
    },
    errors: {
      fetchList: '목록을 불러오는 중 문제가 발생했습니다.',
      fetchSites: '현장 목록을 불러오지 못했습니다.',
    },
    table: {
      name: '현장명',
      status: '상태',
      period: '기간',
      manager: '관리자',
      phone: '연락처',
      dailyReports: '작업일지 수',
      totalLabor: '총공수',
      details: '상세',
    },
  },
}

// Current locale: ko (can be made dynamic later)
const dict = ko

export function t(key: string, fallback?: string): string {
  const parts = key.split('.')
  let node: unknown = dict
  for (const p of parts) {
    if (typeof node === 'object' && node !== null && p in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[p]
    } else {
      return fallback ?? key
    }
  }
  return typeof node === 'string' ? node : (fallback ?? key)
}

export const strings = { t }
