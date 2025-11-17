# DY1117 - 급여명세 Seed Data 생성 계획

## 1. 배경 & 목적

- **급여관리 도구 전반의 E2E 테스트를 위해** 소속 → 현장 → 작업일지 → 공수 → 세율 → 급여명세까지의 전체 체인이 필수다.
- 현재는 관련 테이블에 데이터가 부족하거나 수작업으로 일부만 입력되어, `급여명세서 미리보기/발행` 탭이 비어 보이고 QA가 불가능한 상황이다.
- **Seed Data 자동화 스크립트**를 마련하여 일정 기간(예: 2025년 1~11월)의 데이터를 손쉽게 생성·초기화하고, 데이터 일관성을 유지한 채 반복 실행할 수 있게 만드는 것이 목표.

## 2. 데이터 구성 요소

1. **소속/시공사 (organizations)**
   - 예: `INOPNC 본사`, `INOPNC 경남지사`, `협력사 A/B` 등.
   - Seed 시 총 2~3개 생성 후 ID 보관.

2. **현장 (sites)**
   - 각 소속에 2~3개의 현장 생성; 주소/공정/상태 등 필수 필드를 채운다.
   - 현장 → 작업일지 매핑이 정확해야 급여 처리 시 현장별 필터가 작동한다.

3. **작업자/현장관리자 (profiles)**
   - 작업자/현장관리자를 여러 명 생성하고, `organization_id`, `site_id`, `role`을 적절히 세팅.
   - Seed 시 worker/site_manager를 각각 최소 5명 이상 확보.

4. **작업일지 (worklogs)**
   - 기간: 2025-01 ~ 2025-11 (필요 시 커스터마이즈).
   - 생산 로직: 날짜별로 각 현장에 1~3건의 작업일지 생성; 작업자/현장관리자 랜덤 배정.
   - 공수(Workers 배열): 기본 8h/일을 0.5 단위로 랜덤 배분.

5. **사진/문서/첨부 (optional)**
   - 급여 명세서에는 필수는 아니지만, 작업일지 화면 검증을 위해 더미 첨부 삽입 가능.

6. **세율 설정**
   - 기본세율(employment_tax_rates)과 개인세율(worker_salary_settings). Seed 시 고용형태별 디폴트를 고정 값으로 지정(예: 일용직=소득세3%, 국민연금2%, ...).

7. **급여 스냅샷 (salary_snapshots)**
   - 위 데이터로 월별 요약 → 스냅샷 생성. 초기엔 샘플 스냅샷을 자동 페이로드로 저장해 `급여명세서 발행` 탭이 살아 있도록 함.

## 3. 구현 방안

### 3.1 스크립트 구조

- 위치: `scripts/seed-payroll-demo.ts` (tsx/ts-node 기반)
- 실행 방식: `npx tsx scripts/seed-payroll-demo.ts --months=2025-01..2025-11 --workers=10 --sites=5`
- 주요 단계:
  1. **옵션 파싱** (기간, 작업자/현장 수, 초기화 여부 등)
  2. **Supabase client 초기화** (서비스 Role 키)
  3. **데이터 초기화** (선택적) – 기존 Demo 데이터 삭제
  4. **소속/현장/사용자/세율 Insert**
  5. **기간별 작업일지 생성** (랜덤 로직)
  6. **월별 요약 계산** (평균 공수 × 일당 = 급여)
  7. **급여 스냅샷 저장** (salary_snapshots 또는 storage fallback)
  8. **로그/요약 출력** (생성 수치)

### 3.2 데이터 생성 상세

| 엔티티                 | 생성 전략                                                     |
| ---------------------- | ------------------------------------------------------------- |
| organizations          | 고정 리스트 (ex. `INOPNC 본사`, `INOPNC 경남지사`, `협력사A`) |
| sites                  | 각 organization 당 2~3개 생성. 주소/위치/상태 포함            |
| profiles               | worker 10+, site_manager 2~3+, organization/site mapping      |
| worklogs               | 매일 현장별 1~3건; 작업자 랜덤 배정; 공수 합계 8h ± 2h        |
| attachments            | 선택; 필요 시 더미 이미지 URL                                 |
| employment_tax_rates   | 일용직/프리랜서/상용직 기준값 주입 (총합 10% 예시)            |
| worker_salary_settings | 일부 작업자는 기본세율만, 일부는 개인세율(±1~2%) 적용         |
| salary_snapshots       | 월별 worker × 연월 조합으로 `data_json` 생성                  |

### 3.3 데이터 일관성 보호

- Seed 실행 전 `--reset` 플래그 시 관련 테이블 truncate 또는 기간 기준 삭제.
- 각 Insert 후 ID를 map에 저장하여 다른 엔티티 생성 시 참조.
- 랜덤 로직은 determinisitc seed를 지원하여 재현 가능하게 함 (ex. `seedrandom`).
- 오류 발생 시 롤백 또는 중단 로그 출력.

## 4. 예시 스크립트 골격 (pseudo)

```ts
import { createClient } from '@/lib/supabase/service'

interface SeedOptions {
  months: string[]
  workerCount: number
  siteCount: number
  reset?: boolean
}

async function main(opts: SeedOptions) {
  const supabase = createClient()
  if (opts.reset) {
    await supabase.from('salary_snapshots').delete().neq('worker_id', '')
    await supabase.from('worklogs').delete().neq('id', '')
    // ... 기타 필요 테이블 초기화
  }

  const orgIds = await seedOrganizations(supabase)
  const siteIds = await seedSites(supabase, orgIds)
  const workerIds = await seedProfiles(supabase, orgIds, siteIds)
  await seedTaxRates(supabase)

  for (const month of opts.months) {
    await seedWorklogsForMonth(supabase, siteIds, workerIds, month)
    const snapshots = await buildSalarySnapshots(supabase, workerIds, month)
    await saveSalarySnapshots(supabase, snapshots)
  }

  console.log('Seed completed.')
}

main(parseArgs(process.argv)).catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
```

## 5. 기대 효과

- `급여명세서 미리보기`와 `급여명세서 발행` 탭이 항상 데이터가 있는 상태로 로드되어 QA/데모가 가능.
- 소속→현장→작업일지→공수→세율까지의 연동을 한 번에 점검할 수 있어 data integrity 가 유지됨.
- 스크립트를 반복 실행해도 동일한 패턴의 데이터를 만들어, 회귀 테스트에 용이.

## 6. 다음 단계

1. 상기 계획에 따라 `scripts/seed-payroll-demo.ts` 초안 작성
2. Supabase 서비스 키 및 환경 변수 확인
3. 실제 실행 후 화면 QA로 데이터가 정상 반영되는지 검증
4. 필요 시 pagination/대상 범위를 조정하여 운영 (ex. 3개월만 생성 등)
