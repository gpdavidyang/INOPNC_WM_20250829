import { Site } from './types'

export const REGION_SITES: Record<string, Site[]> = {
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

export const PREDEFINED_WORKERS = ['이현수', '김철수', '박영희', '정민수', '최지영']

export const MEMBER_CHIPS = ['슬라브', '거더', '기둥', '기타']
export const PROCESS_CHIPS = ['균열', '면', '마감', '기타']
export const TYPE_CHIPS = ['지하', '지상', '지붕', '기타']
