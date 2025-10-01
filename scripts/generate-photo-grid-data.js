#!/usr/bin/env node

/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs')
const path = require('path')

// 랜덤 데이터 풀
const DATA_POOL = {
  부재명: ['슬라브', '기둥', '보', '벽체', '계단', '발코니', '지붕', '난간', '창호', '문'],
  작업공간: [
    '지하1층',
    '지하2층',
    '1층',
    '2층',
    '3층',
    '4층',
    '5층',
    '지붕',
    '기계실',
    '전기실',
    '화장실',
    '계단실',
  ],
  작업구간: [
    'A구역',
    'B구역',
    'C구역',
    'D구역',
    '동측',
    '서측',
    '남측',
    '북측',
    '중앙부',
    '모서리부',
  ],
  작업내용: [
    '균열보수',
    '방수작업',
    '타일시공',
    '페인트작업',
    '철근배근',
    '콘크리트타설',
    '거푸집설치',
    '단열재시공',
    '방화재시공',
    '마감작업',
  ],
  시공업체: [
    '대한건설',
    '삼성건설',
    '현대건설',
    '롯데건설',
    'GS건설',
    '두산건설',
    '포스코건설',
    'SK건설',
    '한화건설',
    '태영건설',
  ],
  작업자: [
    '김현수',
    '이민호',
    '박지영',
    '정수연',
    '최동욱',
    '한소영',
    '임재현',
    '송미경',
    '윤태호',
    '장혜진',
  ],
}

// 현장 ID 풀
const SITE_IDS = [
  '55386936-56b0-465e-bcc2-8313db735ca9', // 강남 A현장
  '7160ea44-b7f6-43d1-a4a2-a3905d5da9d2', // 삼성전자 평택캠퍼스 P3
  '11111111-1111-1111-1111-111111111111', // 안산시청
]

// 랜덤 선택 함수
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

// 랜덤 날짜 생성 (최근 30일 내)
function randomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

// 사진대지 메타데이터 생성
function generatePhotoGridMetadata(photoIndex) {
  const 부재명 = randomChoice(DATA_POOL.부재명)
  const 작업공간 = randomChoice(DATA_POOL.작업공간)
  const 작업구간 = randomChoice(DATA_POOL.작업구간)
  const 작업내용 = randomChoice(DATA_POOL.작업내용)
  const 시공업체 = randomChoice(DATA_POOL.시공업체)
  const 작업자 = randomChoice(DATA_POOL.작업자)
  const 작업일 = randomDate()
  const siteId = randomChoice(SITE_IDS)

  return {
    id: `pg_${Date.now()}_${photoIndex}`,
    title: `사진대지_${부재명}_${작업구간}_${작업일}`,
    category_type: 'photo_grid',
    status: 'active',
    site_id: siteId,
    metadata: {
      부재명,
      작업공간,
      작업구간,
      작업내용,
      시공업체,
      작업자,
      작업일,
      before_photo: `dy${String(photoIndex).padStart(3, '0')}_Before.png`,
      after_photo: `dy${String(photoIndex).padStart(3, '0')}_After.png`,
      생성일시: new Date().toISOString(),
      품질등급: randomChoice(['A', 'B', 'C']),
      안전등급: randomChoice(['양호', '보통', '주의']),
      진행률: Math.floor(Math.random() * 100) + 1,
    },
    description: `${작업공간} ${부재명} ${작업내용} 완료 - ${작업자} 담당`,
    file_name: `사진대지_${부재명}_${작업구간}_${작업일}.pdf`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// 10개 사진대지 메타데이터 생성
function generateAllPhotoGrids() {
  const photoGrids = []

  for (let i = 1; i <= 10; i++) {
    photoGrids.push(generatePhotoGridMetadata(i))
  }

  return photoGrids
}

// 메인 실행
function main() {
  console.log('🚀 사진대지 메타데이터 생성 시작...')

  const photoGrids = generateAllPhotoGrids()

  // 결과를 JSON 파일로 저장
  const outputPath = path.join(__dirname, 'photo-grid-metadata.json')
  fs.writeFileSync(outputPath, JSON.stringify(photoGrids, null, 2), 'utf8')

  console.log(`✅ ${photoGrids.length}개 사진대지 메타데이터 생성 완료`)
  console.log(`📁 저장 경로: ${outputPath}`)

  // 각 사진대지 정보 출력
  photoGrids.forEach((grid, index) => {
    console.log(`\n📋 사진대지 ${index + 1}:`)
    console.log(`   제목: ${grid.title}`)
    console.log(
      `   부재: ${grid.metadata.부재명} | 공간: ${grid.metadata.작업공간} | 구간: ${grid.metadata.작업구간}`
    )
    console.log(
      `   작업: ${grid.metadata.작업내용} | 업체: ${grid.metadata.시공업체} | 담당: ${grid.metadata.작업자}`
    )
    console.log(`   사진: ${grid.metadata.before_photo} → ${grid.metadata.after_photo}`)
  })

  return photoGrids
}

// 스크립트 실행
if (require.main === module) {
  main()
}

module.exports = { generatePhotoGridMetadata, generateAllPhotoGrids }
