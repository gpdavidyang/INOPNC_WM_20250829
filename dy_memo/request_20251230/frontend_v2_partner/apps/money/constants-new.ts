import { PartnerCalendarMap, SalaryHistoryItem } from './types'

export const CALENDAR_DATA: PartnerCalendarMap = {
  '2025-12-01': { amt: '220,000', site: '자이 아파트', man: '4', note: '타워크레인 설치 지원' },
  '2025-12-02': {
    amt: '110,000',
    site: '삼성 반도체',
    man: '2',
    note: '야간 작업, 출입증 확인 필수',
  },
  '2025-12-03': { amt: '220,000', site: '자이 아파트', man: '5', note: '지하 주차장 배관 작업' },
  '2025-12-04': { amt: '330,000', site: '자이 아파트', man: '8', note: '비계 점검 및 추가 설치' },
  '2025-12-05': { amt: '220,000', site: '푸르지오', man: '3', note: '동별 세대 점검 (샘플)' },
  '2025-12-07': { amt: '150,000', site: '힐스테이트', man: '2', note: '안전 교육' },
  '2025-12-09': { amt: '220,000', site: '삼성 반도체', man: '4', note: '배관 작업' },
}

export const SALARY_HISTORY: SalaryHistoryItem[] = [
  { rawDate: '2025-11', month: '2025년 11월', baseTotal: 4700000, man: 22.0, price: 213636 },
  { rawDate: '2025-10', month: '2025년 10월', baseTotal: 2300000, man: 10.0, price: 230000 },
]

export const SITES = ['자이 아파트', '삼성 반도체', '푸르지오', '힐스테이트']
