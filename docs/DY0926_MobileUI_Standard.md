# DY0926 Mobile UI Standard

본 문서는 INOPNC 모바일 화면 전반에 적용할 타이포그래피 및 관련 UI 토큰의 기준을 정의한다. 기존 레퍼런스 HTML(`dy_memo/new_image_html_v3.0/inopnc-page/public/raw/main.html` 및 `worklog.html`)과 동일한 시각 언어를 유지하기 위해 아래 값을 프로젝트 공통 스타일에 반영한다.

## 1. 폰트 패밀리

- 기본 본문: `Noto Sans KR`, system-ui, -apple-system, `Segoe UI`, `Roboto`, `Apple SD Gothic Neo`, `Malgun Gothic`, sans-serif
- 브랜드 타이포(헤더 로고 등): `Poppins`, `Noto Sans KR`, system-ui, sans-serif
- 폰트 로딩은 `app/layout.tsx`에 정의한 `Noto Sans KR`, `Poppins` Google Font 구성을 사용하며, fallback은 위 순서로 유지한다.

## 2. 공통 폰트 크기 및 굵기

| 토큰/용도    | 크기 | 굵기 | 비고                                       |
| ------------ | ---- | ---- | ------------------------------------------ |
| `--fs-title` | 24px | 700  | 메인 헤드라인, 주요 타이틀                 |
| `--fs-h2`    | 20px | 600  | 섹션/카드 타이틀 (예: 화면 상단 섹션 제목) |
| `--fs-body`  | 15px | 400  | 기본 본문 텍스트, 설명                     |
| `--fs-ctl`   | 14px | 500  | 버튼/탭 등 컨트롤 텍스트                   |
| `--fs-cap`   | 12px | 400  | 캡션, 보조 레이블                          |

### 클래스 매핑

- `.t-title` → 24px / 700
- `.t-h2` → 20px / 600 (기존 16px 정의 제거 필요)
- `.t-body` → 15px / 400
- `.t-ctl` → 14px / 500
- `.t-cap` → 12px / 400

Tailwind 또는 모듈 스타일에서 위 크기/굵기를 따르도록 `styles/design-system/mobile.css` 및 `modules/mobile/styles/*` 내 커스텀 정의를 업데이트한다.

## 3. 캘린더/통계 카드 타이포그래피

| 요소                  | 크기 | 굵기 | 추가 규칙                                       |
| --------------------- | ---- | ---- | ----------------------------------------------- |
| 캘린더 요일 레이블    | 16px | 600  | 색상: `#1A254F`, 일요일은 `#FF6B6B`             |
| 캘린더 셀 날짜        | 16px | 600  | 기본 `#1A254F`                                  |
| 캘린더 셀 현장 이름   | 10px | 400  | `#6B7280`, ellipsis 처리                        |
| 캘린더 셀 공수 텍스트 | 13px | 600  | 브랜드 블루 `#31A3FA`                           |
| 통계 카드 숫자        | 22px | 700  | 라인하이트 1.4, 카드 컬러에 따라 텍스트 색 결정 |
| 통계 카드 라벨        | 16px | 600  | 카드 색상과 동일한 잉크 컬러                    |

## 4. 컬러 토큰 정렬

- 라이트 모드 기준: `--bg:#F6F9FF`, `--surface:#FFFFFF`, `--line:#E6ECF4`, `--tag-blue:#31A3FA` 등 레퍼런스 HTML 변수 값을 유지한다.
- 다크 모드 기준: `--bg:#0F172A`, `--surface:#111A2E`, `--line:color-mix(in srgb, #E6ECF4 12%, transparent)` 등 HTML 변수와 동일하게 맞춘다.
- 통계 카드 색상은 레퍼런스와 동일하게 `stat-workdays`, `stat-sites`, `stat-hours`(또는 이름 변경 시 해당 클래스)에 적용한다.

## 5. 구현 가이드

1. `styles/design-system/mobile.css`에서 `.t-h2` 등을 현재 값(16px 등)에서 본 기준으로 조정한다.
2. Tailwind 유틸 또는 컴포넌트에 하드코딩된 `text-sm`, `font-medium` 등은 본문 영역에서는 최소 `t-body`(15px/400)로 통일한다.
3. `modules/mobile/styles/attendance.css` 등 개별 화면 스타일은 위 표의 캘린더/통계 타이포그래피를 사용하도록 업데이트한다.
4. 다크 모드 색상 토큰도 동일한 변수 세트를 사용해 대비감을 유지한다.

위 기준은 모바일 전용 화면 전반에 일괄 적용하며, 추후 디자인 변경 시 이 문서의 토큰 값을 싱글 소스로 업데이트한다.
