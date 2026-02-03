# 공수(Man-days) 계산 및 데이터 관리 기준

## 1. 개요

본 문서는 INOPNC WM 시스템에서 작업 공수(Man-days)를 계산하고 저장하는 표준 로직과 기준을 정의합니다. 과거의 혼선(`total_labor_hours`의 단위 문제 등)을 정리하고, 향후 일관된 데이터 처리를 목적으로 합니다.

## 2. 데이터 저장 원칙

### 2.1 주요 테이블 및 컬럼 역할

| 테이블                 | 컬럼                  | 단위                   | 설명                                                                                  |
| ---------------------- | --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `daily_reports`        | `total_labor_hours`   | **혼합 (Deprecated)**  | 과거 데이터는 시간(Hours), 최신 데이터는 공수(Man-days)로 저장됨. **직접 사용 지양.** |
| `daily_reports`        | `work_content` (JSON) | **Source of Truth**    | JSON 내부 `totalManpower` 필드가 **일(Man-days)** 단위의 정확한 값임.                 |
| `work_records`         | `labor_hours`         | **일 (Man-days)**      | 1.0 = 1공수. 급여 및 출역 관리의 기준값. (향후 `man_days`로 마이그레이션 권장)        |
| `work_records`         | `work_hours`          | **시간 (Clock Hours)** | 실제 근무 시간. (예: 8, 9.5). **연장 근무 수당 계산의 기준.**                         |
| `daily_report_workers` | `work_hours`          | **시간 (Clock Hours)** | 작업자가 해당 현장에서 일한 시간.                                                     |

> **중요 (Naming Confusion)**: `labor_hours`는 이름과 달리 **공수(Man-days)**를 저장하고 있으며, `work_hours`는 **시간(Time)**을 저장합니다. 이 혼선을 방지하기 위해 장기적으로 `labor_hours` → `man_days`로 컬럼명 변경을 계획합니다.

> **핵심 원칙**: 화면 표시 및 통계 집계 시 **`daily_reports.work_content` JSON** 혹은 **`work_records.labor_hours`**를 최우선으로 사용한다. `daily_reports.total_labor_hours`는 단순 정렬용 보조 지표로만 활용한다.

---

## 3. 공수 계산 로직 (표준)

### 3.1 단일 작업일지 공수 계산 (`calculateReportManDays`)

작업일지 목록 등에서 단일 일지의 총 공수를 표시할 때 다음 순서로 값을 결정합니다.

1. **1순위: `work_content` JSON 파싱**
   - JSON 내 `totalManpower` 값이 존재하고 양수이면 사용.
   - JSON 내 `workers` 배열이 존재하면, 각 워커의 공수 합산.
     - 워커 객체에 `labor_hours`가 있으면 (일 단위) 그대로 합산.
     - `hours` 또는 `work_hours`만 있으면 (시간 단위) `값 / 8` 로 변환하여 합산.

2. **2순위: `total_labor_hours` 컬럼 (Fallback)**
   - 값이 8 이상인 경우: **시간(Hours)**으로 간주 → `값 / 8` 계산.
   - 값이 8 미만인 경우: **공수(Man-days)**로 간주 → 값 그대로 사용.
   - _주의: 0.1 공수 등 소수점 단위가 정확히 표현되어야 함._

3. **3순위: `total_workers` (최후 수단)**
   - 위 데이터가 모두 없으면 작업자 수를 1인당 1공수로 가정.

### 3.2 작업자 개인별 누적 공수 계산 (`getSiteLaborSummary`)

특정 현장에서 작업자의 누적 공수를 계산할 때 다음 순서로 집계합니다.

1. **1순위: `work_records` 테이블**
   - 해당 현장, 해당 유저의 모든 레코드 조회.
   - `labor_hours` (공수) 합산.
   - `labor_hours`가 0이면 `work_hours / 8`로 대체.

2. **2순위: `daily_report_workers` 테이블** (보완)
   - `work_records`가 생성되지 않은 날짜/작업에 대해 보완.
   - `work_records`에 존재하지 않는 날짜(`daily_report.work_date`)의 기록만 추가 합산.
   - `work_hours`를 8로 나누어 공수로 환산.

---

## 4. UI 표시 기준

- **소수점 처리**: 공수는 소수점 첫째 자리까지 표시 (예: `1.0`, `0.5`).
- **단위 명시**: 숫자 뒤에 항상 '공수' 표기 권장 (예: `13.5 공수`).
- **0.0 공수**: 데이터가 없거나 0인 경우 `-` 혹은 `0.0`으로 명시적 표기.

## 5. 마이그레이션 및 유지보수 가이드

- 레거시 데이터(`total_labor_hours`에 시간이 저장된 경우)를 일괄 업데이트하는 것보다, **조회 로직(Reader)에서 단위를 판별하는 전략**이 안전함.
- 신규 기능을 개발할 때는 반드시 `work_content` JSON 구조를 준수하여 데이터를 저장해야 함.

## 6. 향후 개선 계획 (Architecture Decision)

**"Rename, Don't Remove" 전략**

`work_hours` 컬럼 삭제 제안이 있었으나, 분석 결과 급여 계산(연장 수당 = 근무시간 - 8) 및 모바일 앱 로직에 필수적이므로 **유지**하기로 결정했습니다. 대신 혼선을 유발하는 `labor_hours`의 이름을 변경하는 방향으로 개선합니다.

### 6.1 목표 스키마 (Target State)

- `labor_hours` (현행, Man-days) ➡️ **`man_days`** (변경, 명확한 공수 단위)
- `work_hours` (현행, Hours) ➡️ `work_hours` (유지, 시간 단위)

### 6.2 마이그레이션 단계

1.  **Phase 1 (DB 확장)**: `man_days` 컬럼 추가 및 `labor_hours`와 데이터 동기화 (Dual Write Trigger).
2.  **Phase 2 (코드 전환)**: 백엔드/프론트엔드 로직이 `man_days`를 우선 읽도록 수정.
3.  **Phase 3 (정리)**: 레거시 `labor_hours` 컬럼 제거 (모바일 앱 강제 업데이트 이후).

## 7. 더 근본적인 개선 방향 (Phase 2 Recommendation)

현재의 구조는 `daily_reports`의 **JSON**(Source of Truth), **Table**(`daily_report_workers`), **Column**(`man_days`) 등 데이터가 3중으로 중복되어 있어 정합성 유지 비용이 높습니다. 이를 근본적으로 해결하기 위한 장기적인 개선안은 다음과 같습니다.

### 7.1 완전 정규화 (Full Normalization) - 권장

- **개념**: `work_content` JSON 내의 작업자 정보를 제거하고, 오직 `daily_report_workers` 테이블만 사용합니다.
- **장점**: 데이터 중복(Redundancy)이 완전히 제거되어 "0.1 vs 1.0" 같은 불일치 버그가 원천 차단됩니다.
- **실행 방안**: 프론트엔드(작업일지 작성 화면)가 JSON이 아닌 관계형 데이터를 저장하도록 리팩토링 필요.

### 7.2 DB 레벨 무결성 강제 (Generated Columns)

- **개념**: `total_labor_hours`나 `man_days` 컬럼을 수동으로 업데이트하는 대신, PostgreSQL의 **Generated Column** 기능을 사용하여 `daily_report_workers` 테이블의 합계로 자동 계산되도록 변경합니다.
- **장점**: 애플리케이션 로직 실수로 인한 데이터 불일치를 DB 엔진 수준에서 방지합니다.

### 7.3 교차 검증 트리거 (Cross-Validation Triggers)

- **개념**: 작업일지 저장 시 `JSON 내의 공수 합계` == `daily_report_workers 합계`가 일치하지 않으면 저장을 거부하는 DB 트리거 도입.
- **장점**: 데이터 오염을 입력 단계에서 차단하여 신뢰성을 확보합니다.
