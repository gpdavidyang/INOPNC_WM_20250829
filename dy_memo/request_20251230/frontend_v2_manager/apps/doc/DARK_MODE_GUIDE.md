# 전역 다크모드 시스템 구축 가이드

## 📋 개요

이 문서는 INOPNC 앱 전체에 적용되는 통합 다크모드 아키텍처를 설명합니다.

---

## 🎨 1. 전역 디자인 토큰 (CSS Variables)

### 파일 위치

- `apps/doc/theme.css`

### 구조

```css
:root {
  /* 라이트 모드 변수 */
  --bg-base: #f2f4f6;
  --bg-surface: #ffffff;
  --text-primary: #111827;
  --brand-primary: #31a3fa;
  /* ... */
}

body.dark-mode {
  /* 다크 모드 변수 */
  --bg-base: #0f172a;
  --bg-surface: #1e293b;
  --text-primary: #f1f5f9;
  /* ... */
}
```

### 변수 카테고리

#### 배경 레이어

- `--bg-base`: 전체 앱 배경
- `--bg-surface`: 카드, 컨테이너
- `--bg-elevated`: 모달, 팝업
- `--bg-input`: 입력 필드
- `--bg-hover`: 호버 상태
- `--bg-selected`: 선택 상태

#### 텍스트 색상

- `--text-primary`: 주요 텍스트
- `--text-secondary`: 보조 텍스트
- `--text-muted`: 비활성/플레이스홀더
- `--text-inverse`: 반전 색상 (버튼 내 텍스트 등)

#### 브랜드 & 액센트

- `--brand-primary`: 메인 브랜드 컬러 (#31a3fa)
- `--brand-primary-bg`: 브랜드 배경
- `--brand-secondary`: 네이비/보조 브랜드
- `--accent-success`: 성공 (#10b981)
- `--accent-warning`: 경고 (#f59e0b)
- `--accent-danger`: 위험 (#ef4444)

#### 경계선

- `--border-light`: 매우 연한 경계
- `--border-default`: 기본 경계
- `--border-strong`: 강조 경계

#### 그림자

- `--shadow-sm`: 작은 그림자
- `--shadow-md`: 중간 그림자
- `--shadow-lg`: 큰 그림자
- `--shadow-xl`: 매우 큰 그림자

---

## 🔧 2. 전역 테마 관리자 (ThemeManager)

### 파일 위치

- `apps/doc/themeManager.ts`

### 주요 기능

#### 2.1 자동 초기화

```typescript
// localStorage에서 저장된 테마 로드
// 없으면 시스템 설정 확인
// 테마 적용 및 동기화
```

#### 2.2 localStorage 영구 저장

```typescript
localStorage.setItem('inopnc-theme', theme)
```

#### 2.3 시스템 테마 변경 감지

```typescript
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  // 사용자가 수동 설정하지 않은 경우만 시스템 테마 따름
})
```

#### 2.4 동적 컨텐츠 동기화

```typescript
// MutationObserver로 iframe 감지
// 새로 추가된 iframe에 자동으로 테마 전파
```

### API 사용법

#### 테마 토글

```typescript
import { themeManager } from './themeManager'

themeManager.toggleTheme()
```

#### 테마 설정

```typescript
themeManager.setTheme('dark') // 또는 'light'
```

#### 현재 테마 가져오기

```typescript
const currentTheme = themeManager.getTheme()
```

#### 테마 변경 구독

```typescript
const unsubscribe = themeManager.subscribe(theme => {
  console.log('Theme changed to:', theme)
})

// 정리
unsubscribe()
```

---

## ⚛️ 3. React 컴포넌트 통합

### App.tsx 통합 예시

```typescript
import { themeManager, Theme } from './themeManager';
import './theme.css';

function App() {
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');

  // 테마 구독
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((theme) => {
      setCurrentTheme(theme);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      {/* 테마 토글 버튼 */}
      <button onClick={() => themeManager.toggleTheme()}>
        {currentTheme === 'light' ? <Moon /> : <Sun />}
      </button>
    </div>
  );
}
```

---

## 🎯 4. 하드코딩 색상 교체 가이드

### ❌ 잘못된 예시

```tsx
<div className="bg-white text-black border-gray-200">
  <button className="bg-blue-500 text-white">버튼</button>
</div>
```

### ✅ 올바른 예시

```tsx
<div
  style={{
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
  }}
>
  <button
    style={{
      backgroundColor: 'var(--brand-primary)',
      color: 'var(--text-inverse)',
    }}
  >
    버튼
  </button>
</div>
```

### Tailwind 사용 시

```tsx
// Tailwind 클래스는 그대로 사용 가능하지만,
// 커스텀 색상은 CSS 변수로 오버라이드
<div className="bg-white dark:bg-gray-800">
  {/* 또는 */}
  <div style={{ backgroundColor: 'var(--bg-surface)' }}>
```

---

## 🚨 5. 충돌 방지 가이드

### 5.1 Tailwind와의 충돌 방지

#### 문제

```tsx
// Tailwind의 bg-white가 CSS 변수를 덮어씀
<div className="bg-white">
```

#### 해결

```tsx
// 인라인 스타일로 우선순위 확보
<div
  className="rounded-lg p-4"
  style={{ backgroundColor: 'var(--bg-surface)' }}
>
```

### 5.2 iframe 테마 동기화

#### 자동 동기화

ThemeManager가 자동으로 감지하여 테마 전파

#### 수동 동기화 (필요 시)

```typescript
// iframe 로드 후
const iframe = document.querySelector('iframe')
const iframeDoc = iframe.contentDocument
if (iframeDoc) {
  iframeDoc.body.classList.add('dark-mode')
}
```

### 5.3 Third-party 라이브러리

#### 문제

외부 라이브러리가 하드코딩된 색상 사용

#### 해결

```css
/* theme.css에 오버라이드 추가 */
.external-library-class {
  background-color: var(--bg-surface) !important;
  color: var(--text-primary) !important;
}
```

### 5.4 SVG 아이콘 색상

#### 문제

```tsx
<svg stroke="#000000">
```

#### 해결

```tsx
// currentColor 사용 (부모 요소의 color 상속)
<svg stroke="currentColor">

// 또는 CSS 변수
<svg style={{ stroke: 'var(--text-primary)' }}>
```

---

## 📱 6. 모바일 대응

### iOS Safari

```css
/* theme.css에 이미 포함됨 */
body {
  -webkit-tap-highlight-color: transparent;
}
```

### Android Chrome

```html
<!-- index.html에 추가 -->
<meta name="theme-color" content="#f2f4f6" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)" />
```

---

## 🧪 7. 테스트 체크리스트

### 기능 테스트

- [ ] 테마 토글 버튼 작동
- [ ] localStorage에 테마 저장
- [ ] 페이지 새로고침 후 테마 유지
- [ ] 시스템 테마 변경 감지

### UI 테스트

- [ ] 모든 카드/컨테이너 배경 색상 변경
- [ ] 모든 텍스트 색상 변경
- [ ] 모든 버튼 색상 변경
- [ ] 모든 입력 필드 색상 변경
- [ ] 모든 경계선 색상 변경
- [ ] 모달/팝업 색상 변경
- [ ] 배치 바 색상 변경

### 동기화 테스트

- [ ] iframe 테마 동기화
- [ ] 동적 로드 컴포넌트 테마 적용
- [ ] 여러 탭 간 테마 동기화

---

## 🔍 8. 디버깅 가이드

### 테마가 적용되지 않는 경우

#### 1. CSS 변수 확인

```javascript
// 브라우저 콘솔에서
getComputedStyle(document.body).getPropertyValue('--bg-base')
```

#### 2. 클래스 확인

```javascript
// dark-mode 클래스가 있는지 확인
document.body.classList.contains('dark-mode')
```

#### 3. localStorage 확인

```javascript
localStorage.getItem('inopnc-theme')
```

#### 4. ThemeManager 상태 확인

```javascript
window.themeManager.getTheme()
```

### 일부 요소만 색상이 안 바뀌는 경우

#### 원인

- Tailwind 클래스가 CSS 변수를 덮어씀
- 하드코딩된 색상 사용
- !important 사용으로 인한 우선순위 문제

#### 해결

```tsx
// 인라인 스타일로 우선순위 확보
style={{ backgroundColor: 'var(--bg-surface)' }}

// 또는 !important 추가
style={{ backgroundColor: 'var(--bg-surface) !important' }}
```

---

## 📚 9. 추가 리소스

### 파일 구조

```
apps/doc/
├── theme.css           # 전역 CSS 변수 및 스타일
├── themeManager.ts     # 테마 관리 로직
├── App.tsx             # React 통합
└── DARK_MODE_GUIDE.md  # 이 문서
```

### 참고 링크

- CSS Variables: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
- prefers-color-scheme: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- MutationObserver: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver

---

## 🎉 10. 완료!

전역 다크모드 시스템이 성공적으로 구축되었습니다.

### 다음 단계

1. 모든 컴포넌트에서 하드코딩된 색상을 CSS 변수로 교체
2. 각 페이지에서 테마 토글 버튼 추가
3. 전체 앱 테스트 및 QA

### 유지보수

- 새로운 컴포넌트 추가 시 CSS 변수 사용
- 새로운 색상 필요 시 `theme.css`에 변수 추가
- 테마 관련 버그 발생 시 이 가이드의 디버깅 섹션 참고
