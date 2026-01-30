# DY1230 Request Analysis

샘플 HTML(`dy_memo/request_20251230/sample_일부미완`)과 현재 INOPNC 시스템 화면을 매칭한 뒤, 실제 구현 시 필요한 변경 사항을 정리했습니다. 표 대신 번호와 글머리 기호로 묶어 가독성을 높였습니다.

## 1. 모바일 작업자 홈 (`@main.html`)

1. **현재 경로**: `app/mobile/page.tsx` → `modules/mobile/components/home/HomePage.tsx`
2. **필요 변경**
   - `MobileLayout` 상단/하단 여백을 제거하고 다크 모드 토글, 풀스크린 인터랙션을 지원.
   - `QuickMenu`를 샘플처럼 6열, 배지 애니메이션, 역할 기반 링크/카운터로 재작성.
   - 요약/알림 섹션, ready-to-save 배지, “다음 단계” 하이라이트 추가. 현장 검색 UX를 검색창+자동완성 중심으로 교체.

## 2. 모바일 작업일지 홈 (`@worklog.html`)

1. **현재 경로**: `app/mobile/worklog/page.tsx` → `modules/worker-site-manager/pages/WorkLogHomePage.tsx`
2. **필요 변경**
   - 누락/반려 경고 카드, 요약 KPI, 승인/반려 CTA를 상단에 추가.
   - 카드 리스트를 핀/상태 배지/빠른 승인 버튼 포함 구조로 재설계하고, 슬라이드업 상세보기+sticky footer 액션을 도입.
   - PDF 생성, 공유, 리마인더 알림을 상세 화면 내에서 처리하도록 모달을 교체.

## 3. 모바일 현장 정보 (`@site.html` & `@psite.html`)

1. **현재 경로**: `app/mobile/sites/page.tsx` → `modules/mobile/components/site/SiteInfoPage.tsx`
2. **필요 변경**
   - 현장 히어로 카드(상태, 공정, 관리자, CTA 버튼) 추가.
   - 도면/사진 썸네일, 길찾기 버튼, TMap 연동을 메인 화면에 직접 배치.
   - 역할(작업자/파트너)별로 다른 빠른 액션(본사요청, 자재요청, 문서 업로드 등)을 노출.

## 4. 모바일 문서 허브 (`@doc.html`)

1. **현재 경로**: `app/mobile/documents/page.tsx` → `app/documents/hub/page.tsx`
2. **필요 변경**
   - 전역 검색 오버레이(음성 입력, 태그, 즐겨찾기)를 추가.
   - 탭을 아이콘/배지/퍼센트 표시 포함 디자인으로 재구성.
   - 필수 문서 진행도, 펀치 리스트, 업로드 CTA를 플로팅 섹션으로 배치.

## 5. 모바일 출력/급여 (`@money.html`)

1. **현재 경로**: `app/mobile/attendance/page.tsx` & `app/mobile/payslip/[year]/[month]/page.tsx`
2. **필요 변경**
   - 통합 검색/알림/계정 패널과 음성 입력을 추가하고, 헤더를 샘플과 동일하게 구성.
   - “급여 지급 요청서” 캡처 영역과 `navigator.share` 흐름을 페이지 내에 내장.
   - 급여 탭에 금액 숨김, 과거 내역 카드, Pay Stub 오버레이, PDF 다운로드 버튼을 추가.

## 6. 사진대지 편집기 (`@photo.html`)

1. **현재 경로**: `app/dashboard/admin/tools/photo-grid/page.tsx` → `components/photo-sheet/PhotoSheetEditor.tsx`
2. **필요 변경**
   - 다크 테마 Canvas 에디터(줌/이동/그리드/정렬)와 헤더 툴바, 설정 패널을 통합.
   - html2canvas/jsPDF 기반 A4 PDF 다운로드와 공유 버튼을 툴 내부에 제공.
   - 전/후 사진 페어링, 정렬, 스티커 등 고급 편집 기능을 추가.

## 7. 공통 파일 미리보기 (`@preview.html`)

1. **현재 경로**: `components/files/FilePreviewButton.tsx` + `lib/files/preview.ts`
2. **필요 변경**
   - 버튼 클릭 시 새 탭이 아니라 풀스크린 오버레이(`pmOverlay`)를 열도록 컴포넌트화.
   - 줌/드래그/페이지 이동, 스크린샷·PDF 내보내기, 첨부 리스트 탐색 기능 추가.

## 8. 작업완료확인서 뷰어 (`@confirm.html`)

1. **현재 경로**: `app/mobile/worklog/[id]/TaskDetailPageClient.tsx`
2. **필요 변경**
   - 다크 배경 뷰어(서명 패드, 필드 입력, 자동 스탬프)를 첨부 탭에 내장.
   - html2canvas/jsPDF로 “확인서 다운로드/공유”를 제공하고, 완료확인 첨부 메타데이터를 갱신.

## 9. 관리자 작업일지 관리 (`@report.html`)

1. **현재 경로**: `app/dashboard/admin/daily-reports/page.tsx`
2. **필요 변경**
   - 데스크톱 테이블 대신 모바일 카드+요약 위젯 레이아웃으로 재구성.
   - 슬라이드업 상세뷰, 승인/반려 CTA, `pmOverlay` 기반 미리보기 추가.
   - “새 작업일지” 버튼, 상태별 카운터, 통계 배지를 상단에 배치.

## 10. 관리자 대시보드 (`@manager.html`)

1. **현재 경로**: `app/dashboard/admin/admin-dashboard-content.tsx`
2. **필요 변경**
   - 3열 요약 카드, 검색창, 빠른 액션 버튼 등 모바일 우선 레이아웃 추가.
   - 사용자/현장 카드, 위험/문서 요청 카드, 태그 필터를 도입.
   - 터치 제스처 최적화와 pastel CTA 스타일 적용.

## 11. 파트너 홈 (`@pmain.html`)

1. **현재 경로**: `app/mobile/partner/page.tsx` → `modules/mobile/components/partner/PartnerHomePage.tsx`
2. **필요 변경**
   - 5열 빠른메뉴, 요청 배지, CTA 버튼, 공지 슬라이더를 상단에 배치.
   - KPI 카드, “오늘의 현장” 리스트, 문서/도면 버튼 등을 추가.

## 12. 파트너 출력 현황 (`@pmoney.html`)

1. **현재 경로**: `app/mobile/partner/output/page.tsx` → `modules/mobile/pages/partner/PartnerOutputPage.tsx`
2. **필요 변경**
   - 검색 오버레이, 알림/계정 패널, 음성 입력 UI를 추가.
   - 달력과 급여 탭을 샘플과 동일한 시각 스타일로 재작성.
   - Pay Stub 오버레이와 공유/캡처 기능을 추가.

## 13. 파트너 작업일지 (`@pworklog3.html`)

1. **현재 경로**: `modules/worker-site-manager/pages/WorkLogHomePage.tsx`
2. **필요 변경**
   - 파트너 모드시 요약 카드, 검색창, 필터 칩을 노출.
   - 카드형 리스트에 현장/상태 배지/빠른 액션을 추가.
   - 도면/확인서 뷰어를 페이지 내에서 열 수 있도록 in-place overlay 구현.
