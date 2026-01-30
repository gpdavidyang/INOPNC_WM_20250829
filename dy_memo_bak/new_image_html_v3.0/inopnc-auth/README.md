# INOPNC Auth — Next.js + Tailwind (100% 원본 유지)

이 프로젝트는 기존 HTML/CSS/JS/데이터 로직을 **단 1줄도 수정하지 않고** Next.js + Tailwind 프로젝트로 감싸 제공하기 위한 래퍼입니다.

- 원본 파일: `/public/legacy/*.html` (그대로 보관)
- Next.js 라우트: `/signup`, `/login`, `/reset` → 각 라우트는 `iframe`으로 원본을 로드하여 **행동/스타일/로직을 100% 유지**합니다.
- Tailwind는 프로젝트 수준에서만 설정되어 있으며, 원본 HTML에는 주입하지 않습니다.

## 실행

```bash
npm i
npm run dev
# http://localhost:3000
```

## 구조

```
app/
  layout.tsx
  page.tsx
  signup/page.tsx  -> /legacy/signup.html 렌더
  login/page.tsx   -> /legacy/login.html 렌더
  reset/page.tsx   -> /legacy/reset.html 렌더
public/
  legacy/
    signup.html
    login.html
    reset.html
styles/
  globals.css (Tailwind)
```

## 왜 iframe인가요?

"코드, css, 자바스크립트, 데이터로직 아무것도 바꾸지 말고 100% 유지" 요구사항을 완전히 충족하기 위해,
원본을 Next.js 페이지에 직접 이식하지 않고 정적 파일로 보관한 뒤 `iframe`으로 표시합니다.
이 방식은 원본의 이벤트/스타일/브라우저 기본동작을 변경하지 않습니다.
