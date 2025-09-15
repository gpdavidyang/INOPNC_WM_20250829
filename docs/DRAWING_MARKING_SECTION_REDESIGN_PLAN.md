# 도면마킹 섹션 UI/UX 재설계 계획안

## 문서 개요

**작성일**: 2025-09-15  
**대상 컴포넌트**: DrawingCard (`modules/mobile/components/home/DrawingCard.tsx`)  
**관련 시스템**: SharedMarkupEditor, 모바일 작업일지 시스템  
**목적**: 공도면/마킹도면 워크플로우 최적화를 위한 종합적인 UI/UX 개선

---

## 현재 시스템 분석

### 구현 완료 상황

- ✅ **DrawingCard 기본 구조**: 현장별 공도면 표시 시스템 완료 (`DrawingCard.tsx:24-220`)
- ✅ **SharedMarkupEditor 통합**: 기존 마킹 도구 재사용 (`SharedMarkupEditor.tsx:17-66`)
- ✅ **마킹도구 페이지**: 기본 마킹 기능 구현 (`app/mobile/markup-tool/page.tsx:19-131`)
- ✅ **데이터베이스 연동**: 현장별 공도면 등록 및 조회 시스템

### 현재 워크플로우의 한계

1. **단순한 선형 구조**: 현장 선택 → 공도면 선택 → 마킹도구 → 로컬저장
2. **제한적인 도면 소스**: 현장 등록 공도면만 지원
3. **단일 저장 방식**: localStorage 임시 저장만 가능
4. **마킹도면 재편집 불가**: 기존 마킹된 도면 불러오기 기능 부재
5. **외부 도면 활용 제한**: 갤러리, 로컬폴더, 공유문서함 미지원

---

## 개념 정의 및 워크플로우 분석

### 핵심 개념

- **공도면 (Blank Blueprint)**: 아무 마킹이 되어 있지 않은 빈 도면
- **마킹도면 (Marked Drawing)**: 작업 부분이 표시된 완성된 도면
- **재마킹 (Re-marking)**: 기존 마킹도면에 추가 마킹 작업

### 개선된 워크플로우

```
공도면 단계 → 마킹 단계 → 마킹도면 단계 → 저장/공유 단계
    ↓           ↓           ↓              ↓
도면 선택/    작업 부분    완성된        다양한 저장
업로드       표시         마킹도면      옵션 제공
```

---

## 새로운 UI/UX 설계 계획

### 1. 버튼 레이아웃 재구성

#### A. 상단 섹션: 도면 불러오기 영역

```
┌─────────────────────────────────────────┐
│ 📐 도면 불러오기                           │
├─────────────────────────────────────────┤
│ [공도면 선택] [마킹도면 불러오기] [갤러리]    │
│ [로컬 폴더]   [공유문서함]    [새 업로드]   │
└─────────────────────────────────────────┘
```

#### B. 중단 섹션: 선택된 도면 미리보기

```
┌─────────────────────────────────────────┐
│ 📋 선택된 도면                            │
├─────────────────────────────────────────┤
│ [도면 미리보기 이미지]                      │
│ 파일명: FlowPlan2.jpg                    │
│ 상태: 공도면 | 마킹도면                    │
│ 최종 수정: 2025-09-15 14:30             │
└─────────────────────────────────────────┘
```

#### C. 하단 섹션: 액션 버튼

```
┌─────────────────────────────────────────┐
│ 🛠️ 도면 작업                             │
├─────────────────────────────────────────┤
│ [마킹 시작하기]      [미리보기]            │
│ [저장 옵션 ▼]       [공유하기]            │
└─────────────────────────────────────────┘
```

### 2. 상세 버튼 기능 정의

#### A. 도면 불러오기 버튼들

**1. 공도면 선택** `📐`

- **기능**: 현장별 등록된 빈 공도면 목록 표시
- **현재 상태**: ✅ 구현 완료
- **개선 사항**: 공도면임을 명확히 표시 ("빈 도면" 라벨 추가)
- **데이터 소스**: `documents` 테이블, `categoryType="drawing"`, `sub_type="site_plan"`

**2. 마킹도면 불러오기** `🎨`

- **기능**: 이미 마킹된 도면 목록 표시 (재편집용)
- **구현 필요**: 🔄 새로운 기능
- **데이터 소스**: `markup_documents` 테이블
- **필터링**: `site_id`와 `created_by` 기준
- **API 엔드포인트**: `GET /api/markup-documents?site_id=&user_id=`

**3. 갤러리** `📱`

- **기능**: 모바일 사진첩에서 도면 이미지 선택
- **구현 필요**: 🔄 새로운 기능
- **기술**: `input[type="file"]` + `accept="image/*"` + `capture`
- **용도**: 현장에서 촬영한 스케치나 도면 사진

**4. 로컬 폴더** `📁`

- **기능**: 기기 내 파일 시스템에서 도면 파일 선택
- **구현 필요**: 🔄 새로운 기능
- **기술**: `input[type="file"]` + `accept=".pdf,.jpg,.png,.dwg"`
- **용도**: 사전에 다운로드한 도면 파일들

**5. 공유문서함** `🗂️`

- **기능**: 팀 공유 도면 저장소에서 선택
- **구현 필요**: 🔄 새로운 기능
- **데이터 소스**: `documents` 테이블의 `categoryType="drawing"`
- **필터링**: 현장별 + 공유 권한

**6. 새 업로드** `⬆️`

- **기능**: 새로운 도면 파일을 즉시 업로드
- **구현 필요**: 🔄 새로운 기능
- **워크플로**: 업로드 → 미리보기 → 마킹 시작
- **저장**: 임시 또는 즉시 공유문서함 등록

#### B. 액션 버튼들

**1. 마킹 시작하기** `🖊️`

- **기능**: SharedMarkupEditor 실행
- **현재 상태**: ✅ 구현 완료
- **조건**: 도면이 선택된 경우에만 활성화
- **모드**: `mode="worker"` 또는 `mode="manager"`

**2. 미리보기** `👁️`

- **기능**: 도면을 전체화면으로 보기 (마킹 없이)
- **구현 필요**: 🔄 새로운 기능
- **기술**: Modal + 확대/축소 기능
- **용도**: 도면 내용 확인용

**3. 저장 옵션 (드롭다운)** `💾▼`

- **공유문서함에 저장**: `POST /api/markup-documents`
- **로컬에 다운로드**: blob 다운로드
- **사진첩에 저장**: Canvas → Blob → Navigator.share
- **임시 저장**: localStorage (현재 구현)

**4. 공유하기** `📤`

- **기능**: 완성된 마킹도면을 팀원에게 공유
- **구현 필요**: 🔄 새로운 기능
- **기술**: 웹 Share API + 링크 복사
- **옵션**: 이메일, 메시지, URL 링크

### 3. 상태 관리 개선

#### A. 도면 타입 구분

```typescript
type DrawingType = 'blank_blueprint' | 'marked_drawing' | 'uploaded_image'
type DrawingSource = 'database' | 'gallery' | 'local_file' | 'shared_docs' | 'upload'

interface DrawingFile {
  id: string
  name: string
  type: DrawingType
  source: DrawingSource
  url: string
  isMarked: boolean
  lastModified: Date
  fileSize?: number
  mimeType: string
  description?: string
  uploader?: string
}
```

#### B. UI 상태 관리

```typescript
interface DrawingCardState {
  selectedDrawing: DrawingFile | null
  drawingType: DrawingType
  showPreview: boolean
  isMarkingMode: boolean
  saveOptions: SaveOption[]
  isLoading: boolean
  error: string | null
}

interface SaveOption {
  id: string
  label: string
  type: 'shared' | 'local' | 'gallery' | 'temporary'
  icon: string
}
```

### 4. 사용자 시나리오별 워크플로우

#### 시나리오 1: 새 작업일지 작성 (기본 워크플로우)

1. **공도면 선택** → 현장 등록 공도면 선택
2. **마킹 시작** → SharedMarkupEditor 실행
3. **작업부분 표시** → 펜, 도형 도구로 마킹
4. **공유문서함 저장** → 팀 공유 마킹도면으로 저장

#### 시나리오 2: 기존 마킹도면 수정 (재마킹)

1. **마킹도면 불러오기** → 과거 작성한 마킹도면 목록
2. **기존 도면 선택** → 이전 마킹 내용 포함된 도면 로드
3. **추가 마킹** → 기존 마킹에 새로운 내용 추가
4. **업데이트 저장** → 새 버전으로 저장 또는 기존 버전 갱신

#### 시나리오 3: 외부 도면 활용

1. **갤러리/로컬폴더 선택** → 기기 내 도면 이미지 선택
2. **이미지 업로드** → 임시 또는 공유문서함 업로드
3. **마킹 작업** → 업로드된 도면에 마킹 추가
4. **저장 옵션 선택** → 공유/로컬/갤러리 중 선택하여 저장

#### 시나리오 4: 팀 협업 워크플로우

1. **공유문서함** → 팀원이 작성한 마킹도면 선택
2. **팀원 마킹도면 선택** → 다른 팀원의 작업 내용 확인
3. **추가 마킹** → 협업 마킹 또는 검토 의견 추가
4. **새 버전으로 저장** → 협업 결과물을 새 마킹도면으로 저장

---

## 기술 구현 요구사항

### A. 새로운 API 엔드포인트

#### 마킹도면 관리

```typescript
GET /api/markup-documents?site_id={siteId}&user_id={userId}
// 현장별 사용자 마킹도면 목록 조회

POST /api/documents/upload
// 새 도면 파일 업로드 (갤러리/로컬폴더용)

PUT /api/markup-documents/{id}
// 기존 마킹도면 업데이트 (재마킹)

POST /api/markup-documents/{id}/share
// 마킹도면 공유 링크 생성
```

#### 공유문서함 연동

```typescript
GET /api/shared-documents?type=drawing&site_id={siteId}
// 현장별 공유 도면 목록

POST /api/shared-documents
// 마킹도면을 공유문서함에 저장
```

### B. 파일 처리 기능

#### 이미지 최적화

- **리사이징**: 모바일 화면 최적화 (최대 1920x1080)
- **압축**: JPEG 품질 80% 자동 압축
- **형식 변환**: PDF → 이미지 변환 지원
- **썸네일 생성**: 미리보기용 썸네일 자동 생성

#### 파일 업로드 처리

```typescript
interface FileUploadConfig {
  maxFileSize: number // 10MB
  allowedTypes: string[] // ['image/jpeg', 'image/png', 'application/pdf']
  autoResize: boolean
  generateThumbnail: boolean
}
```

### C. 오프라인 지원

#### ServiceWorker 캐싱

```typescript
// 도면 파일 캐싱 전략
const DRAWING_CACHE = 'drawing-cache-v1'
const MARKUP_CACHE = 'markup-cache-v1'

// 중요 도면은 영구 캐싱
// 임시 마킹 데이터는 세션 캐싱
```

#### IndexedDB 로컬 저장

```typescript
interface OfflineMarkupData {
  id: string
  drawingUrl: string
  markupData: any[]
  timestamp: Date
  syncStatus: 'pending' | 'synced' | 'failed'
}
```

#### 온라인 복구 동기화

- 네트워크 복구 감지
- 오프라인 마킹 데이터 자동 업로드
- 충돌 해결 메커니즘

---

## 접근성 및 사용성

### A. 모바일 최적화

#### 터치 인터페이스

- **버튼 크기**: 최소 44px x 44px (Apple HIG 준수)
- **터치 영역**: 버튼 간 최소 8px 간격
- **제스처 지원**: 스와이프, 핀치 줌, 롱 프레스

#### 한 손 조작 고려

```css
.drawing-actions {
  position: fixed;
  bottom: 20px;
  right: 20px;
  /* 엄지손가락이 닿기 쉬운 영역에 주요 버튼 배치 */
}
```

#### 즐겨찾기 기능

- 자주 사용하는 공도면 즐겨찾기
- 최근 마킹한 도면 빠른 액세스
- 사용 빈도 기반 자동 정렬

### B. 시각적 피드백

#### 아이콘 시스템

- **📐 공도면**: 빈 도면을 나타내는 아이콘
- **🎨 마킹도면**: 마킹된 도면을 나타내는 아이콘
- **📱 갤러리**: 모바일 갤러리 접근
- **📁 로컬폴더**: 파일 시스템 접근
- **🗂️ 공유문서함**: 팀 공유 저장소
- **⬆️ 새 업로드**: 파일 업로드

#### 상태 표시

```typescript
type LoadingState = 'idle' | 'loading' | 'success' | 'error'
type DrawingStatus = 'blank' | 'marked' | 'shared' | 'private'

interface StatusIndicator {
  state: LoadingState
  status: DrawingStatus
  progress?: number // 0-100
  message?: string
}
```

#### 진행률 표시

- 파일 업로드 진행률
- 마킹 저장 진행률
- 동기화 상태 표시

### C. 성능 최적화

#### 이미지 지연 로딩

```typescript
const LazyDrawingPreview = ({ src, alt }: { src: string; alt: string }) => {
  const [imageSrc, setImageSrc] = useState<string>()
  const [isVisible, setIsVisible] = useState(false)

  // Intersection Observer로 뷰포트 진입 시 로딩
  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src)
    }
  }, [isVisible, src, imageSrc])
}
```

#### 메모리 효율적인 캔버스 처리

```typescript
// 캔버스 메모리 관리
const OptimizedCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 컴포넌트 언마운트 시 캔버스 정리
  useEffect(() => {
    return () => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }, [])
}
```

#### 썸네일 캐싱 전략

```typescript
interface ThumbnailCache {
  original: string
  thumbnail: string
  size: 'small' | 'medium' | 'large'
  expiresAt: Date
}
```

---

## 구현 단계별 로드맵

### Phase 1: 기본 다중 소스 지원 (2주)

1. **마킹도면 불러오기 API 구현**
   - `GET /api/markup-documents` 엔드포인트
   - 기존 마킹도면 목록 UI
2. **갤러리/로컬폴더 파일 선택**
   - 파일 입력 인터페이스
   - 이미지 업로드 및 미리보기

3. **버튼 레이아웃 재구성**
   - 3단 구조로 UI 변경
   - 6개 소스 버튼 추가

### Phase 2: 저장 옵션 다양화 (2주)

1. **드롭다운 저장 메뉴**
   - 4가지 저장 옵션 UI
   - 각 저장 방식별 로직 구현

2. **공유문서함 연동**
   - 팀 공유 저장소 API
   - 권한 기반 접근 제어

3. **로컬/갤러리 저장**
   - Blob 다운로드 기능
   - Navigator.share API 활용

### Phase 3: 고급 기능 및 최적화 (3주)

1. **미리보기 및 공유 기능**
   - 전체화면 도면 뷰어
   - 공유 링크 생성

2. **성능 최적화**
   - 이미지 지연 로딩
   - 썸네일 캐싱
   - 메모리 관리

3. **오프라인 지원**
   - ServiceWorker 구현
   - IndexedDB 동기화
   - 네트워크 복구 처리

### Phase 4: 사용자 경험 개선 (1주)

1. **접근성 향상**
   - 터치 최적화
   - 한 손 조작 지원
2. **즐겨찾기 및 최근 사용**
   - 사용 패턴 학습
   - 빠른 액세스 제공

3. **최종 테스트 및 버그 수정**

---

## 예상 효과 및 성과 지표

### A. 사용자 경험 개선

- **작업 효율성**: 도면 선택 시간 70% 단축
- **재사용성**: 기존 마킹도면 활용률 증가
- **유연성**: 다양한 도면 소스 지원으로 활용도 증가

### B. 기능적 개선

- **협업 강화**: 팀 간 마킹도면 공유 활성화
- **데이터 보존**: 체계적인 마킹도면 아카이빙
- **접근성**: 오프라인 환경에서도 도면 작업 가능

### C. 기술적 성과

- **성능 향상**: 이미지 최적화로 로딩 시간 단축
- **안정성**: 오프라인 지원으로 데이터 손실 방지
- **확장성**: 다양한 파일 형식 및 저장소 지원

---

## 위험 요소 및 대응 방안

### A. 기술적 위험

**위험**: 대용량 이미지 파일 처리로 인한 성능 저하  
**대응**: 자동 리사이징, 압축, 지연 로딩 적용

**위험**: 오프라인 동기화 충돌  
**대응**: 타임스탬프 기반 충돌 해결, 사용자 선택 옵션 제공

### B. 사용성 위험

**위험**: 복잡한 UI로 인한 사용자 혼란  
**대응**: 단계별 출시, 사용자 피드백 기반 개선

**위험**: 기존 사용자의 적응 어려움  
**대응**: 기존 기능 유지하면서 점진적 기능 추가

### C. 데이터 위험

**위험**: 마킹 데이터 손실  
**대응**: 다중 백업, 자동 저장, 복구 메커니즘 구현

---

## 결론

본 재설계 계획안은 현재의 단순한 공도면 선택 시스템을 **종합적인 도면 관리 및 마킹 플랫폼**으로 발전시키는 것을 목표로 합니다.

**핵심 가치**:

- 🎯 **워크플로우 최적화**: 공도면 → 마킹 → 저장 → 공유의 완전한 생명주기 지원
- 🔄 **재사용성 극대화**: 기존 마킹도면 활용 및 재편집 기능
- 🤝 **협업 강화**: 팀 간 도면 공유 및 협업 마킹 지원
- 📱 **모바일 최적화**: 현장 중심의 모바일 환경에 특화된 UX

이 계획안을 바탕으로 단계적 구현을 진행하면, 사용자들이 요구하는 **전문적이고 효율적인 도면 마킹 도구**를 제공할 수 있을 것입니다.

---

_작성자: Claude AI Assistant_  
_최종 수정일: 2025-09-15_
