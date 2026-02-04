# 본사관리자 화면 디자인 스타일 가이드

> **작성일**: 2026년 2월 4일
> **버전**: 1.9
> **목적**: 본사관리자 화면의 일관성 있는 UI/UX 제공을 위한 디자인 표준

---

## 📋 목차

1. [디자인 원칙](#디자인-원칙)
2. [타이포그래피](#타이포그래피)
3. [색상 시스템](#색상-시스템)
4. [레이아웃 구조](#레이아웃-구조)
5. [컴포넌트 스타일](#컴포넌트-스타일)
6. [간격 및 여백](#간격-및-여백)
7. [반응형 디자인](#반응형-디자인)

---

## 🎯 디자인 원칙

### 핵심 가치

1. **가독성 우선**: 최소 폰트 크기 11px 이상 유지
2. **일관성**: 모든 화면에서 동일한 패턴 적용
3. **명확성**: 액션 버튼과 정보 표시의 명확한 구분
4. **전문성**: 깔끔하고 세련된 비즈니스 스타일

### 디자인 철학

- 과도한 장식 지양, 기능 중심의 미니멀 디자인
- 충분한 여백으로 시각적 편안함 제공
- 색상 대비를 통한 정보 계층 구조 명확화

---

## 📝 타이포그래피 (Typography)

가독성과 시각적 피로도 감소를 위해 **굵기(Weight)의 조화**를 중요시합니다.

### 폰트 크기 및 굵기 체계

| 용도            | 클래스        | 굵기          | 사용 예시                            |
| --------------- | ------------- | ------------- | ------------------------------------ |
| **대형 숫자**   | `text-2xl`    | `font-black`  | 통계 카드의 주요 수치 (이탤릭 권장)  |
| **섹션 제목**   | `text-lg`     | `font-black`  | 페이지 및 섹션의 대제목              |
| **데이터 명칭** | `text-base`   | `font-bold`   | 정보 그리드의 값, 테이블 주요 필드   |
| **일반 텍스트** | `text-sm`     | `font-medium` | 설명문, 테이블 일반 텍스트           |
| **보조 라벨**   | `text-[11px]` | `font-black`  | 통계 라벨 (저대비/Opacity 적용 필수) |

### 타이포그래피 원칙

1.  **Bold 남용 금지**: 모든 텍스트가 Bold일 경우 강조 효과가 사라지고 시각적 피로도가 높습니다. 정적인 정보(설명문, 일반 값)는 `font-medium` 또는 `font-normal`을 사용합니다.
2.  **계층 구조**: `Black(제목/라벨) > Bold(데이터) > Medium(일반)` 순으로 위계를 설정합니다.
3.  **한글 우선**: 모든 레이아웃에서 한글 표기를 원칙으로 하며, 영문은 디자인적 요소(Sub-title 등)로만 최소화하여 사용합니다.

```tsx
// ✅ 권장: 라벨(Black/Low Opacity) + 데이터(Bold)
<div className="space-y-1">
  <div className="text-[11px] font-black uppercase tracking-tighter opacity-50">작성자</div>
  <div className="text-base font-bold text-foreground">홍길동</div>
</div>

// ❌ 지양: 모든 항목이 과도하게 굵은 경우
<div className="font-black text-lg">작성자: 홍길동</div>
```

---

### 색상 시스템 (Color System)

#### 핵심 브랜드 컬러 (Core Brand Colors)

- **Management Navy**: `#1A254F` (브랜드 핵심 컬러 / 주요 버튼 / 카드 헤더)
- **Table Header Background**: `#8da0cd` (`--brand-300`) (현장 관리/작업일지 관리 등에서 공통으로 사용되는 표준 표 헤더 색상)
- **Primary Blue**: `text-blue-600`, `bg-blue-600` (일반 액션/강조)
- **Accent Amber**: `text-amber-600`, `bg-amber-600` (경고/수정)
- **Success Green**: `bg-emerald-600`, `hover:bg-emerald-700` (승인/완료)

#### 상태 및 톤앤매너 색상 (State Colors)

| 상태          | 텍스트          | 배경             | 테두리             | 주요 사용처            |
| ------------- | --------------- | ---------------- | ------------------ | ---------------------- |
| **관리/집계** | `#1A254F`       | `bg-slate-50`    | `border-slate-100` | 통계 카드, 주요 집계   |
| **정보**      | `text-blue-600` | `bg-blue-50`     | `border-blue-100`  | 일반 강조, 선택 상태   |
| **성공/승인** | `text-white`    | `bg-emerald-600` | -                  | 승인 버튼              |
| **위험/삭제** | `text-rose-600` | `bg-rose-50`     | `border-rose-100`  | 삭제, 반려, 비정상상태 |

#### 중립 색상

| 용도       | 클래스                                     | 사용처            |
| ---------- | ------------------------------------------ | ----------------- |
| **배경**   | `bg-white`, `bg-gray-50`                   | 카드, 입력 필드   |
| **테두리** | `border-gray-100`, `border-gray-200`       | 카드, 테이블      |
| **텍스트** | `text-foreground`, `text-muted-foreground` | 본문, 보조 텍스트 |

### 색상 사용 원칙

```tsx
// ✅ 올바른 사용
<Button className="bg-emerald-600 hover:bg-emerald-700 text-white">승인</Button>
<Button className="text-rose-600 hover:bg-rose-50 border border-rose-200">삭제</Button>

// ❌ 피해야 할 사용
<Button className="bg-red-500">삭제</Button> // 표준 색상 미사용
<Button className="text-blue-600 bg-blue-600">버튼</Button> // 대비 부족
```

---

## 📐 레이아웃 구조

### 페이지 구조

```
┌─────────────────────────────────────┐
│ PageHeader (제목, 설명, 액션 버튼)    │
├─────────────────────────────────────┤
│ Card (rounded-3xl)                  │
│ ┌─────────────────────────────────┐ │
│ │ CardHeader (gradient bg)        │ │
│ │ - Title (text-2xl)              │ │
│ │ - Description (text-sm)         │ │
│ ├─────────────────────────────────┤ │
│ │ CardContent (pt-6)              │ │
│ │ - Tabs (sticky, gradient bg)    │ │
│ │ - Content                       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 카드 스타일

```tsx
// 메인 카드
<Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
  <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
    <CardTitle className="text-2xl">{title}</CardTitle>
    <CardDescription className="text-sm">{description}</CardDescription>
  </CardHeader>
  <CardContent className="pt-6">
    {/* 내용 */}
  </CardContent>
</Card>

// 섹션 카드
<div className="rounded-2xl border bg-card p-6 shadow-sm">
  {/* 내용 */}
</div>
```

---

## 🧩 컴포넌트 스타일

### 1. 탭 (Tabs)

#### 1.1 내비게이션 탭 (Next.js Link 기반)

Next.js의 `<Link>`를 사용한 페이지 이동형 탭도 Radix UI의 `<Tabs>`와 동일한 시각적 스타일을 유지해야 합니다.

```tsx
// 활성 상태 판별 후 스타일 적용
<Link
  href={tab.href}
  className={`
    relative flex h-11 items-center justify-center gap-2.5 rounded-xl px-3 text-sm font-black transition-all whitespace-nowrap
    ${
      isActive
        ? 'bg-blue-50 text-blue-700 shadow-md shadow-blue-100/50 border border-blue-100'
        : 'text-gray-500 hover:text-gray-900 hover:bg-white/60'
    }
  `}
>
  <Icon className={isActive ? 'text-blue-600' : 'text-gray-400'} />
  <span>{tab.label}</span>
</Link>
```

**표준 색상**:

- **활성 배경**: `bg-blue-50` (필수)
- **비활성 상태**: `text-gray-500`, 호버 시 `bg-white/60`
- **테두리**: 활성 시 `border-blue-100`

#### 1.2 탭 컨테이너 (UI Components)

```tsx
<div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-4 -mx-6 px-6 mb-2">
  <TabsList className="grid grid-cols-3 w-full h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
    {/* 탭 버튼들: grid-cols-N으로 화면 가로폭을 균등하게 분할하여 사용 */}
  </TabsList>
</div>
```

#### 1.3 탭 버튼 (TabsTrigger)

```tsx
<TabsTrigger className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap">
  <Icon className="w-4 h-4" />
  <span>탭 이름</span>
</TabsTrigger>
```

**특징**:

- **균등 분배** (`grid grid-cols-N`): 탭의 개수에 맞춰 가로폭을 균등하게 나누어 사용합니다.
- **가로폭 최대** (`w-full`): 탭 리스트가 화면의 좌우 폭을 모두 채우도록 설정합니다.
- 활성 탭: 파란색 배경 (`bg-blue-50`)
- 밑줄 없음 (전역 CSS로 제거)
- 부드러운 그림자 효과

#### 서브 탭 (섹션 내부 탭)

서브 탭도 메인 탭과 동일한 디자인 패턴을 따라야 합니다.

```tsx
// ✅ 표준 서브 탭 - 균등 분배, 가로폭 최대
<Tabs defaultValue="tab1" className="w-full">
  <TabsList className="grid grid-cols-4 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
    <TabsTrigger
      value="tab1"
      className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap"
    >
      탭 1
    </TabsTrigger>
    {/* 나머지 탭들 */}
  </TabsList>
</Tabs>

// ❌ 잘못된 서브 탭 - 구식 스타일
<TabsList className="bg-gray-100 p-1 rounded-xl h-12">
  <TabsTrigger className="rounded-lg h-10 data-[state=active]:bg-white">
    {/* grid 없이 자동 크기 조정 - 일관성 없음 */}
  </TabsTrigger>
</TabsList>
```

**서브 탭 규칙**:

1. **균등 분배**: `grid grid-cols-N` 사용 (N = 탭 개수)
2. **가로폭 최대**: `className="w-full"` 필수
3. **메인 탭과 동일한 스타일**: 배경색, 활성 상태, 그림자 모두 동일
4. **간격**: `gap-2` 유지
5. **패딩**: `p-1.5` 유지

### 2. 통계 카드 (Stats Cards)

통계 카드 섹션은 화면 가로폭을 꽉 채우는 균등 Grid 방식을 사용합니다.

```tsx
<section className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
  <StatsCard label="항목 1" value={100} />
  <StatsCard label="항목 2" value={200} />
  {/* 항목 개수에 맞게 grid-cols 설정 */}
</section>
```

**규칙**:

1. **균등 분배**: 항목 개수에 맞게 `grid-cols-N`을 설정하여 좌우 여백 없이 배치합니다.
2. **반응형**: 모바일(`grid-cols-2`)과 데스크탑(`md:grid-cols-N`) 설정을 상황에 맞게 조정합니다.

### 2. 버튼 (Buttons)

#### 액션 버튼 표준

| 버튼 타입    | 스타일                                                                  | 사용처         |
| ------------ | ----------------------------------------------------------------------- | -------------- |
| **상세**     | `variant="secondary"`                                                   | 상세 보기      |
| **수정**     | `variant="outline"` + `border-amber-200 text-amber-700`                 | 편집           |
| **삭제**     | `variant="ghost"` + `text-rose-600 border-rose-200`                     | 삭제           |
| **해제**     | `variant="ghost"` + `text-gray-400 hover:text-rose-600 border-gray-200` | 연결 해제      |
| **승인**     | `variant="default"` + `bg-emerald-600 text-white`                       | 승인           |
| **반려**     | `variant="destructive"`                                                 | 반려           |
| **전체보기** | `variant="outline"`                                                     | 목록 전체 보기 |

#### 버튼 공통 스타일

```tsx
// 버튼 공통 스타일
<Button size="xs" className="h-8 rounded-md font-normal px-4 whitespace-nowrap">
  버튼 텍스트
</Button>

// 상세 버튼 (테이블 내)
<Button asChild variant="secondary" size="xs" className="h-8 rounded-md font-normal px-4 whitespace-nowrap">
  <Link href={`/detail/${id}`}>상세</Link>
</Button>
```

**특징**:

- 높이: `h-8` (32px) 또는 `h-9` (36px)
- 모서리: `rounded-md` (6px) 또는 `rounded-lg` (8px)
- 폰트: `font-medium` (또는 `font-normal`)
- 패딩: `px-4 ~ px-6`

#### 액션 버튼 스타일 가이드

- **텍스트형 버튼도 테두리 권장**: "원본 보기"와 같은 보조 액션 버튼은 시각적 명확성을 위해 연한 테두리(`border-gray-200`)를 포함한 `variant="outline"` 스타일을 권장합니다.
- **아이콘 대비**: 보조 버튼 내부 아이콘은 텍스트보다 한 단계 낮은 명도를 사용합니다.

#### 버튼 예시

```tsx
// 상세 버튼
<Button asChild variant="secondary" size="xs" className="h-8 rounded-md font-normal px-4">
  <Link href={`/detail/${id}`}>상세</Link>
</Button>

// 삭제 버튼
<Button
  variant="ghost"
  size="xs"
  className="h-8 rounded-md font-normal text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 border border-rose-200"
  onClick={handleDelete}
>
  삭제
</Button>

// 승인 버튼
<Button
  variant="default"
  size="xs"
  className="h-8 rounded-md font-normal bg-emerald-600 hover:bg-emerald-700 text-white px-4"
  onClick={handleApprove}
>
  승인
</Button>

// 전체보기 버튼
<Button asChild variant="outline" size="sm" className="rounded-xl">
  <a href="/list">전체보기</a>
</Button>

// 아이콘 포함 버튼 (줄바꿈 방지 필수)
<Button asChild size="sm" className="rounded-lg gap-2 whitespace-nowrap">
  <a href="/new">
    <Plus className="w-4 h-4" />
    일지 작성
  </a>
</Button>
```

**⚠️ 중요: 버튼 텍스트 줄바꿈 방지 (Mandatory Rule)**

모든 CTA 버튼에는 **텍스트 줄바꿈 방지** 옵션을 적용해야 합니다. 특히 "미리보기", "일지 작성" 등 문구가 길거나 아이콘이 포함된 경우, 좁은 화면에서 버튼 모양이 깨지는 것을 방지하기 위해 필수적으로 적용합니다.

```tsx
// ✅ 올바른 사용 - whitespace-nowrap 필수 적용
<Button className="whitespace-nowrap">미리보기</Button>
<Button className="whitespace-nowrap gap-2">
  <Plus className="w-4 h-4" />
  일지 작성
</Button>

// ❌ 잘못된 사용 - 줄바꿈 발생 위험
<Button>미리보기</Button>
```

- 모든 버튼에 `whitespace-nowrap` 클래스 추가
- 모든 버튼에 `whitespace-nowrap` 클래스 추가
- 특히 아이콘과 텍스트가 함께 있는 버튼은 필수
- 반응형 레이아웃에서 버튼이 줄바꿈되는 것을 방지하여 디자인 정체성 유지

### 3. 통계 카드 (Stats Cards)

Management Navy를 기반으로 한 **최대 3가지** 색상 체계로 정보를 그룹화합니다.

#### 통계 카드 색상 유형

| 유형        | 텍스트 컬러 | 배경 컬러      | 테두리(Optional) | 사용 대상                 |
| ----------- | ----------- | -------------- | ---------------- | ------------------------- |
| **Primary** | `#1A254F`   | `bg-indigo-50` | -                | 총 공수, 핵심 집계 데이터 |
| **Active**  | `blue-700`  | `bg-blue-50`   | -                | 현재 진행 중, 수량 관련   |
| **Neutral** | `sky-700`   | `bg-sky-50`    | -                | 기타 부수 정보            |

#### 표준 마크업

```tsx
// ✅ 최신 표준: Simple & Navy Modern
// 헤더 레이아웃: 텍스트는 uppercase, tracking-tighter, opacity-30으로 가볍게 처리
// 값 레이아웃: 2xl, font-black, italic, tracking-tight로 강조
<div className="bg-slate-50 p-5 rounded-2xl flex flex-col gap-1.5">
  <div className="text-[11px] font-black uppercase tracking-tighter text-[#1A254F] opacity-30">
    현장 총공수
  </div>
  <div className="text-2xl font-black text-[#1A254F] italic tracking-tight">{value}</div>
</div>
```

**특징**:

- **Navy 강조**: 가벼운 블루(`blue-600`) 대신 묵직한 네이비(`#1A254F`)를 주 색상으로 사용하여 전문성을 강화합니다.
- **심플함**: 모든 카드의 폰트 스타일이 동일하며, 색상으로만 정보의 성격을 구분합니다.

---

## 📏 간격, 밀도 및 여백 (Density & Spacing)

화면 전체의 공간 활용도를 높이고 일관된 리듬감을 유지합니다.

### 1. 섹션 간격 (Section Spacing)

- **페이지 상단 여백**: `mt-4` 또는 `mt-6`
- **섹션 간 간격**: `space-y-6` 또는 `space-y-8`
- **카드 내부 간격**: 기본 `p-6`, 소형 정보 카드는 `p-4`

### 2. 정보 밀도 (Depth & Density)

- **섹션 구분**: 단순 여백보다는 `rounded-2xl border bg-card shadow-sm` 패턴의 섹션 카드를 사용하여 정보를 그룹화합니다.
- **그룹 내부 구분**: 카드 내부에서 연관된 정보군은 `border-t` 또는 연한 배경색(`bg-gray-50/50`)을 가진 행(Row)으로 구분합니다.

### 3. 일관성 (Consistency)

- 모든 입력 필드 높이는 **`h-10`**, 버튼 높이는 **`h-8`** (테이블 내부) 또는 **`h-9`** (헤더/일반)로 고정합니다.
- 모서리 곡률: `rounded-3xl`(메인카드), `rounded-2xl`(섹션/테이블), `rounded-xl`(입력필드/버튼), `rounded-md`(소형버튼).

---

### 4. 테이블 (Tables)

#### 테이블 컨테이너

```tsx
// 패딩 있는 버전 (권장)
<div className="rounded-2xl border bg-card p-6 shadow-sm overflow-hidden">
  <DataTable {...props} />
</div>

// 패딩 없는 버전
<div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
  <DataTable {...props} />
</div>
```

**특징**:

- 모서리: `rounded-2xl` (16px) - 일관성 유지
- 패딩: `p-6` - 테두리와의 여백 확보
- 그림자: `shadow-sm` - 미세한 입체감

#### 테이블 내부 스타일

```tsx
// 내부 테이블 (DataTable 컴포넌트 내)
<div className="bg-white rounded-2xl shadow-2xl shadow-black/5 overflow-hidden border border-gray-100">
  {/* 테이블 내용 */}
</div>
```

### 5. 입력 필드 (Input Fields)

#### 검색/필터 입력 (Input & CustomSelect)

드롭다운 형식의 선택 필드는 반드시 `CustomSelect` 컴포넌트를 사용하여 일관된 디자인을 유지해야 합니다.

```tsx
// 텍스트 입력
<Input
  type="text"
  placeholder="검색..."
  className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm"
/>

// ✅ 표준 드롭다운 (CustomSelect 사용 필수)
<CustomSelect value={value} onValueChange={onChange}>
  <CustomSelectTrigger className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm">
    <CustomSelectValue placeholder="선택하세요" />
  </CustomSelectTrigger>
  <CustomSelectContent>
    <CustomSelectItem value="opt1">옵션 1</CustomSelectItem>
    <CustomSelectItem value="opt2">옵션 2</CustomSelectItem>
  </CustomSelectContent>
</CustomSelect>

// 날짜 입력 (아이콘 우측 배치 표준)
<div className="relative w-fit">
  <Input
    type="date"
    className="h-10 w-36 rounded-xl bg-gray-50 border-none pl-4 pr-10 text-sm"
  />
  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
</div>

// 필터 라벨 (입력 필드 상단 배치 표준)
<div className="flex flex-col gap-1.5 align-top">
  <span className="text-[11px] font-bold text-muted-foreground tracking-tight">
    필드명
  </span>
  <Input className="h-9 ..." />
</div>

// ❌ 사용 금지 - 기본 select 태그 또는 표준 Select 컴포넌트
<select className="h-10 rounded-xl bg-gray-50 border-none px-4 text-sm">
  <option>옵션</option>
</select>
```

**특징**:

- 높이: `h-10` (40px)
- 배경: `bg-gray-50` (연한 회색)
- 테두리 없음: `border-none` (또는 `border-transparent`)
- 모서리: `rounded-xl` (12px)
- **일관성**: `CustomSelect`를 사용하여 모든 드롭다운의 시각적 스타일 통일

### 6. 뷰 모드 토글 (View Mode Toggle)

그리드(카드)형과 리스트형 전환을 위한 토글 버튼 표준입니다. 텍스트 라벨 없이 아이콘으로만 구성하여 간결함을 유지합니다.

```tsx
<div className="flex items-center bg-gray-50/50 p-1 rounded-xl border border-gray-100 shadow-sm">
  <button
    onClick={() => setViewMode('grid')}
    className={`p-1.5 rounded-lg transition-all ${
      viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
    }`}
    title="그리드 보기"
  >
    <LayoutGrid className="h-4 w-4" />
  </button>
  <button
    onClick={() => setViewMode('list')}
    className={`p-1.5 rounded-lg transition-all ${
      viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
    }`}
    title="리스트 보기"
  >
    <List className="h-4 w-4" />
  </button>
</div>
```

**특징**:

- **아이콘 전용**: 텍스트 라벨 없이 아이콘만 사용 (`title` 속성으로 정보 제공)
- **컨테이너**: `bg-gray-50/50`, `p-1`, `rounded-xl`, `border`, `shadow-sm`
- **활성 상태**: `bg-white`, `text-blue-600`, `shadow-sm`
- **비활성 상태**: `text-gray-400` (연한 회색)

---

## 📏 간격 및 여백

### 섹션 간격

```tsx
// 페이지 레벨
<div className="px-0 pb-8 space-y-6">
  {/* 섹션들 */}
</div>

// 섹션 내부
<section className="space-y-4">
  {/* 콘텐츠 */}
</section>
```

### 카드 패딩

- **CardHeader**: 기본 패딩 (Radix UI 기본값)
- **CardContent**: `pt-6` (상단 여백)
- **섹션 카드**: `p-6` (전체 패딩)

### 그리드 간격

```tsx
// 통계 카드 그리드
<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

// 데이터 그리드
<dl className="grid gap-6 text-sm md:grid-cols-2 xl:grid-cols-4">
```

---

## 📱 반응형 디자인

### 브레이크포인트

- **모바일**: 기본 (< 768px)
- **태블릿**: `md:` (≥ 768px)
- **데스크톱**: `xl:` (≥ 1280px)

### 그리드 반응형 패턴

```tsx
// 2-3 컬럼 그리드
className = 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'

// 2-4 컬럼 그리드
className = 'grid gap-6 md:grid-cols-2 xl:grid-cols-4'

// 탭 (8개 균등 분배)
className = 'grid grid-cols-8 gap-2'
```

---

## 🎯 실전 적용 예시

### 페이지 전체 구조

```tsx
export default function AdminPage() {
  return (
    <div className="px-0 pb-8 space-y-6">
      {/* 페이지 헤더 */}
      <PageHeader
        title="페이지 제목"
        description="페이지 설명"
        breadcrumbs={[...]}
        actions={<ActionButtons />}
      />

      {/* 메인 카드 */}
      <Card className="rounded-3xl border-gray-200 shadow-sm shadow-gray-200/50">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <CardTitle className="text-2xl">카드 제목</CardTitle>
          <CardDescription className="text-sm">카드 설명</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 탭 또는 콘텐츠 */}
        </CardContent>
      </Card>
    </div>
  )
}
```

### 섹션 구조

```tsx
<section className="space-y-4">
  {/* 섹션 헤더 */}
  <div className="flex items-center justify-between">
    <h3 className="text-lg font-black text-foreground">섹션 제목</h3>
    <Button asChild variant="outline" size="sm" className="rounded-xl">
      <a href="/list">전체보기</a>
    </Button>
  </div>

  {/* 섹션 콘텐츠 */}
  <div className="rounded-2xl border bg-card p-6 shadow-sm">{/* 내용 */}</div>
</section>
```

---

## ✅ 체크리스트

새로운 화면을 개발하거나 기존 화면을 개선할 때 다음 항목을 확인하세요:

### 타이포그래피

- [ ] 최소 폰트 크기 11px 이상 사용
- [ ] 라벨은 `text-[11px] uppercase font-black tracking-tighter`
- [ ] 섹션 제목은 `text-lg font-black`
- [ ] 버튼 텍스트는 `font-normal`

### 색상

- [ ] 브랜드 컬러 사용 (blue-600, amber-600, emerald-600)
- [ ] 상태별 색상 일관성 유지
- [ ] 충분한 대비 확보 (특히 승인 버튼은 `text-white`)

### 레이아웃

- [ ] 카드는 `rounded-3xl` (메인) 또는 `rounded-2xl` (섹션)
- [ ] 테이블 컨테이너에 `p-6` 패딩 적용
- [ ] 섹션 간 `space-y-4` 또는 `space-y-6` 간격

### 컴포넌트

- [ ] 버튼: `h-8 rounded-md font-normal px-4`
- [ ] 탭: 균등 분배, 밑줄 없음, 활성 탭 `bg-blue-50`
- [ ] 입력 필드: `h-10 rounded-xl bg-gray-50 border-none`
- [ ] 드롭다운: 반드시 `CustomSelect` 컴포넌트 사용

### 반응형

- [ ] 그리드 반응형 클래스 적용 (`md:`, `xl:`)
- [ ] 모바일에서도 가독성 확보

---

## 📚 참고 파일

이 가이드는 다음 파일들의 개선 사항을 기반으로 작성되었습니다:

- `/components/admin/sites/SiteDetailTabs.tsx` - 탭 디자인
- `/components/admin/sites/detail/tabs/OverviewTab.tsx` - 통계 카드, 섹션 레이아웃
- `/components/admin/sites/list/SiteTable.tsx` - 테이블, 버튼
- `/components/admin/daily-reports/table/DailyReportColumns.tsx` - 액션 버튼
- `/app/dashboard/admin/sites/[id]/page.tsx` - 페이지 구조
- `/app/globals.css` - 전역 스타일 (탭 밑줄 제거)

---

## 🔄 버전 히스토리

### v1.4 (2026-02-03)

- 드롭다운 표준 컴포넌트 명시 (`CustomSelect` 사용 필수)
- 입력 필드 가이드 내 `CustomSelect` 예시 추가

### v1.1 (2026-02-03)

- 버튼 텍스트 줄바꿈 방지 규칙 추가 (`whitespace-nowrap`)
- 통계 카드 테두리 제거 표준 명시
- 서브 탭 디자인 표준 추가 (균등 분배, 메인 탭과 동일한 스타일)

### v1.3 (2026-02-03)

- 버튼 텍스트 줄바꿈 방지 (`whitespace-nowrap`) 규칙을 권장에서 **필수(Mandatory)**로 격상
- 긴 문구(예: 미리보기)를 가진 버튼의 일관된 디자인 유지

### v1.2 (2026-02-03)

- 뷰 모드 토글 (그리드/리스트) 표준 추가
- 아이콘 전용 인터페이스 적용 (텍스트 라벨 제거)

### v1.0 (2026-02-03)

- 초기 가이드 작성
- 타이포그래피, 색상, 레이아웃, 컴포넌트 스타일 정의
- 실전 예시 및 체크리스트 추가

---

**문서 작성**: AI Assistant  
**검토 및 승인**: David Yang  
**최종 수정일**: 2026년 2월 3일
