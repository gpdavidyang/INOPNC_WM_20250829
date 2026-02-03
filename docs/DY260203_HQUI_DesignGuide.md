# 본사관리자 화면 디자인 스타일 가이드

> **작성일**: 2026년 2월 3일  
> **버전**: 1.4  
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

## 📝 타이포그래피

### 폰트 크기 체계

| 용도            | 클래스        | 크기 | 사용 예시                        |
| --------------- | ------------- | ---- | -------------------------------- |
| **대형 숫자**   | `text-2xl`    | 24px | 통계 카드의 주요 수치            |
| **페이지 제목** | `text-lg`     | 18px | 섹션 제목 (예: "최근 작업일지")  |
| **본문**        | `text-base`   | 16px | 일반 데이터 값                   |
| **보조 텍스트** | `text-sm`     | 14px | 설명문, 필터 입력                |
| **작은 텍스트** | `text-xs`     | 12px | 부가 정보, 도움말                |
| **라벨**        | `text-[11px]` | 11px | 통계 카드 라벨, 테이블 헤더 보조 |

### 폰트 굵기

| 용도            | 클래스        | 사용 예시              |
| --------------- | ------------- | ---------------------- |
| **강조 제목**   | `font-black`  | 섹션 제목, 통계 라벨   |
| **중요 데이터** | `font-bold`   | 데이터 값, 중요 정보   |
| **일반 텍스트** | `font-normal` | 버튼 텍스트, 일반 내용 |

### 특수 스타일

```tsx
// 통계 카드 라벨
className = 'text-[11px] uppercase font-black tracking-tighter opacity-50'

// 섹션 제목
className = 'text-lg font-black text-foreground'

// 통계 숫자 (이탤릭)
className = 'text-2xl font-black text-blue-700 italic'
```

---

## 🎨 색상 시스템

### 주요 색상

#### 브랜드 컬러

- **Primary Blue**: `text-blue-600`, `bg-blue-600`
- **Accent Amber**: `text-amber-600`, `bg-amber-600`
- **Success Green**: `bg-emerald-600`, `hover:bg-emerald-700`

#### 상태 색상

| 상태          | 텍스트           | 배경             | 테두리             | 사용처               |
| ------------- | ---------------- | ---------------- | ------------------ | -------------------- |
| **정보**      | `text-blue-600`  | `bg-blue-50`     | `border-blue-200`  | 선택된 탭, 정보 강조 |
| **성공/승인** | `text-white`     | `bg-emerald-600` | -                  | 승인 버튼            |
| **경고**      | `text-amber-700` | `bg-amber-50`    | `border-amber-200` | 수정 버튼            |
| **위험/삭제** | `text-rose-600`  | `bg-rose-50`     | `border-rose-200`  | 삭제 버튼            |

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

#### 탭 컨테이너

```tsx
<div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-4 -mx-6 px-6 mb-2">
  <TabsList className="grid grid-cols-8 h-auto items-center gap-2 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
    {/* 탭 버튼들 */}
  </TabsList>
</div>
```

#### 탭 버튼

```tsx
<TabsTrigger className="relative flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-600 transition-all hover:text-gray-900 hover:bg-white/60 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-md data-[state=active]:shadow-blue-100/50 whitespace-nowrap">
  <Icon className="w-4 h-4" />
  <span>탭 이름</span>
</TabsTrigger>
```

**특징**:

- 균등 분배 (`grid grid-cols-8`)
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

### 2. 버튼 (Buttons)

#### 액션 버튼 표준

| 버튼 타입    | 스타일                                                  | 사용처         |
| ------------ | ------------------------------------------------------- | -------------- |
| **상세**     | `variant="secondary"`                                   | 상세 보기      |
| **수정**     | `variant="outline"` + `border-amber-200 text-amber-700` | 편집           |
| **삭제**     | `variant="ghost"` + `text-rose-600 border-rose-200`     | 삭제           |
| **승인**     | `variant="default"` + `bg-emerald-600 text-white`       | 승인           |
| **반려**     | `variant="destructive"`                                 | 반려           |
| **전체보기** | `variant="outline"`                                     | 목록 전체 보기 |

#### 버튼 공통 스타일

```tsx
// 기본 구조
<Button size="xs" className="h-8 rounded-md font-normal px-4">
  버튼 텍스트
</Button>
```

**특징**:

- 높이: `h-8` (32px)
- 모서리: `rounded-md` (6px)
- 폰트: `font-normal` (Regular)
- 패딩: `px-4` (충분한 클릭 영역)

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
- 특히 아이콘과 텍스트가 함께 있는 버튼은 필수
- 반응형 레이아웃에서 버튼이 줄바꿈되는 것을 방지하여 디자인 정체성 유지

### 3. 통계 카드 (Stats Cards)

#### 기본 통계 카드 (테두리 없음)

```tsx
// ✅ 표준 스타일 - 테두리 없음, 배경색만 사용
<div className="grid gap-6 text-sm text-muted-foreground md:grid-cols-2 xl:grid-cols-3">
  <div className="space-y-2">
    <div className="text-[11px] uppercase font-black tracking-tighter opacity-50">라벨명</div>
    <div className="text-base font-bold text-foreground">데이터 값</div>
  </div>
</div>
```

#### 강조 통계 (큰 숫자)

```tsx
<div className="flex items-center gap-6">
  <div className="space-y-1">
    <div className="text-[11px] uppercase font-black tracking-tighter text-blue-600">작업일지</div>
    <div className="text-2xl font-black text-blue-700 italic">{count}</div>
  </div>
</div>
```

#### 그리드 통계 카드 (배경색 사용)

```tsx
// ✅ 올바른 사용 - 테두리 없이 배경색만 사용
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
  <div className="rounded-xl bg-blue-50/50 p-4 space-y-2">
    <div className="text-[11px] uppercase font-black tracking-tighter text-blue-600">
      라벨
    </div>
    <div className="text-2xl font-black text-blue-700">
      {value}
    </div>
  </div>
</div>

// ❌ 피해야 할 사용 - 테두리 사용
<div className="rounded-xl border bg-blue-50/50 p-4">
  {/* 테두리가 있으면 시각적으로 무거워 보임 */}
</div>
```

**특징**:

- **테두리 없음**: `border` 클래스 사용하지 않음
- **배경색**: 연한 색상 사용 (예: `bg-blue-50/50`)
- **모서리**: `rounded-xl` (12px)
- **패딩**: `p-4` (16px)

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
