# NPC-1000 관리 시스템 연동 검증 및 개선 계획서

## 📄 문서 정보
- **작성일**: 2025-09-10
- **버전**: 1.0
- **상태**: 계획 수립 완료
- **목표**: 현장-본사 간 NPC-1000 자재 관리 seamless 연동 구현

---

## 📋 현재 상태 분석

### ✅ 잘 구현된 부분

#### 1. 작업자/현장관리자 화면 (Site Info)
- **경로**: `/dashboard/site-info`
- **기능**:
  - NPC-1000 관리 탭 존재
  - `/dashboard/site-info/npc1000-request` → 자재 요청 페이지
  - `/dashboard/site-info/npc1000-usage` → 입고/사용량 기록 페이지
  - 현장별 재고 조회 및 실시간 업데이트
  - 음수 재고 경고 시스템

#### 2. 본사 관리자 화면 기본 구조
- **경로**: `/dashboard/admin/materials`
- **기능**:
  - 4개 탭 UI 존재: 사용재고관리, 생산관리, 출고관리, 출고요청관리
  - 전체 현장 통합 관리 인터페이스 구조

#### 3. API 연동 구조 (부분적 구현)
- `createMaterialRequest()` - 자재 요청 생성
- `recordInventoryTransaction()` - 입고/사용 기록
- `getNPCMaterialsData()` - 현장별 자재 데이터 조회
- 실시간 재고 계산 로직

### ❌ 미흡한 부분

#### 1. 데이터베이스 스키마 불완전
- `material_requests`, `material_transactions`, `material_inventory` 테이블이 database.ts에 정의되지 않음
- 생산 기록, 출고 기록 관련 테이블 부족
- 타입 정의와 실제 DB 스키마 간 불일치 가능성

#### 2. 생산관리 기능 미구현
- 본사에서 NPC-1000 생산량 입력 기능 없음
- 일자별 생산 기록 및 누적 생산량 관리 부족
- 생산 계획 vs 실적 비교 기능 없음
- 생산 단가 및 비용 관리 기능 없음

#### 3. 출고관리 기능 미구현
- 본사에서 현장별 출고 처리 기능 없음
- 출고 기록, 배송 추적, 입고 확인 프로세스 없음
- 출고 후 재고 자동 차감 기능 없음
- 배송 상태 추적 및 알림 기능 부족

#### 4. 시스템 연동 이슈
- 생산/출고 입력 시 전체 시스템 재고 실시간 반영 부족
- 현장-본사 간 실시간 동기화 메커니즘 부족
- 동시성 제어 및 데이터 일관성 보장 부족

---

## 🔧 개선 계획

### Phase 1: 데이터베이스 스키마 완성 (예상 소요시간: 1-2주)

#### 1.1 테이블 구조 설계
```sql
-- 생산 기록 테이블
CREATE TABLE production_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_date DATE NOT NULL,
  quantity_produced DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 출고 기록 테이블  
CREATE TABLE shipment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_date DATE NOT NULL,
  site_id UUID REFERENCES sites(id),
  quantity_shipped DECIMAL(10,2) NOT NULL,
  planned_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(20) DEFAULT 'preparing', -- preparing, shipped, delivered, cancelled
  tracking_number VARCHAR(100),
  carrier VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 통합 재고 테이블 보완
CREATE TABLE material_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES sites(id), -- NULL for headquarters
  material_id UUID REFERENCES materials(id),
  current_stock DECIMAL(10,2) DEFAULT 0,
  reserved_stock DECIMAL(10,2) DEFAULT 0,
  available_stock DECIMAL(10,2) GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  minimum_threshold DECIMAL(10,2) DEFAULT 10,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(site_id, material_id)
);
```

#### 1.2 관계형 제약조건 및 인덱스
- **외래키 제약조건**: 데이터 무결성 보장
- **인덱스 최적화**: 날짜별, 현장별 조회 성능 향상
- **RLS 정책**: 현장별 데이터 접근 권한 제어
- **트리거**: 재고 자동 업데이트 및 이력 관리

#### 1.3 타입 정의 업데이트
- `types/database.ts` 업데이트
- `types/materials.ts` 확장
- API 응답 타입 정의

### Phase 2: 본사 생산관리 기능 구현 (예상 소요시간: 2주)

#### 2.1 생산 입력 인터페이스
**구현 파일**: `components/admin/materials/tabs/ProductionManagementTab.tsx`

**기능 구현**:
- 일자별 NPC-1000 생산량 입력 폼
- 생산 단가, 총 비용 자동 계산
- 생산 메모 및 품질 정보 기록
- 생산 계획 대비 실적 입력
- 벌크 생산 기록 입력 (CSV 업로드)

#### 2.2 생산 현황 대시보드
**구현 내용**:
- 일/월/년 생산량 차트 (Chart.js/Recharts)
- 생산 계획 대비 실적 비교 그래프
- 생산 효율성 지표 (시간당 생산량, 목표 달성률)
- 생산 비용 분석 (원가 절감 추이)
- 생산량 예측 모델

#### 2.3 생산 API 개발
**구현 파일**: `app/actions/admin/production.ts`

```typescript
// 생산 기록 생성
export async function createProductionRecord(data: {
  production_date: string
  quantity_produced: number
  unit_cost?: number
  notes?: string
})

// 생산 기록 수정
export async function updateProductionRecord(id: string, updates: Partial<ProductionRecord>)

// 생산 이력 조회
export async function getProductionHistory(filters: {
  start_date?: string
  end_date?: string
  limit?: number
})

// 생산 분석 데이터
export async function getProductionAnalytics(period: 'week' | 'month' | 'year')
```

### Phase 3: 본사 출고관리 기능 구현 (예상 소요시간: 2주)

#### 3.1 출고 처리 인터페이스
**구현 파일**: `components/admin/materials/tabs/ShipmentManagementTab.tsx`

**기능 구현**:
- 현장별 출고 요청 목록 조회 및 필터링
- 출고 승인 및 출고량 입력/수정
- 배송 정보 입력 (운송사, 트래킹 번호, 예정일)
- 출고 상태 관리 (준비중→출고완료→배송중→입고완료)
- 긴급 출고 처리 워크플로우

#### 3.2 출고 현황 관리
**기능 구현**:
- 출고 진행 상태 실시간 추적
- 현장별 출고 이력 및 통계
- 배송 지연 알림 및 예외 상황 관리
- 미처리 출고 요청 우선순위 관리
- 출고 성과 분석 (배송 시간, 정확도 등)

#### 3.3 출고 API 개발
**구현 파일**: `app/actions/admin/shipments.ts`

```typescript
// 출고 처리
export async function processShipment(data: {
  request_id: string
  quantity_shipped: number
  planned_delivery_date: string
  tracking_number?: string
  carrier?: string
})

// 출고 상태 업데이트
export async function updateShipmentStatus(id: string, status: ShipmentStatus)

// 출고 이력 조회
export async function getShipmentHistory(site_id?: string, filters?: ShipmentFilters)

// 배송 추적
export async function trackDelivery(tracking_number: string)
```

### Phase 4: 통합 재고 관리 시스템 (예상 소요시간: 1-2주)

#### 4.1 실시간 재고 계산 로직
**구현 내용**:
```typescript
// 재고 흐름 자동화
생산량 입력 → 본사 재고 증가 (production_records → material_inventory)
출고 처리 → 본사 재고 감소, 현장 재고 예약 (shipment_records → material_inventory)
현장 입고 확인 → 현장 재고 실제 증가 (material_transactions → material_inventory)
현장 사용 → 현장 재고 감소 (material_transactions → material_inventory)
```

#### 4.2 재고 흐름 추적 시스템
**시스템 아키텍처**:
```
[생산입력] → [본사창고] → [출고승인] → [배송중] → [현장입고] → [현장사용]
     ↓         ↓           ↓          ↓         ↓          ↓
  +재고      저장        -재고      추적      +재고      -재고
```

#### 4.3 자동 알림 시스템
**구현 파일**: `lib/notifications/material-alerts.ts`

**알림 종류**:
- 본사 재고 부족 시 생산 필요 알림
- 현장 재고 부족 시 출고 필요 알림
- 배송 지연 시 자동 알림
- 재고 임계치 도달 알림
- 일일/주간 재고 현황 리포트

### Phase 5: UI/UX 완성 (예상 소요시간: 1주)

#### 5.1 본사 관리자 대시보드 완성
**생산관리 탭**:
- 생산 입력 폼 (일자별/벌크)
- 생산 현황 차트 및 지표
- 생산 계획 vs 실적 비교
- 생산 비용 분석

**출고관리 탭**:
- 출고 요청 처리 대시보드
- 배송 상태 추적 맵
- 출고 이력 및 성과 분석
- 배송업체 관리

**통합 재고 현황**:
- 본사 + 전체현장 재고 실시간 모니터링
- 재고 흐름 시각화 (Sankey diagram)
- 재고 회전율 및 효율성 지표

#### 5.2 현장 사용자 인터페이스 개선
**기능 개선**:
- 출고 요청 상태 실시간 표시
- 배송 추적 정보 조회
- 입고 확인 체크리스트
- 모바일 최적화 (터치 인터페이스)

### Phase 6: 성능 최적화 및 안정성 (예상 소요시간: 1주)

#### 6.1 동시성 제어
**구현 내용**:
- 생산/출고/사용 기록 시 재고 충돌 방지
- 낙관적 잠금(Optimistic Locking) 구현
- 트랜잭션 처리로 데이터 일관성 보장
- 재고 불일치 감지 및 자동 조정

#### 6.2 성능 최적화
**구현 내용**:
- 데이터베이스 쿼리 최적화
- 인덱스 튜닝 및 실행 계획 분석
- Redis 캐싱 전략 도입
- API 응답 시간 단축 (< 200ms)

#### 6.3 모니터링 및 로깅
**구현 내용**:
- 생산-출고-사용 전체 흐름 감사 로그
- 재고 변동 이력 추적
- 성능 메트릭 수집 (Prometheus/Grafana)
- 오류 추적 및 자동 알림 (Sentry)

---

## 🎯 우선순위 및 일정

### CRITICAL (즉시 시작)
- **Phase 1**: 데이터베이스 스키마 완성 (1-2주)
- **Phase 2**: 생산관리 기능 구현 (2주)  
- **Phase 3**: 출고관리 기능 구현 (2주)

### HIGH (Phase 1-3 완료 후)
- **Phase 4**: 통합 재고 관리 시스템 (1-2주)
- **Phase 5**: UI/UX 완성 (1주)

### MEDIUM (전체 기능 안정화 후)
- **Phase 6**: 성능 최적화 및 안정성 (1주)

**총 예상 소요시간**: 8-10주

---

## 🔄 완성된 워크플로우

### 1. 생산 관리 워크플로우
```
본사 관리자 생산량 입력 → 본사 재고 자동 증가 → 생산 현황 업데이트 → 알림 발송
```

### 2. 출고 관리 워크플로우  
```
현장 자재 요청 → 본사 출고 승인 → 배송 처리 → 현장 입고 확인 → 재고 자동 업데이트
```

### 3. 현장 사용 워크플로우
```
현장 사용량 입력 → 현장 재고 자동 감소 → 부족 시 자동 알림 → 추가 요청 프로세스
```

### 4. 통합 모니터링
```
실시간 재고 추적 → 임계치 알림 → 예측 분석 → 자동 재주문 추천
```

---

## 💡 기대 효과

### 1. 운영 효율성 향상
- 실시간 재고 추적으로 재고 부족 방지
- 자동화된 워크플로우로 수작업 감소
- 데이터 기반 의사결정 지원

### 2. 비용 절감
- 적정 재고 유지로 재고 비용 최적화
- 배송 효율성 향상으로 물류 비용 절감
- 생산 계획 최적화로 생산 비용 절감

### 3. 가시성 향상
- 전체 공급망 실시간 모니터링
- 생산-재고-출고-사용 전 과정 추적
- 성과 지표 및 분석 리포트 제공

### 4. 사용자 경험 개선
- 직관적인 인터페이스로 작업 효율성 향상
- 모바일 최적화로 현장 사용성 개선
- 실시간 알림으로 즉시 대응 가능

---

## 📋 체크리스트

### Phase 1 완료 조건
- [ ] 모든 테이블 스키마 구현 완료
- [ ] RLS 정책 설정 완료  
- [ ] 기본 CRUD API 구현 완료
- [ ] 타입 정의 업데이트 완료

### Phase 2 완료 조건
- [ ] 생산 입력 인터페이스 구현 완료
- [ ] 생산 현황 대시보드 구현 완료
- [ ] 생산 관련 API 구현 완료
- [ ] 생산 데이터 분석 기능 완료

### Phase 3 완료 조건  
- [ ] 출고 처리 인터페이스 구현 완료
- [ ] 출고 상태 추적 시스템 완료
- [ ] 출고 관련 API 구현 완료
- [ ] 배송 추적 기능 완료

### Phase 4 완료 조건
- [ ] 실시간 재고 동기화 구현 완료
- [ ] 자동 알림 시스템 구현 완료
- [ ] 재고 흐름 추적 시스템 완료
- [ ] 동시성 제어 구현 완료

### Phase 5 완료 조건
- [ ] 모든 UI 컴포넌트 구현 완료
- [ ] 모바일 반응형 최적화 완료
- [ ] 사용자 테스트 완료
- [ ] 접근성 개선 완료

### Phase 6 완료 조건
- [ ] 성능 최적화 완료 (응답시간 < 200ms)
- [ ] 모니터링 시스템 구축 완료
- [ ] 부하 테스트 통과
- [ ] 보안 검토 완료

---

이 계획서를 통해 NPC-1000 자재 관리 시스템의 완전한 생산-재고-출고-사용 사이클을 구현하여, 현장과 본사 간의 seamless한 연동을 달성할 수 있습니다.