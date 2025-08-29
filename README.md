# INOPNC_WM_20250829

건설작업관리시스템 - 새로운 클린 개발 환경

## 개요

이 프로젝트는 기존 INOPNC_WM_20250826에서 Claude Code 컨텍스트 오버로드 문제를 해결하기 위해 새롭게 마이그레이션된 프로젝트입니다.

## 특징

- 🚀 Next.js 14 기반 현대적인 웹 애플리케이션
- 💼 건설 작업 관리 시스템
- 🔐 Supabase 인증 및 데이터베이스
- 🎨 Tailwind CSS 스타일링
- 📱 반응형 모바일 지원

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 환경 설정

1. `.env` 파일을 생성하고 필요한 환경변수를 설정하세요
2. `.env.example` 파일을 참고하여 설정하세요

## Claude Code 사용 시 주의사항

- 새로운 세션으로 시작: `claude-code --new-session`
- 작업 단위를 작게 나누어 진행
- compact summary, update todos 등 반복 작업 방지
- 구체적이고 실행 중심의 요청만 사용

## 프로젝트 구조

```
├── app/          # Next.js App Router
├── components/   # 재사용 가능한 컴포넌트
├── contexts/     # React Context
├── hooks/        # 커스텀 훅
├── lib/          # 유틸리티 라이브러리
├── public/       # 정적 파일
├── styles/       # 스타일 파일
└── types/        # TypeScript 타입 정의
```

## 개발 가이드라인

1. 컴포넌트는 작고 재사용 가능하게 작성
2. TypeScript 타입 정의 철저히 작성
3. Tailwind CSS 유틸리티 클래스 활용
4. 반응형 디자인 고려

---

*마이그레이션 완료일: 2025-08-29*
*기존 프로젝트: INOPNC_WM_20250826*