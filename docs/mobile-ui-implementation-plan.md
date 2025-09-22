# 🚀 INOPNC 모바일 UI 업그레이드 변경 계획안

## 📋 변경 작업 로드맵

### 🎯 Phase 1: Foundation (1-2시간)
**목표**: 기본 디자인 토큰 및 인프라 구축

#### 1.1 CSS 변수 시스템 추가 (30분)
**파일**: `/app/globals.css`
```css
/* HTML 모형에서 추출한 디자인 토큰 추가 */
:root {
  /* Brand Colors from mockup */
  --brand: #1A254F;
  --brand-light: #2A3570;
  --brand-dark: #0F1835;
  --num: #0068FE;
  --accent: #2563eb;
  
  /* Layout Colors */
  --bg: #f5f7fb;
  --card: #ffffff;
  --text: #101828;
  --text-muted: #667085;
  --border: #e6eaf2;
  
  /* Component Specific */
  --header-h: 56px;
  --nav-h: 64px;
  --nav-bg: #ffffff;
  --nav-border: #e5e7eb;
  --nav-text: #6b7280;
  --nav-text-active: #2563eb;
  
  /* Mobile Viewport */
  --vh: 1vh;
  --dvh: 100dvh;
  --svh: 100svh;
}

/* Dark theme extensions */
[data-theme="dark"] {
  --bg: #0f172a;
  --card: #0f172a;
  --border: #3A4048;
  --text: #E9EEF5;
  --text-muted: #A8B0BB;
  --nav-bg: #11151B;
  --nav-border: #3A4048;
  --nav-text: #A8B0BB;
  --nav-text-active: #2F6BFF;
}
```

#### 1.2 폰트 시스템 확장 (30분)
**파일**: `/app/layout.tsx`
```typescript
// Poppins 폰트 추가
import { Poppins, Noto_Sans_KR } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-kr',
  display: 'swap',
})
```

**파일**: `/app/globals.css`
```css
/* Typography system */
.font-poppins { font-family: var(--font-poppins), system-ui, sans-serif; }
.brand-logo { 
  font-family: var(--font-poppins);
  font-weight: 700;
  letter-spacing: 0.2px;
}

/* Font size scaling system */
body.fs-100 { font-size: 15px; }
body.fs-150 { font-size: 27px; }
```

#### 1.3 모바일 뷰포트 최적화 (30분)
**파일**: `/app/globals.css`
```css
/* Mobile input optimization */
input, select, textarea { 
  font-size: 16px !important;
  -webkit-appearance: none;
  border-radius: 0;
}

/* iOS auto-zoom prevention */
input[type="text"], 
input[type="password"], 
input[type="email"], 
input[type="tel"],
textarea, 
select { 
  font-size: 16px !important;
}

/* Dynamic viewport height */
.min-h-screen-safe {
  min-height: calc(var(--vh, 1vh) * 100);
}
```

### 🎨 Phase 2: Component Enhancement (2-3시간)

#### 2.1 Card 컴포넌트 확장 (45분)
**파일**: `/components/ui/card.tsx`
```typescript
// work-card variant 추가
variant?: 'default' | 'elevated' | 'prominent' | 'work-card' | 'section-header'

const variantClasses = {
  // 기존 variants...
  'work-card': `
    bg-white dark:bg-slate-800 
    border border-gray-200 dark:border-gray-700 
    rounded-xl shadow-sm hover:shadow-md
    transition-all duration-200 ease-out
    hover:border-blue-200 dark:hover:border-blue-700
  `,
}
```

#### 2.2 작업 카드 스타일 구현 (45분)
**파일**: `/app/globals.css`
```css
/* Work card specific styles from mockup */
.work-card {
  border: 1px solid #E6ECF4;
  border-radius: 12px;
  background: var(--card);
  transition: all 0.2s ease;
}

.work-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--accent);
}

[data-theme="dark"] .work-card {
  background: var(--card);
  border-color: var(--border);
}
```

#### 2.3 버튼 시스템 개선 (45분)
**파일**: `/components/ui/button.tsx`
```typescript
// 새로운 버튼 variants 추가
variant?: 'default' | 'primary' | 'work-action' | 'photo-upload'

const variantClasses = {
  'work-action': `
    bg-gradient-to-r from-blue-500 to-blue-600 
    hover:from-blue-600 hover:to-blue-700
    text-white font-semibold
    rounded-xl px-6 py-3
    shadow-sm hover:shadow-md
    transition-all duration-200
  `,
  'photo-upload': `
    bg-blue-50 hover:bg-blue-100 
    border-2 border-dashed border-blue-300 
    text-blue-700 font-medium
    rounded-xl py-8 
    transition-colors duration-200
    w-full flex flex-col items-center gap-2
  `,
}
```

#### 2.4 네비게이션 스타일 업데이트 (45분)
**파일**: `/components/ui/unified-mobile-nav.tsx`
```typescript
// CSS 변수 기반 스타일링 적용
className={cn(
  "fixed bottom-0 left-0 right-0 z-50",
  "bg-[var(--nav-bg)] border-t border-[var(--nav-border)]",
  "h-[var(--nav-h)] px-2 py-1"
)}

// 활성 상태 스타일
const activeStyles = "text-[var(--nav-text-active)] bg-blue-50 dark:bg-blue-900/20"
const inactiveStyles = "text-[var(--nav-text)] hover:text-[var(--nav-text-active)]"
```

### 🚀 Phase 3: Screen-by-Screen Update (3-4시간)

#### 3.1 홈 화면 개선 (1시간)
**파일**: `/components/dashboard/tabs/home-tab.tsx`

**변경사항**:
- 빠른메뉴 카드들을 `work-card` variant로 변경
- 브랜드 컬러 적용
- 그리드 레이아웃 개선

```typescript
// Before
<Card className="p-4">

// After  
<Card variant="work-card" className="p-6 hover:scale-105 transition-transform">
  <div className="text-[var(--brand)] font-semibold">
    {/* content */}
  </div>
</Card>
```

#### 3.2 작업일지 화면 개선 (1.5시간)
**파일**: `/components/dashboard/tabs/lazy-components.tsx` (WorkLogsTab)

**주요 변경사항**:
- 작업일지 카드 디자인 적용
- 사진 업로드 UI 개선
- 저장 버튼 스타일 업데이트

```typescript
// 사진 업로드 개선
<Button variant="photo-upload" onClick={handlePhotoUpload}>
  <Camera className="w-8 h-8" />
  사진 업로드
</Button>

// 작업일지 카드 개선
<Card variant="work-card" className="mb-4">
  <CardHeader className="border-b border-[var(--border)]">
    <CardTitle className="text-[var(--brand)]">
      {report.work_date}
    </CardTitle>
  </CardHeader>
  {/* content */}
</Card>
```

#### 3.3 출근현황 화면 개선 (1시간)
**파일**: `/components/attendance/*.tsx`

**변경사항**:
- 출근 상태 카드 디자인 개선
- 달력 인터페이스 스타일 업데이트
- 통계 카드 시각화 개선

#### 3.4 현장정보 화면 개선 (30분)
**파일**: `/app/dashboard/site-info/page.tsx`

**변경사항**:
- 현장 정보 카드 스타일 적용
- 자재 현황 위젯 디자인 개선

### ⚡ Phase 4: A/B Testing & Fine-tuning (1시간)

#### 4.1 Feature Flag 시스템 구현 (30분)
**파일**: `/lib/feature-flags.ts` (신규)
```typescript
export const useNewDesign = () => {
  // 환경변수 또는 사용자 설정 기반
  return process.env.NEXT_PUBLIC_NEW_DESIGN === 'true' || false
}

export const FeatureFlag = ({ flag, children, fallback }: {
  flag: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}) => {
  return flag ? <>{children}</> : <>{fallback}</>
}
```

**사용 예시**:
```typescript
import { useNewDesign, FeatureFlag } from '@/lib/feature-flags'

const WorkCard = () => {
  const newDesign = useNewDesign()
  
  return (
    <FeatureFlag 
      flag={newDesign}
      fallback={<Card className="old-style">구 버전</Card>}
    >
      <Card variant="work-card">신 버전</Card>
    </FeatureFlag>
  )
}
```

#### 4.2 사용자 테스트 및 조정 (30분)
- 각 역할별 화면 기능 테스트
- 모바일 디바이스 호환성 확인
- 성능 지표 모니터링

## 🔧 구체적인 파일 변경 목록

### 새로 생성할 파일
- `/lib/feature-flags.ts` - A/B 테스트 시스템
- `/docs/design-system.md` - 디자인 시스템 문서

### 수정할 파일
1. **CSS & 스타일**
   - `/app/globals.css` - CSS 변수 시스템
   - `/app/layout.tsx` - 폰트 시스템

2. **UI 컴포넌트**
   - `/components/ui/card.tsx` - work-card variant
   - `/components/ui/button.tsx` - 새 버튼 variants
   - `/components/ui/unified-mobile-nav.tsx` - 네비게이션 스타일

3. **페이지 컴포넌트**
   - `/components/dashboard/tabs/home-tab.tsx` - 홈 화면
   - `/components/dashboard/tabs/lazy-components.tsx` - 작업일지
   - `/components/attendance/*.tsx` - 출근현황
   - `/app/dashboard/site-info/page.tsx` - 현장정보

## ⏰ 상세 작업 스케줄

### Day 1 (4시간)
- 09:00 - 10:30: Phase 1 (Foundation)
- 10:30 - 12:30: Phase 2 (Component Enhancement)
- 13:30 - 15:30: Phase 3.1-3.2 (홈/작업일지 화면)

### Day 2 (3시간)  
- 09:00 - 11:00: Phase 3.3-3.4 (출근현황/현장정보)
- 11:00 - 12:00: Phase 4 (A/B Testing & 최종 조정)

## 🛡 롤백 계획

### 즉시 롤백 (1분 내)
```bash
# 환경변수 변경으로 즉시 구버전으로 복귀
export NEXT_PUBLIC_NEW_DESIGN=false
```

### 완전 롤백 (5분 내)
```bash
# Git commit 되돌리기
git revert HEAD~[number_of_commits]
npm run build
npm run start
```

### 부분 롤백
- 특정 컴포넌트만 문제 시 해당 variant만 비활성화
- CSS 변수만 문제 시 해당 부분만 원복

## ✅ 완료 체크리스트

### Phase 1: Foundation
- [ ] CSS 변수 시스템 추가 완료
- [ ] Poppins 폰트 통합 완료  
- [ ] 모바일 뷰포트 최적화 완료
- [ ] 다크모드 호환성 확인

### Phase 2: Components
- [ ] work-card variant 구현 완료
- [ ] 새 버튼 variants 구현 완료
- [ ] 네비게이션 스타일 업데이트 완료
- [ ] 컴포넌트 A/B 테스트 가능 확인

### Phase 3: Screens
- [ ] 홈 화면 업데이트 완료
- [ ] 작업일지 화면 업데이트 완료
- [ ] 출근현황 화면 업데이트 완료
- [ ] 현장정보 화면 업데이트 완료

### Phase 4: Testing
- [ ] Feature flag 시스템 구현 완료
- [ ] 사용자 테스트 완료
- [ ] 성능 지표 확인 완료
- [ ] 롤백 계획 검증 완료

## 🚀 Go-Live 준비

### 프로덕션 배포 전 확인사항
1. 모든 기존 기능 정상 동작 확인
2. 모바일 디바이스별 테스트 완료
3. 성능 지표 (Lighthouse 스코어) 유지 확인
4. 사용자 피드백 수집 완료

### 배포 방식
- 점진적 롤아웃 (10% → 50% → 100%)
- 실시간 모니터링 및 피드백 수집
- 문제 발생 시 즉시 롤백 준비

---

**예상 총 작업 시간**: 7시간  
**예상 완료일**: 2일  
**위험도**: 낮음 (기존 기능 보존, 즉시 롤백 가능)