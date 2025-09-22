# 모바일 홈 화면 v2.0 구현 계획서 (개정판)

## 📅 작성일: 2025-09-15
## 📋 작성자: Claude Code Assistant  
## 🎯 목적: 새로운 디자인 요구사항(v2.0) 완전 분석 및 구현 계획

---

## 🔍 중요 발견사항

### **새 디자인 폴더는 완전한 Next.js 구현체입니다!**
- `/dy_memo/new_image_html_v2.0/`는 단순 HTML이 아닌 **Next.js App Router 기반 완전 구현**
- `base.html`과 `main.html`을 Next.js로 자동 변환한 프로젝트
- TSX 컴포넌트, CSS 시스템, 이미지 애셋 모두 포함

---

## 1. 파일 구조 분석

### 1.1 새 디자인 폴더 구조 (v2.0)
```
/dy_memo/new_image_html_v2.0/
├── README.md                    # Next.js 프로젝트 설명
├── app/
│   ├── page.tsx                # base.html 변환 (홈)
│   ├── main/
│   │   └── page.tsx            # main.html 변환 (메인 작업폼)
│   ├── globals.css             # 통합 스타일시트 (60,831 tokens!)
│   ├── layout.tsx              # 루트 레이아웃
│   └── components/
│       └── LegacyInlineScripts.tsx  # 인라인 스크립트
├── ino.css                     # 커스텀 디자인 토큰
├── public/images/              # 이미지 애셋
└── html로 미리보기 화면/       # 원본 HTML 참조
    ├── base.html               # 홈 원본
    ├── main.html               # 메인 원본  
    └── [HOME]데이터 로직 요약.txt
```

### 1.2 현재 구현 구조
```
/modules/mobile/
├── components/home/
│   ├── HomePage.tsx            # 현재 홈 구현
│   ├── QuickMenu.tsx          # 빠른메뉴
│   ├── NoticeSection.tsx      # 공지사항
│   └── WorkCard.tsx           # 작업카드
└── styles/
    ├── home.css               # 홈 스타일
    └── mobile-global.css      # 글로벌 스타일
```

---

## 2. 핵심 차이점 분석 (정밀 비교)

### 2.1 데이터 구조 차이

#### 현재 구현 (HomePage.tsx)
```typescript
// 단순한 상태 관리
const [selectedSite, setSelectedSite] = useState('')
const [workDate, setWorkDate] = useState('')
const [workCards, setWorkCards] = useState([{ id: 1 }])
```

#### 새 디자인 (main/page.tsx)
```javascript
// 복잡한 상태 객체
const state = {
    author: 'john',           // 작성자
    date: '',                // 작업일자
    site: '',                // 현장
    location: {              // 위치 정보
        block: '',           // 블럭
        dong: '',            // 동
        ho: ''               // 호수
    },
    men: 1,                  // 공수
    additionalTags: [],      // 추가 작업구간
    additionalManpower: [],  // 추가 공수
    photos: {
        pre: [],             // 보수 전 사진
        post: [],            // 보수 후 사진
        drawing: []          // 도면
    }
}
```

### 2.2 UI 컴포넌트 차이

| 기능 | 현재 구현 | 새 디자인 (v2.0) | 구현 필요 |
|------|----------|------------------|-----------|
| **소속 선택** | ❌ 없음 | ✅ 드롭다운 (4개 옵션) | 🔴 필수 |
| **블럭/동/호수** | ❌ 없음 | ✅ 3개 입력 필드 | 🔴 필수 |
| **부재명 선택** | ❌ 없음 | ✅ 버튼 그룹 (슬라브/거더/벽체/기둥) | 🔴 필수 |
| **작업구간 태그** | ❌ 없음 | ✅ 동적 추가/삭제 | 🔴 필수 |
| **공수 증감** | ❌ 텍스트 입력 | ✅ +/- 버튼 (0.5 단위) | 🔴 필수 |
| **추가 공수** | ❌ 없음 | ✅ 작업자별 공수 관리 | 🔴 필수 |
| **전/후 사진 분리** | ⚠️ 일괄 업로드 | ✅ 카테고리별 분리 | 🔴 필수 |
| **도면마킹** | ❌ 없음 | ✅ Canvas 기반 마킹 | 🟡 중요 |
| **작성 요약** | ❌ 없음 | ✅ 실시간 프리뷰 | 🟡 중요 |
| **리셋 기능** | ⚠️ 기본 리셋 | ✅ 전체 폼 초기화 | 🟢 보조 |

---

## 3. CSS 시스템 분석

### 3.1 새 디자인 CSS 토큰 (ino.css)
```css
:root {
  /* 폰트 시스템 */
  --font-sans: "Noto Sans KR", system-ui;
  --font-brand: "Poppins", var(--font-sans);
  
  /* 타이포그래피 스케일 */
  --fs-title: 24px;    /* 700 */
  --fs-h2: 18px;       /* 600 */
  --fs-body: 15px;     /* 600 */
  --fs-cap: 14px;      /* 400 */
  --fs-ctl: 14px;      /* 600 */
  
  /* 색상 시스템 */
  --bg: #F6F9FF;
  --surface: #FFFFFF;
  --ink: #1A1A1A;
  --brand: #1A254F;
  --accent: #0068FE;
  --danger: #EA3829;
  
  /* 태그 색상 */
  --tag1: #33E6F6;
  --tag3: #2934D0;
  --tag4: #FFC6E6;
  --tag4-ink: #FF3399;
  
  /* 컨트롤 크기 */
  --btn-h: 44px;
  --chip-h: 48px;
  --r: 14px;
}
```

### 3.2 현재 구현과 비교
- 현재: 기본 CSS 변수 사용
- v2.0: **정교한 디자인 토큰 시스템**
- 필요: CSS 변수 통합 및 일관성 확보

---

## 4. 구현 전략 (수정)

### 📌 전략 변경사항
1. **HTML을 직접 JSX로 변환하지 않음** - 이미 Next.js 구현 존재
2. **기존 v2.0 코드를 참조하여 현재 시스템에 통합**
3. **dangerouslySetInnerHTML 대신 React 컴포넌트로 재구성**

### 4.1 Phase 1: 데이터 구조 정비
```typescript
// types/worklog.ts
interface WorkLogState {
  author: string;
  date: string;
  department: string;  // 신규: 소속
  site: string;
  location: {
    block: string;
    dong: string;
    ho: string;
  };
  memberType: string;  // 신규: 부재명
  workSections: WorkSection[];  // 신규: 작업구간
  manpower: {
    main: number;
    additional: AdditionalManpower[];
  };
  photos: {
    before: File[];
    after: File[];
    drawings: DrawingMark[];
  };
}
```

### 4.2 Phase 2: 컴포넌트 매핑

| v2.0 기능 | 새 컴포넌트 | 우선순위 |
|-----------|------------|----------|
| 소속 선택 | `DepartmentSelect.tsx` | 🔴 높음 |
| 블럭/동/호수 | `LocationInput.tsx` | 🔴 높음 |
| 부재명 버튼 | `MemberTypeButtons.tsx` | 🔴 높음 |
| 작업구간 | `WorkSectionManager.tsx` | 🔴 높음 |
| 공수 컨트롤 | `ManpowerControl.tsx` | 🔴 높음 |
| 추가 공수 | `AdditionalManpower.tsx` | 🔴 높음 |
| 사진 분리 업로드 | `PhotoUploadSplit.tsx` | 🟡 중간 |
| 도면마킹 | `DrawingCanvas.tsx` | 🟡 중간 |
| 작성 요약 | `WorkSummaryPanel.tsx` | 🟡 중간 |

---

## 5. 구체적 구현 계획

### 5.1 즉시 구현 가능 (v2.0 코드 활용)

#### A. 숫자 증감 컨트롤 (v2.0에서 추출)
```javascript
// v2.0의 공수 컨트롤 로직
const dataValues = '0,0.5,1,1.5,2,2.5,3';
const values = dataValues.split(',').map(v => parseFloat(v));
let currentIndex = 2; // 기본값 1

function decrease() {
  if (currentIndex > 0) {
    currentIndex--;
    updateValue(values[currentIndex]);
  }
}

function increase() {
  if (currentIndex < values.length - 1) {
    currentIndex++;
    updateValue(values[currentIndex]);
  }
}
```

#### B. 작업구간 동적 관리 (v2.0에서 추출)
```javascript
// v2.0의 추가 태그 로직
function addWorkSection() {
  const tagId = 'tag_' + Date.now();
  const newTag = {
    id: tagId,
    type: '',
    name: '',
    block: { txt: '', val: '' },
    dong: '',
    ho: ''
  };
  state.additionalTags.push(newTag);
  renderWorkSection(newTag);
}
```

#### C. 사진 드래그&드롭 (v2.0에서 추출)
```javascript
// v2.0의 사진 카테고리 이동
function movePhotoBetweenCategories(photoId, fromType, toType) {
  const fromArray = state.photos[fromType];
  const toArray = state.photos[toType];
  
  const photoIndex = fromArray.findIndex(p => p.id === photoId);
  if (photoIndex !== -1) {
    const photo = fromArray.splice(photoIndex, 1)[0];
    toArray.push(photo);
    updatePhotoCounters();
  }
}
```

---

## 6. 스타일 통합 계획

### 6.1 CSS 마이그레이션
1. `ino.css`의 디자인 토큰을 `/modules/mobile/styles/tokens.css`로 추출
2. `globals.css`의 컴포넌트 스타일을 개별 모듈로 분리
3. 다크모드 변수 통합

### 6.2 주요 스타일 클래스 매핑
```css
/* v2.0 클래스 → 현재 시스템 */
.form-section → .work-form-section
.form-row → .form-grid
.form-group → .form-field
.form-input → .input-field
.form-select → .select-field
.number-input → .number-control
.option-btn → .toggle-button
.delete-tag-btn → .remove-button
```

---

## 7. 구현 일정 (수정)

### Week 1 (즉시 구현)
- [ ] 데이터 구조 타입 정의
- [ ] 소속/현장 선택 드롭다운
- [ ] 블럭/동/호수 입력 필드
- [ ] 부재명 버튼 그룹
- [ ] 공수 증감 컨트롤

### Week 2  
- [ ] 작업구간 동적 관리
- [ ] 추가 공수 시스템
- [ ] 전/후 사진 분리
- [ ] 작성 요약 패널

### Week 3
- [ ] 도면마킹 기능
- [ ] 드래그&드롭 개선
- [ ] 전체 통합 테스트

---

## 8. 리스크 분석 (업데이트)

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| v2.0 코드가 `dangerouslySetInnerHTML` 사용 | 높음 | React 컴포넌트로 재작성 필요 |
| 인라인 스크립트 의존성 | 높음 | React hooks로 마이그레이션 |
| 60,000+ 토큰의 CSS 파일 | 중간 | 필요한 스타일만 추출 |
| Canvas API 브라우저 호환성 | 낮음 | 폴리필 또는 대체 UI |

---

## 9. 코드 재사용 전략

### 9.1 v2.0에서 직접 사용 가능
- CSS 변수 시스템 (ino.css)
- 이미지 애셋 (/public/images/)
- 폼 검증 로직
- 로컬스토리지 저장 로직

### 9.2 수정 후 사용
- HTML 구조 → JSX 컴포넌트
- 인라인 이벤트 → React 이벤트 핸들러
- DOM 조작 → React state

### 9.3 새로 작성 필요
- TypeScript 타입 정의
- React hooks 구조
- 백엔드 API 연동
- 테스트 코드

---

## 10. 핵심 인사이트

### ✅ 좋은 소식
1. **v2.0은 이미 Next.js로 구현됨** - 코드 참조 가능
2. **완전한 디자인 시스템 존재** - CSS 토큰 재사용
3. **모든 로직 구현됨** - JavaScript 코드 변환 가능

### ⚠️ 주의사항
1. **HTML 직접 렌더링** - React 방식으로 변경 필요
2. **인라인 스크립트** - 모듈화 필요
3. **거대한 CSS 파일** - 최적화 필요

---

## 11. 최종 권장사항

### 구현 접근법
1. **단계적 마이그레이션**: v2.0 코드를 참조하되 React 방식으로 재작성
2. **컴포넌트 우선**: 작은 단위부터 구현 후 조합
3. **스타일 최적화**: 필요한 CSS만 추출하여 사용

### 예상 소요시간 (수정)
- Phase 1 (핵심 기능): **3-4시간**
- Phase 2 (사진/요약): **2-3시간**
- Phase 3 (도면마킹): **2시간**
- **총 예상: 7-9시간**

---

## 12. 다음 단계

1. ✅ **이 계획서 검토 및 승인**
2. 🚀 **Phase 1 즉시 시작**
3. 📝 **진행 상황 일일 보고**

---

*이 문서는 v2.0 폴더의 모든 파일(HTML, CSS, TSX, 이미지)을 분석하여 작성되었습니다.*
*작성일: 2025-09-15 | 개정: 완전 분석 버전*