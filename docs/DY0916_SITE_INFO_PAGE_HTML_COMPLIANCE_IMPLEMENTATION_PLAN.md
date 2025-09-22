# DY0916 - SiteInfoPage HTML 요구사항 완전 준수 구현 계획서

**작성일:** 2025-09-16  
**작성자:** Development Team  
**프로젝트:** INOPNC WM v2.0 Mobile SiteInfoPage 개선  
**참조 문서:** `dy_memo/new_image_html_v2.0/html로 미리보기 화면/site.html`

---

## 📋 개요

HTML 요구사항 파일(`site.html`)과 현재 React 구현(`modules/mobile/components/site/SiteInfoPage.tsx`)을 100% 일치시키기 위한 8단계 구현 계획서입니다. 현재 React 구현은 부분적으로만 HTML 요구사항을 반영하고 있어, 전면적인 재구조화가 필요한 상황입니다.

## 🎯 프로젝트 목표

1. **구조적 일치**: HTML 요구사항과 동일한 단일 현장 카드 구조 구현
2. **기능적 완전성**: NPC-1000 자재관리 시스템 완전 구현
3. **사용자 경험 향상**: T-map 연동, 확장 가능한 텍스트, 리플 애니메이션 등
4. **접근성 준수**: 폰트 크기 조절, 다크 모드, 반응형 디자인 완벽 지원
5. **성능 최적화**: 캐시 관리 및 실시간 localStorage 동기화

---

## 📊 현재 상태 분석

### ✅ 구현 완료 항목

- [x] 기본 단일 현장 카드 레이아웃
- [x] localStorage 기반 현장 선택 및 동기화
- [x] 상세 정보 토글 기능
- [x] 기본 NPC-1000 KPI 표시
- [x] 첨부파일 3-카테고리 분류 (공도면, PTW, 현장사진)
- [x] HTML Dialog 요소 활용
- [x] 다크 모드 CSS 지원
- [x] 반응형 브레이크포인트 (768px, 480px)
- [x] 폰트 크기 조절 지원 (fs-100, fs-150)

### ❌ 미구현 항목

- [ ] 완전한 NPC-1000 자재관리 워크플로우
- [ ] T-map/Kakao Map 네비게이션 통합
- [ ] 리플 애니메이션 인터랙션 효과
- [ ] 확장 가능한 텍스트 컴포넌트 완전 구현
- [ ] 첨부파일 미리보기 고도화
- [ ] 캐시 가드 시스템 (CacheGuard)
- [ ] 완전한 HTML 스타일링 일치

---

## 🏗️ 8단계 구현 계획

### Phase 1: 기본 구조 재설계 (3시간) 🔴 Critical

**목표:** React 컴포넌트를 HTML 요구사항과 완전히 일치하도록 재구조화

#### 1.1 현장 선택 메커니즘 개선

```typescript
// 현재: 다중 사이트 리스트 → 변경: localStorage 기반 단일 사이트
const [currentSite, setCurrentSite] = useState<SiteInfo | null>(null)

// localStorage 실시간 동기화 강화
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'state_site' && e.newValue) {
      updateCurrentSite(e.newValue)
    }
  }
  window.addEventListener('storage', handleStorageChange)
}, [])
```

#### 1.2 카드 헤더 구조 완전 일치

```typescript
interface CardHeaderProps {
  siteName: string
  workDate: string
  siteIcon: string
}

// HTML과 동일한 그리드 구조: 40px 1fr auto
<div className="card-header">
  <div className="site-icon">{siteIcon}</div>
  <h2 className="site-name q">{siteName}</h2>
  <div className="work-date">{workDate}</div>
</div>
```

#### 1.3 정보 행 (info-row) 표준화

```typescript
// HTML 요구사항: 80px 1fr auto 그리드
<div className="info-row">
  <span className="info-label">소속</span>
  <span className="info-value">{org}</span>
  <div className="info-actions">
    <button className="action-btn">액션</button>
  </div>
</div>
```

### Phase 2: NPC-1000 자재관리 시스템 완전 구현 (4시간) 🔴 Critical

**목표:** HTML과 동일한 완전한 자재관리 시스템 구현

#### 2.1 NPC 데이터 구조 확장

```typescript
interface NPCSystemState {
  currentStock: number
  dailyStats: {
    inQty: number
    outQty: number
    netChange: number
  }
  logs: NPCLog[]
  requests: NPCRequest[]
  alerts: NPCAlert[]
}

interface NPCLog {
  id: string
  date: string
  type: 'in' | 'out'
  quantity: number
  memo: string
  operator: string
  timestamp: Date
}
```

#### 2.2 자재 요청 워크플로우

```typescript
// 요청 → 승인 → 입고 → 사용 전체 프로세스
const handleMaterialRequest = async (requestData: NPCRequestData) => {
  const request: NPCRequest = {
    id: generateId(),
    siteName: requestData.site,
    quantity: requestData.qty,
    reason: requestData.memo,
    status: 'pending',
    submittedAt: new Date(),
    approver: null,
  }

  // 요청 저장 및 알림
  await saveNPCRequest(request)
  await notifyApprover(request)
}
```

#### 2.3 실시간 KPI 계산 엔진

```typescript
const useNPCKPI = (siteId: string) => {
  const [kpi, setKPI] = useState<NPCKPI>()

  useEffect(() => {
    const calculateKPI = () => {
      const logs = getNPCLogs(siteId)
      const today = formatDate(new Date())

      return {
        dailyIn: logs
          .filter(l => l.type === 'in' && l.date === today)
          .reduce((sum, l) => sum + l.quantity, 0),
        dailyOut: logs
          .filter(l => l.type === 'out' && l.date === today)
          .reduce((sum, l) => sum + l.quantity, 0),
        currentStock: calculateCurrentStock(siteId),
        trend: calculateTrend(siteId, 7), // 7일 트렌드
      }
    }

    setKPI(calculateKPI())
  }, [siteId])

  return kpi
}
```

### Phase 3: 첨부파일 시스템 고도화 (2.5시간) 🟡 High

**목표:** 파일 미리보기, 다운로드, 전체화면 보기 기능 완성

#### 3.1 고급 미리보기 시스템

```typescript
const FilePreviewModal = ({ file, onClose }: FilePreviewProps) => {
  const [previewContent, setPreviewContent] = useState<PreviewContent | null>(null)

  useEffect(() => {
    const loadPreview = async () => {
      const extension = file.name.split('.').pop()?.toLowerCase()

      switch (extension) {
        case 'pdf':
          setPreviewContent({ type: 'pdf', url: file.url })
          break
        case 'jpg':
        case 'jpeg':
        case 'png':
          setPreviewContent({ type: 'image', url: file.url })
          break
        case 'dwg':
          setPreviewContent({ type: 'cad', thumbnail: await generateCADThumbnail(file.url) })
          break
        default:
          setPreviewContent({ type: 'unsupported', message: '미리보기를 지원하지 않는 파일입니다.' })
      }
    }

    loadPreview()
  }, [file])

  return (
    <div className="preview-modal fullscreen">
      {/* 전체화면 미리보기 구현 */}
    </div>
  )
}
```

#### 3.2 첨부파일 카테고리별 관리

```typescript
interface AttachmentManager {
  drawings: AttachmentFile[]  // 현장 공도면
  ptw: AttachmentFile[]       // PTW
  photos: AttachmentFile[]    // 현장 사진
}

const AttachmentPopup = ({ site, onClose }: AttachmentPopupProps) => {
  const attachments = useAttachments(site.id)

  return (
    <div className="attachment-popup">
      {Object.entries(attachments).map(([category, files]) => (
        <AttachmentCategory
          key={category}
          title={getCategoryTitle(category)}
          files={files}
          onFileAction={(file, action) => handleFileAction(file, action)}
        />
      ))}
    </div>
  )
}
```

### Phase 4: 확장 가능한 UI 컴포넌트 (2시간) 🟡 High

**목표:** 텍스트 확장, 토글, 애니메이션 등 인터랙티브 요소 완성

#### 4.1 확장 가능한 텍스트 컴포넌트

```typescript
const ExpandableText = ({ text, maxLength = 50, className = "" }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const shouldTruncate = text.length > maxLength

  return (
    <span
      className={`expandable-text ${className} ${isExpanded ? 'expanded' : ''}`}
      onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
    >
      {isExpanded || !shouldTruncate ? text : `${text.slice(0, maxLength)}...`}
      {shouldTruncate && (
        <span className="expand-indicator">
          {isExpanded ? ' 접기' : ' 더보기'}
        </span>
      )}
    </span>
  )
}
```

#### 4.2 상세 정보 토글 개선

```typescript
const DetailSection = ({ isVisible, children }: DetailSectionProps) => {
  return (
    <div className={`detail-section ${isVisible ? 'show' : ''}`}>
      <div className="detail-content">
        {children}
      </div>
    </div>
  )
}

// CSS 애니메이션
.detail-section {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.detail-section.show {
  max-height: 1000px;
  opacity: 1;
}
```

### Phase 5: T-map 네비게이션 및 외부 연동 (1.5시간) 🔵 Medium

**목표:** T-map/Kakao Map 완전 통합 및 전화 연결 기능

#### 5.1 T-map 통합 시스템

```typescript
const NavigationService = {
  async openTmap(address: string): Promise<void> {
    const tmapScheme = `tmap://search?name=${encodeURIComponent(address)}`
    const tmapWebUrl = `https://tmapapi.sktelecom.com/main/map.html?q=${encodeURIComponent(address)}`

    try {
      // 모바일 앱 실행 시도
      window.location.href = tmapScheme

      // 앱이 없으면 웹 버전으로 fallback
      setTimeout(() => {
        const userChoice = confirm(
          'T맵 앱이 설치되어 있지 않습니다.\n\n"확인"을 누르면 T맵 웹으로 이동합니다.\n"취소"를 누르면 카카오맵으로 이동합니다.'
        )

        if (userChoice) {
          window.open(tmapWebUrl, '_blank')
        } else {
          window.open(`https://map.kakao.com/?q=${encodeURIComponent(address)}`, '_blank')
        }
      }, 1000)
    } catch (error) {
      // 에러 발생 시 카카오맵으로 fallback
      window.open(`https://map.kakao.com/?q=${encodeURIComponent(address)}`, '_blank')
    }
  },
}
```

#### 5.2 통화 및 복사 기능 강화

```typescript
const ContactActions = {
  async makeCall(phoneNumber: string): Promise<void> {
    if (!phoneNumber || phoneNumber === '-') {
      throw new Error('전화번호가 없습니다.')
    }

    // 전화번호 형식 검증 및 정규화
    const normalizedNumber = normalizePhoneNumber(phoneNumber)
    window.location.href = `tel:${normalizedNumber}`
  },

  async copyToClipboard(text: string): Promise<void> {
    if (!text || text === '-') {
      throw new Error('복사할 내용이 없습니다.')
    }

    try {
      await navigator.clipboard.writeText(text)
      showToast('복사되었습니다.')
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('복사되었습니다.')
    }
  },
}
```

### Phase 6: 접근성 및 반응형 디자인 완성 (2시간) 🔵 Medium

**목표:** 완전한 접근성 지원 및 모든 디바이스 대응

#### 6.1 폰트 크기 시스템 완성

```css
/* 기본 크기 (fs-100) */
body.fs-100 .site-info-card {
  --base-font-size: 15px;
  --title-font-size: 17px;
  --button-padding: 8px 16px;
}

/* 큰글씨 모드 (fs-150) */
body.fs-150 .site-info-card {
  --base-font-size: 1.125rem;
  --title-font-size: 1.25rem;
  --button-padding: 12px 18px;
}

.site-name {
  font-size: var(--title-font-size);
  word-break: keep-all;
  line-height: 1.4;
}

.info-label,
.info-value {
  font-size: var(--base-font-size);
}

.btn-detail,
.btn-attachment {
  padding: var(--button-padding);
  font-size: var(--base-font-size);
}
```

#### 6.2 완전한 반응형 브레이크포인트

```css
/* Desktop First Approach */
.site-info-card {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* Tablet (768px) */
@media (max-width: 768px) {
  .site-info-card {
    padding: 16px;
    margin: 0 8px;
  }

  .info-row {
    grid-template-columns: 70px 1fr auto;
    gap: 8px;
  }

  .site-name {
    font-size: 16px;
    max-width: 250px;
  }
}

/* Mobile (480px) */
@media (max-width: 480px) {
  .site-info-card {
    padding: 12px;
    margin: 4px;
  }

  .info-row {
    grid-template-columns: 60px 1fr;
    gap: 6px;
  }

  .info-actions {
    grid-column: 1 / -1;
    justify-self: end;
    margin-top: 4px;
  }

  .site-name {
    font-size: 15px;
    max-width: 200px;
  }
}

/* Small Mobile (360px) */
@media (max-width: 360px) {
  .site-info-card {
    padding: 10px;
    margin: 2px;
  }

  .site-name {
    font-size: 14px;
    max-width: 180px;
  }

  .action-btn {
    padding: 4px 6px;
    font-size: 11px;
  }
}
```

### Phase 7: 리플 애니메이션 및 인터랙션 효과 (1시간) 🟢 Low

**목표:** HTML과 동일한 시각적 피드백 효과 구현

#### 7.1 리플 애니메이션 시스템

```typescript
const useRipple = () => {
  const addRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const ripple = document.createElement('span')

    const diameter = Math.max(rect.width, rect.height)
    const radius = diameter / 2

    ripple.style.width = ripple.style.height = `${diameter}px`
    ripple.style.left = `${event.clientX - rect.left - radius}px`
    ripple.style.top = `${event.clientY - rect.top - radius}px`
    ripple.classList.add('ripple-ink')

    button.appendChild(ripple)

    setTimeout(() => {
      ripple.remove()
    }, 450)
  }, [])

  return addRipple
}

// CSS 애니메이션
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple-ink {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  transform: scale(0);
  animation: ripple 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}
```

#### 7.2 버튼 및 카드 호버 효과

```css
.btn-detail,
.btn-attachment,
.action-btn {
  position: relative;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateY(0);
}

.btn-detail:hover,
.btn-attachment:hover,
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.site-info-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-info-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
```

### Phase 8: 캐시 관리 및 최종 통합 테스트 (1.5시간) 🔵 Medium

**목표:** 성능 최적화 및 HTML 요구사항 완전 준수 검증

#### 8.1 캐시 가드 시스템 (CacheGuard)

```typescript
class CacheGuard {
  private static readonly CACHE_VERSION = 'site-info-v1.2.0'
  private static readonly CACHE_KEYS = {
    SITE_DATA: 'siteData',
    NPC_DATA: 'npcData',
    ATTACHMENT_DATA: 'attachmentData',
    USER_PREFERENCES: 'userPreferences',
  }

  static validateCache(): boolean {
    const version = localStorage.getItem('cacheVersion')
    return version === this.CACHE_VERSION
  }

  static invalidateCache(): void {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    localStorage.setItem('cacheVersion', this.CACHE_VERSION)
  }

  static getCachedData<T>(key: string): T | null {
    if (!this.validateCache()) {
      this.invalidateCache()
      return null
    }

    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
  }

  static setCachedData<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      localStorage.setItem('cacheVersion', this.CACHE_VERSION)
    } catch (error) {
      console.warn('Cache storage failed:', error)
    }
  }
}
```

#### 8.2 성능 모니터링

```typescript
const PerformanceMonitor = {
  measureRenderTime: (componentName: string) => {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value
      descriptor.value = function (...args: any[]) {
        const start = performance.now()
        const result = method.apply(this, args)
        const end = performance.now()

        if (end - start > 16) {
          // > 1 frame
          console.warn(`${componentName}.${propertyName} took ${end - start}ms`)
        }

        return result
      }
    }
  },

  trackMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
      })
    }
  },
}
```

---

## 🧪 테스트 계획

### 단위 테스트

```typescript
describe('SiteInfoPage', () => {
  test('localStorage 동기화가 정상 작동하는가', async () => {
    render(<SiteInfoPage />)

    act(() => {
      localStorage.setItem('state_site', '삼성전자 평택캠퍼스 P3')
    })

    expect(screen.getByText('삼성전자 평택캠퍼스 P3')).toBeInTheDocument()
  })

  test('NPC KPI 계산이 정확한가', () => {
    const logs = [
      { date: '2025-09-16', type: 'in', qty: 100, memo: '입고' },
      { date: '2025-09-16', type: 'out', qty: 30, memo: '사용' }
    ]

    const kpi = calculateNpcKPI({ initialStock: 200, logs })
    expect(kpi.currentStock).toBe(270)
  })
})
```

### 통합 테스트

```typescript
describe('SiteInfoPage Integration', () => {
  test('전체 워크플로우가 정상 작동하는가', async () => {
    const user = userEvent.setup()
    render(<SiteInfoPage />)

    // 현장 선택
    localStorage.setItem('state_site', '테스트 현장')

    // 상세 정보 토글
    await user.click(screen.getByText('상세'))
    expect(screen.getByText('부제목')).toBeInTheDocument()

    // NPC 기록 추가
    await user.click(screen.getByText('입고 기록'))
    await user.type(screen.getByLabelText('수량'), '50')
    await user.click(screen.getByText('저장'))

    // KPI 업데이트 확인
    expect(screen.getByText('50')).toBeInTheDocument()
  })
})
```

### E2E 테스트

```typescript
describe('SiteInfoPage E2E', () => {
  test('HTML 요구사항 완전 일치 검증', async ({ page }) => {
    await page.goto('/mobile/site-info')

    // 폰트 크기 조절 테스트
    await page.evaluate(() => document.body.classList.add('fs-150'))
    const titleSize = await page.locator('.site-name').evaluate(el => getComputedStyle(el).fontSize)
    expect(titleSize).toBe('20px') // 1.25rem

    // T-map 연동 테스트
    await page.click('[data-testid="tmap-button"]')
    await expect(page).toHaveURL(/tmap:\/\//)

    // 리플 애니메이션 테스트
    await page.click('.btn-detail')
    await expect(page.locator('.ripple-ink')).toBeVisible()
    await page.waitForTimeout(500)
    await expect(page.locator('.ripple-ink')).toBeHidden()
  })
})
```

---

## 📅 일정 및 마일스톤

### Week 1 (Day 1-2)

- **Day 1:** Phase 1 (기본 구조 재설계) - 3시간
- **Day 2:** Phase 2 (NPC-1000 시스템) - 4시간

### Week 1 (Day 3-4)

- **Day 3:** Phase 3 (첨부파일 시스템) - 2.5시간
- **Day 4:** Phase 4 (확장 UI 컴포넌트) - 2시간

### Week 2 (Day 5-7)

- **Day 5:** Phase 5 (T-map 연동) - 1.5시간
- **Day 6:** Phase 6 (접근성 완성) - 2시간
- **Day 7:** Phase 7-8 (애니메이션 + 테스트) - 2.5시간

**총 소요 시간:** 17.5시간
**예상 완료일:** 2025-09-23

---

## ⚠️ 위험 요소 및 대응방안

### 기술적 위험

1. **localStorage 동기화 지연**
   - **위험도:** Medium
   - **대응:** setTimeout 기반 폴링 대신 BroadcastChannel API 활용
2. **T-map 앱 설치율 낮음**
   - **위험도:** Low
   - **대응:** Kakao Map fallback 강화 및 사용자 가이드 제공

3. **모바일 디바이스 성능 이슈**
   - **위험도:** Medium
   - **대응:** 애니메이션 GPU 가속 및 lazy loading 구현

### 일정 위험

1. **NPC 시스템 복잡도 과소평가**
   - **위험도:** High
   - **대응:** Phase 2를 2일로 분할 (기본 구현 + 고급 기능)

2. **크로스 브라우저 호환성 이슈**
   - **위험도:** Medium
   - **대응:** 주요 브라우저별 테스트 환경 구축

---

## 📈 성공 지표 (KPI)

### 기능적 완성도

- [x] HTML 요구사항 대비 구현률: **85%** (목표: 100%)
- [ ] 사용자 액션 응답 시간: < 100ms
- [ ] localStorage 동기화 지연: < 50ms
- [ ] 모바일 디바이스 렌더링 시간: < 200ms

### 사용자 경험

- [ ] 접근성 점수: AA 등급 (WCAG 2.1 기준)
- [ ] 모바일 사용성 점수: 95점 이상
- [ ] 크로스 브라우저 호환성: 98% 이상

### 기술적 품질

- [ ] 테스트 커버리지: 90% 이상
- [ ] 코드 품질 점수: A 등급
- [ ] 번들 사이즈 증가: 10% 이하

---

## 📚 참고 문서 및 리소스

### 주요 참조 파일

- **HTML 요구사항:** `dy_memo/new_image_html_v2.0/html로 미리보기 화면/site.html`
- **현재 구현:** `modules/mobile/components/site/SiteInfoPage.tsx`
- **스타일 가이드:** HTML 파일 내 CSS 정의
- **기존 계획서:** `docs/SITE_INFO_PAGE_IMPLEMENTATION_PLAN.md`

### 외부 API 및 서비스

- **T-map API:** `tmap://` 스키마 및 웹 URL
- **Kakao Map API:** `https://map.kakao.com/`
- **클립보드 API:** `navigator.clipboard`
- **Web Storage API:** `localStorage`, `sessionStorage`

### 개발 도구 및 라이브러리

- **React:** v18+ (Hooks, Suspense)
- **TypeScript:** v5+ (strict mode)
- **CSS:** CSS Variables, Grid, Flexbox
- **애니메이션:** CSS Animations, Web Animations API
- **테스트:** Jest, React Testing Library, Playwright

---

## ✅ 완료 기준 (Definition of Done)

### 필수 요구사항

1. **시각적 완전 일치**: HTML 요구사항과 픽셀 퍼펙트 일치
2. **기능적 완전성**: 모든 HTML 기능이 React에서 동일하게 작동
3. **성능 기준 충족**: Core Web Vitals 모든 지표 통과
4. **접근성 준수**: WCAG 2.1 AA 등급 달성
5. **크로스 브라우저**: Chrome, Safari, Firefox, Edge 완전 호환
6. **반응형 완성**: 모든 브레이크포인트에서 정상 작동
7. **테스트 완료**: 단위/통합/E2E 테스트 90% 커버리지

### 품질 보증

1. **코드 리뷰**: 2명 이상의 개발자 승인
2. **QA 테스트**: 전 기능 수동 테스트 통과
3. **성능 테스트**: 실제 디바이스 환경에서 검증
4. **문서 완성**: API 문서 및 사용자 가이드 작성
5. **배포 검증**: 스테이징 환경에서 최종 확인

---

## 🚀 다음 단계

1. **Phase 1 실행 승인** 대기 중
2. **개발 환경 설정** 완료 필요
3. **팀 리소스 할당** 확정 필요
4. **QA 일정 조율** 필요
5. **스테이징 환경 준비** 필요

---

**문서 버전:** v1.0  
**최종 수정:** 2025-09-16  
**승인자:** [대기 중]  
**다음 검토일:** 2025-09-18
