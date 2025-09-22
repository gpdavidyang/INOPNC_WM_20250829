#!/bin/bash

# 소스 코드 복사 스크립트
# 이 스크립트를 실행하여 기존 프로젝트의 핵심 소스들을 새 프로젝트로 복사합니다

SOURCE="/Users/davidyang/workspace/INOPNC_WM_20250826"
TARGET="/Users/davidyang/workspace/INOPNC_WM_20250829"

echo "🚀 소스 코드 복사 시작..."
echo "📂 소스: $SOURCE"
echo "📂 타겟: $TARGET"

# 1. 핵심 소스 코드 폴더들 복사
echo "📁 핵심 소스 코드 복사 중..."

# app 폴더 (Next.js App Router)
echo "  - app/ 폴더 복사 중..."
cp -r "$SOURCE/app" "$TARGET/"

# components 폴더
echo "  - components/ 폴더 복사 중..."
cp -r "$SOURCE/components" "$TARGET/"

# contexts 폴더
echo "  - contexts/ 폴더 복사 중..."
cp -r "$SOURCE/contexts" "$TARGET/"

# hooks 폴더
echo "  - hooks/ 폴더 복사 중..."
cp -r "$SOURCE/hooks" "$TARGET/"

# lib 폴더
echo "  - lib/ 폴더 복사 중..."
cp -r "$SOURCE/lib" "$TARGET/"

# types 폴더
echo "  - types/ 폴더 복사 중..."
cp -r "$SOURCE/types" "$TARGET/"

# styles 폴더
echo "  - styles/ 폴더 복사 중..."
cp -r "$SOURCE/styles" "$TARGET/"

# public 폴더
echo "  - public/ 폴더 복사 중..."
cp -r "$SOURCE/public" "$TARGET/"

# providers 폴더 (있다면)
echo "  - providers/ 폴더 복사 중..."
cp -r "$SOURCE/providers" "$TARGET/" 2>/dev/null || echo "    providers 폴더 없음 - 건너뛰기"

# supabase 폴더 (설정 파일들)
echo "  - supabase/ 폴더 복사 중..."
cp -r "$SOURCE/supabase" "$TARGET/" 2>/dev/null || echo "    supabase 폴더 없음 - 건너뛰기"

echo "✅ 소스 코드 복사 완료!"
echo ""
echo "다음 단계:"
echo "1. cd $TARGET"
echo "2. .env 파일에 필요한 환경변수 설정"
echo "3. npm install"
echo "4. npm run dev"
echo "5. claude-code --new-session 으로 새 세션 시작"
echo ""
echo "⚠️  중요: .env 파일을 설정하지 않으면 애플리케이션이 작동하지 않습니다."