# 모바일 문서함 개선 계획서

## 📋 프로젝트 개요

### 목표

HTML 요구사항 문서와 현재 React 구현체를 면밀히 비교하여, 100% 동일한 기능과 UX를 제공하도록 모바일 문서함 페이지를 개선합니다.

### 분석 대상 파일

- **요구사항**: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/doc.html`
- **현재 구현**: `/modules/mobile/pages/documents-page-v2.tsx`, `.css`
- **라우팅**: `/app/mobile/documents/page.tsx`

## 🔍 상세 분석 결과

### 1. 아키텍처 차이점

| 구분          | HTML 요구사항      | 현재 구현            | 개선 필요도 |
| ------------- | ------------------ | -------------------- | ----------- |
| **기술 스택** | Vanilla JavaScript | React TypeScript     | 🟡 중간     |
| **상태 관리** | DOM + localStorage | React hooks          | 🟢 양호     |
| **스타일링**  | CSS 클래스         | CSS-in-JS + 외부 CSS | 🟢 양호     |

### 2. 기능 차이점 상세 분석

#### A. 🚨 핵심 누락 기능 (우선순위: 높음)

##### 1) 롱프레스 삭제 모드

**HTML 요구사항:**

```javascript
// 롱프레스 감지 로직
let longPressTimer = null
const LONG_PRESS_DURATION = 800

function handleTouchStart(element) {
  longPressTimer = setTimeout(() => {
    enterDeleteMode()
  }, LONG_PRESS_DURATION)
}
```

**현재 구현:** 완전 누락 - 삭제 버튼이 `display: none`으로 숨겨짐

**개선 방안:**

- React useRef와 setTimeout을 활용한 터치 이벤트 처리
- 삭제 모드 상태 관리 (useState)
- 삭제 모드 시각적 피드백 (버튼 표시, 배경 색상 변경)

##### 2) 모달 시스템

**HTML 요구사항:**

```html
<div id="preview-modal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>문서 미리보기</h3>
      <span class="close" onclick="closeModal('preview-modal')">&times;</span>
    </div>
    <div class="modal-body">
      <p>문서 내용이 표시됩니다.</p>
    </div>
  </div>
</div>
```

**현재 구현:** `alert()` 호출로만 대체됨

**개선 방안:**

- 재사용 가능한 Modal 컴포넌트 생성
- 문서 미리보기 모달 구현
- 공유하기 모달 with 옵션 선택
- ESC 키 및 배경 클릭으로 모달 닫기

##### 3) 파일 업로드 및 드래그 앤 드롭

**HTML 요구사항:**

```html
<input type="file" id="file-upload" accept=".pdf,.jpg,.png" multiple style="display: none;" />
<div class="drag-drop-zone" ondrop="handleDrop(event)" ondragover="allowDrop(event)">
  <p>파일을 여기에 드래그하거나 클릭하여 업로드</p>
</div>
```

**현재 구현:** `console.log()` 플레이스홀더만 존재

**개선 방안:**

- 실제 파일 선택 input 구현
- 드래그 앤 드롭 이벤트 핸들링
- 파일 유효성 검사 (크기, 형식)
- 업로드 진행률 표시

##### 4) 로컬스토리지 연동

**HTML 요구사항:**

```javascript
// 문서 상태 저장
function saveDocumentState() {
  const documentData = {
    selectedDocuments: Array.from(selectedDocs),
    activeTab: currentTab,
    searchQuery: document.getElementById('search-input').value,
  }
  localStorage.setItem('documentState', JSON.stringify(documentData))
}
```

**현재 구현:** 폰트 크기만 localStorage 활용

**개선 방안:**

- 선택된 문서 상태 영구 저장
- 탭 상태 및 검색어 복원
- 사용자 환경설정 저장

#### B. 🎨 UX/UI 개선 사항 (우선순위: 중간)

##### 5) 버튼 인터랙션 강화

**HTML 요구사항:**

```css
.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transform: translate(-50%, -50%);
  transition:
    width 0.45s ease,
    height 0.45s ease;
}

.btn.clicked::before {
  width: 300px;
  height: 300px;
}
```

**현재 구현:** 기본 CSS transition만 존재

**개선 방안:**

- 리플 이펙트 애니메이션 구현
- 호버/액티브 상태 강화
- 로딩 상태 표시기 추가

##### 6) 완전한 테마 시스템

**HTML 요구사항:**

```javascript
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme')
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
}
```

**현재 구현:** 폰트 크기 토글만 존재

**개선 방안:**

- 기존 폰트 크기 토글과 테마 토글 통합
- CSS 변수 기반 테마 전환
- 시스템 테마 자동 감지

##### 7) 모바일 터치 최적화

**HTML 요구사항:**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
```

**현재 구현:** 기본 모바일 대응만 존재

**개선 방안:**

- 터치 영역 크기 최적화 (최소 44px)
- 스크롤 관성 및 터치 피드백
- 입력 포커스 시 확대 방지

#### C. 🚀 고급 기능 (우선순위: 낮음)

##### 8) 고도화된 검색 기능

**HTML 요구사항:**

```javascript
let searchDebounceTimer
function handleSearchInput(query) {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    performSearch(query)
    saveSearchHistory(query)
  }, 300)
}
```

**현재 구현:** 즉시 필터링만 구현

**개선 방안:**

- 디바운싱을 통한 성능 최적화
- 검색 히스토리 저장 및 제안
- 카테고리별 필터링 옵션

##### 9) 애니메이션 시스템 강화

**HTML 요구사항:**

```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.doc-selection-card {
  animation: slideInUp 0.3s ease-out;
}
```

**현재 구현:** fadeIn 애니메이션만 존재

**개선 방안:**

- 탭 전환 애니메이션
- 카드 선택/해제 애니메이션
- 마이크로 인터랙션 추가

## 📅 단계별 구현 계획

### Phase 1: 핵심 기능 구현 (1-2주)

#### Week 1

- **롱프레스 삭제 모드 구현**
  - 터치 이벤트 핸들러 추가
  - 삭제 모드 상태 관리
  - 삭제 버튼 표시/숨김 로직

- **모달 시스템 구축**
  - 기본 Modal 컴포넌트 생성
  - 문서 미리보기 모달
  - 모달 상태 관리 및 이벤트 처리

#### Week 2

- **파일 업로드 기능**
  - 파일 선택 UI 구현
  - 드래그 앤 드롭 기능
  - 파일 유효성 검사

- **로컬스토리지 통합**
  - 문서 상태 저장/복원
  - 사용자 환경설정 관리

### Phase 2: UX/UI 개선 (1주)

#### Week 3

- **버튼 인터랙션 강화**
  - 리플 이펙트 구현
  - 호버/액티브 상태 개선

- **테마 시스템 완성**
  - 다크/라이트 모드 토글
  - 기존 폰트 크기 토글과 통합

- **모바일 터치 최적화**
  - 터치 영역 최적화
  - 스크롤 및 제스처 개선

### Phase 3: 고급 기능 및 마무리 (1주)

#### Week 4

- **검색 기능 고도화**
  - 디바운싱 검색
  - 검색 히스토리 기능

- **애니메이션 강화**
  - 전환 애니메이션 추가
  - 마이크로 인터랙션 구현

- **최종 테스트 및 최적화**
  - 성능 최적화
  - 접근성 개선
  - 크로스 브라우저 테스트

## 🛠 기술적 구현 방안

### 1. 파일 구조 설계

```
modules/mobile/
├── components/
│   ├── common/
│   │   ├── Modal.tsx           # 재사용 모달 컴포넌트
│   │   └── FileUpload.tsx      # 파일 업로드 컴포넌트
│   └── documents/
│       ├── DocumentCard.tsx    # 문서 카드 컴포넌트
│       ├── DocumentModal.tsx   # 문서별 모달
│       └── DeleteMode.tsx      # 삭제 모드 컴포넌트
├── hooks/
│   ├── useLongPress.ts         # 롱프레스 훅
│   ├── useLocalStorage.ts      # 로컬스토리지 훅
│   └── useFileUpload.ts        # 파일 업로드 훅
└── pages/
    ├── documents-page-v2.tsx   # 기존 메인 컴포넌트
    └── documents-page-v2.css   # 기존 스타일
```

### 2. 상태 관리 전략

```typescript
// 확장된 상태 관리
const [deleteMode, setDeleteMode] = useState(false)
const [selectedModal, setSelectedModal] = useState<string | null>(null)
const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
const [theme, setTheme] = useState<'light' | 'dark'>('light')

// 커스텀 훅 활용
const longPress = useLongPress(() => setDeleteMode(true), 800)
const { saveState, loadState } = useLocalStorage('documentState')
const { uploadFile, isUploading } = useFileUpload()
```

### 3. 컴포넌트 통합 방식

기존 React 구조를 유지하면서 HTML 요구사항의 모든 기능을 단계적으로 통합:

1. **기존 컴포넌트 확장**: 새로운 props와 이벤트 핸들러 추가
2. **점진적 기능 추가**: 기존 기능을 해치지 않으면서 새 기능 추가
3. **하위 호환성 유지**: 기존 API와 인터페이스 보존

### 4. 성능 최적화 방안

- **React.memo()** 활용으로 불필요한 리렌더링 방지
- **useCallback()** 으로 이벤트 핸들러 최적화
- **useMemo()** 로 계산 비용이 높은 작업 최적화
- **가상 스크롤링** (문서 목록이 많을 경우)

## ✅ 완료 기준 및 검증 방법

### 1. 기능 완성도 검증

- [ ] 모든 HTML 요구사항 기능이 React에서 동일하게 작동
- [ ] 터치 인터랙션 패턴 100% 일치
- [ ] 모달 시스템 완전 구현
- [ ] 파일 업로드 및 관리 기능 완성

### 2. UX/UI 일치도 검증

- [ ] 시각적 디자인 100% 일치
- [ ] 애니메이션 및 전환 효과 동일
- [ ] 반응형 디자인 완벽 대응
- [ ] 접근성 기준 준수

### 3. 성능 및 안정성 검증

- [ ] 모바일 성능 최적화 완료
- [ ] 메모리 누수 없음
- [ ] 오프라인 상황 대응
- [ ] 에러 처리 완성

## 📝 추가 고려사항

### 보안

- 파일 업로드 시 악성 파일 검증
- XSS 방지를 위한 입력값 검증
- CSRF 토큰 활용

### 접근성

- 스크린 리더 호환성
- 키보드 네비게이션 지원
- 고대비 모드 지원

### 국제화

- 다국어 지원 준비
- 텍스트 리소스 분리
- RTL 언어 지원 고려

---

## 📞 연락처 및 리소스

**프로젝트 담당자**: Claude Code Assistant
**작성일**: 2025년 9월 16일
**문서 버전**: 1.0

**참고 자료**:

- HTML 요구사항: `/dy_memo/new_image_html_v2.0/html로 미리보기 화면/doc.html`
- 현재 구현체: `/modules/mobile/pages/documents-page-v2.tsx`
- React 공식 문서: https://react.dev/
- 모바일 UX 가이드라인: https://material.io/design
