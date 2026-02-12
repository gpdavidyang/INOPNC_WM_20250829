# DY260212 Mobile Design Style Standard

작성일: 2026-02-12  
적용 범위: 모바일 화면(`/app/mobile`, `modules/mobile`) 및 모바일 공통 컴포넌트  
목적: 40-60대 현장 사용자의 가독성과 조작성(터치/키보드)을 최우선으로 하는 일관된 모바일 UI 기준 정의

---

## 1. 핵심 원칙

1. 가독성 최우선: 본문 최소 17px 고정, 행간 1.6, 대비 4.5:1 이상
2. 조작성 우선: 터치 영역 44x44px 이상, 버튼/입력 높이 54px로 통일
3. 단순 동선: 핵심 동선은 3클릭 내 완료, SPA 모달/드로어/드롭다운 우선
4. 불필요 요소 제거: 중복 메뉴/장문 설명 제거, 화면 내 선택지는 TOP N으로 제한
5. 일관된 피드백: 로딩/성공/실패 UI를 전 화면에서 동일 규격으로 제공

---

## 2. 디자인 토큰 (CSS Variables)

모바일 전역에서 아래 토큰을 싱글 소스로 사용한다(모바일 스코프 클래스 또는 모바일 레이아웃 루트에 적용 권장).

```css
:root {
  --font-main:
    'Pretendard Variable', Pretendard, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;

  --fs-base: 17px;
  --lh-base: 1.6;
  --h-input: 54px;
  --r-control: 12px;

  --gap-8: 8px;
  --gap-16: 16px;
  --pad-16: 16px;
  --maxw-mobile: 600px;

  --ease-ui: cubic-bezier(0.4, 0, 0.2, 1);
  --dur-ui: 0.2s;
}
```

---

## 3. 타이포그래피

### 3.1 기본 규격

- 폰트: Pretendard Variable (`--font-main`)
- 기본 크기: `--fs-base: 17px` (모바일 본문 최소값, 하향 조정 금지)
- 행간: `--lh-base: 1.6`
- 텍스트 확대 보정: `-webkit-text-size-adjust: 100%`
- 대비: 텍스트-배경 대비 4.5:1 이상(소형 텍스트/보조 텍스트 포함)

권장 전역 적용:

```css
html {
  -webkit-text-size-adjust: 100%;
}
body {
  font-family: var(--font-main);
  font-size: var(--fs-base);
  line-height: var(--lh-base);
}
```

### 3.2 굵기 계층화

- 주요(헤더/핵심 수치/주요 CTA): `font-weight: 800`
- 보조(섹션 제목/라벨/보조 CTA): `font-weight: 600`
- 본문(설명/일반 텍스트): `font-weight: 400-500` 범위에서 최소 사용(과도한 Bold 지양)

권장 텍스트 역할(예시):

| 역할          | 크기 가이드 | 굵기    | 사용 예              |
| ------------- | ----------- | ------- | -------------------- |
| Page Title    | 22-24px     | 800     | 화면 타이틀          |
| Section Title | 18-20px     | 600     | 카드/섹션 제목       |
| Body          | 17px        | 400-500 | 본문, 리스트         |
| Label/Meta    | 17px        | 600     | 입력 라벨, 핵심 메타 |

---

## 4. 레이아웃 및 그리드

### 4.1 전역 컨테이너

- 최대 폭: `max-width: 600px` 중앙 정렬
- 기본 패딩: 16px
- 기본 그리드 gap: 8px(촘촘) / 16px(기본)
- 버튼 겹침 방지: 하단 고정 CTA 영역은 콘텐츠와 분리하고 safe-area를 반영

권장 컨테이너 규격(예시):

```css
.mobile-container {
  width: 100%;
  max-width: var(--maxw-mobile);
  margin: 0 auto;
  padding: var(--pad-16);
}
.grid-gap-8 {
  gap: var(--gap-8);
}
.grid-gap-16 {
  gap: var(--gap-16);
}
```

### 4.2 하단 고정 액션 영역(CTA Bar)

- 하단 버튼은 1-2개를 기본으로 하고, 3개 이상 나열 금지(필요 시 드롭다운/바텀시트로 분리)
- iOS safe-area 대응:

```css
.cta-bar {
  padding-bottom: calc(var(--pad-16) + env(safe-area-inset-bottom, 0px));
}
```

---

## 5. 버튼 및 입력 컴포넌트 규격

### 5.1 공통 규격(필수)

- 높이: 54px (`--h-input`)
- 모서리: 12px (`--r-control`)
- 터치 영역: 최소 44x44px (내부 아이콘 버튼 포함)
- 상태 전환: `0.2s var(--ease-ui)` 통일

### 5.2 Active(눌림) 상태(필수)

- `transform: scale(0.98)`
- `shadow-glow`(가시성 있는 광원감, 과도한 블러 금지)

예시:

```css
.ui-pressable {
  transition:
    transform var(--dur-ui) var(--ease-ui),
    box-shadow var(--dur-ui) var(--ease-ui),
    background-color var(--dur-ui) var(--ease-ui),
    color var(--dur-ui) var(--ease-ui);
}
.ui-pressable:active {
  transform: scale(0.98);
  box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 18%, transparent);
}
```

### 5.3 입력 필드(필수)

- 입력 글자 크기: 17px(키보드 입력 시에도 축소 금지)
- 라벨은 필수로 제공(플레이스홀더만으로 라벨 대체 금지)
- 오류 상태는 색상 + 메시지 + 재시도/수정 동선을 함께 제공

---

## 6. 색상 시스템(모바일)

### 6.1 원칙

- 텍스트 대비 4.5:1 이상을 항상 만족
- 의미 기반 색상만 사용(Primary/Success/Danger/Warning/Info/Neutral)
- 상태 색상은 텍스트/배경/테두리 조합으로 제공하고, 색상 단독으로 의미 전달 금지

### 6.2 권장 토큰 구조(예시)

```css
:root {
  --c-bg: #f6f9ff;
  --c-surface: #ffffff;
  --c-text: #0f172a;
  --c-muted: #475569;
  --c-line: #e6ecf4;

  --c-primary: #1a254f;
  --c-accent: #31a3fa;
  --c-success: #16a34a;
  --c-danger: #e11d48;
  --c-warning: #d97706;
}
```

검증 기준:

- 본문 텍스트(`--c-text`)는 배경(`--c-bg`, `--c-surface`)에서 4.5:1 이상
- 보조 텍스트(`--c-muted`)도 동일 기준을 만족(필요 시 더 진하게 조정)

---

## 7. 인터랙션 및 전환

- 모든 UI 전환은 `0.2s cubic-bezier(0.4, 0, 0.2, 1)`로 통일
- 모달/드로어/드롭다운은 SPA 방식으로 우선 제공(페이지 이동 최소화)
- `prefers-reduced-motion: reduce` 환경에서는 애니메이션을 제거하거나 최소화

---

## 8. 핵심 동선(3클릭) 최적화 기준

대상 동선: 오늘 작업 → 작업일지 → 사진/도면 → 보고서

- 1차 진입(오늘 작업): 오늘 날짜 기준 작업만 우선 노출, 다음 행동 1개만 강조
- 작업일지 진입: 필수 입력만 먼저, 부가 입력은 접기/드로어로 분리
- 사진/도면: 업로드/선택/뷰어를 한 흐름으로 연결(중간 페이지 분리 최소화)
- 보고서: 미리보기는 모달로 제공, 최종 저장만 페이지 액션으로 유지

---

## 9. 검색(현장명) 자동완성 규격

- Search bar + TOP 10 드롭다운(스크롤 없이 노출 가능한 높이로 제한)
- 입력 시 실시간 자동완성(권장: 150-250ms 디바운스)
- 키보드만으로 완료 가능:
  - 화살표 위/아래: 항목 이동
  - Enter: 선택
  - Esc: 닫기
- 선택 항목은 명확한 포커스/하이라이트를 제공하고, 포커스 이동 시 스크롤 점프 금지

---

## 10. 뷰어(사진/도면) 제스처 규격

- 핀치 줌: 25%~200%
- 터치 드래그(팬): 줌 상태와 관계없이 지원
- 뷰어 UI는 최소화하고(닫기/확대축소/페이지 등), 컨트롤은 44x44px 이상

---

## 11. 로딩/성공/실패 피드백 규격

### 11.1 로딩

- 3초 미만: 스켈레톤 또는 미세 로딩 인디케이터(화면 점유 최소화)
- 3초 이상: 스피너 + 진행률(가능한 경우 %) 표시

### 11.2 성공

- 토스트: 1.5~2초 노출 후 자동 종료
- 동일 작업의 중복 성공 토스트는 합치거나 최신 1개만 표시

### 11.3 실패

- 한글 오류 메시지(사용자 행동 중심: 무엇을 하면 되는지)
- 즉시 재시도 버튼 제공(네트워크/서버 오류 등 복구 가능 시나리오)
- 폼 검증 오류는 필드 하단에 즉시 표시하고, 상단 요약은 선택적으로 제공

---

## 12. 문구 및 클래스 네이밍(버튼 용어 통일)

UI 텍스트는 한글을 기본으로 하며, 버튼 용어는 CSS 클래스와 연동하여 전역에서 통일한다.

| 클래스          | 라벨(텍스트) | 의미                           |
| --------------- | ------------ | ------------------------------ |
| `btn-save`      | 저장         | Primary, 가장 중요한 확정 액션 |
| `btn-secondary` | 취소         | Secondary, 되돌림/닫기         |
| `btn-next`      | 다음         | 단계 진행                      |
| `btn-prev`      | 이전         | 단계 이전                      |
| `btn-submit`    | 제출         | 제출/상신                      |
| `btn-retry`     | 재시도       | 실패 복구                      |
| `btn-delete`    | 삭제         | 위험 액션(확인 단계 권장)      |

금지:

- 버튼에 이모지/특수문자 장식 사용
- 동일 의미의 서로 다른 라벨 혼용(예: "저장", "등록", "확인"을 무분별하게 혼용)

---

## 13. 체크리스트(화면 적용 완료 기준)

- 본문 최소 17px, 행간 1.6, 텍스트 대비 4.5:1 이상
- 모든 버튼/입력: 높이 54px, radius 12px, 터치 영역 44x44px 이상
- Active 상태: scale(0.98) + shadow-glow 적용
- 기본 패딩 16px, gap 8/16 적용, max-width 600px 중앙 정렬
- 핵심 동선 3클릭 내 완료(모달/드로어/드롭다운 우선)
- 검색 자동완성: TOP 10, 키보드만으로 선택 가능
- 뷰어: 핀치줌 25-200%, 드래그 팬 지원
- 로딩/성공/실패 UI가 전 화면에서 동일 규격으로 제공
