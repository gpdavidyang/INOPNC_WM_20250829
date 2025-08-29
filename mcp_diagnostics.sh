#!/bin/bash

echo "🔍 MCP 서버 진단 도구"
echo "=========================="

# 1. 환경 변수 설정
export SUPABASE_URL="https://yjtnpscnnsnvfsyvajku.supabase.co"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mzc1NjQsImV4cCI6MjA2OTQxMzU2NH0.VNyFGFPRiYTIIRgGBvehV2_wA-Fsq1dhjlvj90yvY08"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqdG5wc2NubnNudmZzeXZhamt1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzNzU2NCwiZXhwIjoyMDY5NDEzNTY0fQ.nZ3kiVrU4qAnWQG5vso-qL_FKOkYKlbbZF1a04ew0GE"

echo "✅ 환경 변수 설정 완료"

# 2. 파일 존재 확인
if [ -f "node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js" ]; then
    echo "✅ Supabase MCP 서버 파일 존재"
else
    echo "❌ Supabase MCP 서버 파일 없음"
    exit 1
fi

# 3. 파일 권한 확인
echo "📁 파일 권한: $(ls -la node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js)"

# 4. 파일 내용 확인
echo "📄 파일 첫 줄: $(head -1 node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js)"

# 5. 직접 실행 테스트
echo "🚀 직접 실행 테스트..."
node ./node_modules/@supabase/mcp-server-supabase/dist/transports/stdio.js &
PID=$!
sleep 2
if kill -0 $PID 2>/dev/null; then
    echo "✅ 프로세스 실행 성공 (PID: $PID)"
    kill $PID 2>/dev/null
else
    echo "❌ 프로세스 실행 실패"
fi

echo "=========================="
echo "진단 완료!"
