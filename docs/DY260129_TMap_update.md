# DY260129 – 모바일 T맵 연동 고도화 구현 계획

## 1. 요구사항 요약

- **동작 트리거**: 모바일 현장 정보 화면에서 주소 텍스트 자체 클릭 + 기존 “T맵” 버튼 클릭 시 공통으로 동작.
- **우선순위 체인**: T맵 → 카카오맵 → 네이버맵 → (최종) 웹 브라우저.
- **자동 전환**: 상위 앱이 미설치/실패 시 다음 후보로 자동 시도, 사용자는 별도 선택 없이 즉시 결과를 받음.
- **UX 피드백**: 각 단계 성공/실패/폴백 상황을 토스트 또는 콘솔 로그로 추적 가능해야 함.

## 2. 기술 설계

### 2.1 External App Orchestrator 추가

1. `lib/external-apps.ts`
   - `openSmartMap(options)` 유틸 새로 추가.
   - 입력: `{ name, address, latitude?, longitude? }` 또는 `query` 문자열.
   - 내부 로직:
     1. `const chain: MapAppId[] = ['tmap', 'kakao', 'naver', 'web']`.
     2. 각 단계는 기존 `TMap/KakaoMap/NaverMap` 객체의 `search` 또는 `navigate` 를 호출.
     3. `launchAppWithFallback` 반환 구조에 `sourceApp`, `fallbackUsed`, `error` 필드 추가/확장하여 성공 여부를 명확히 판단.
     4. 실패 시 다음 체인으로 자동 이동, 성공 시 즉시 resolve.
     5. 마지막 `web` 단계에서는 `window.open(commonUrl, '_blank')` 후 `success: true`.
   - 반환: `{ success: boolean; usedApp: MapAppId; fallback?: MapAppId; message?: string }` 형태로 UI에서 메시지 구성 가능하도록 함.

### 2.2 공통 핸들러 교체

1. `modules/mobile/components/site/SiteInfoPage.tsx`
   - `openMapForAddress`를 `openSmartMap` 호출로 변경.
   - 주소/숙소 정보가 있는 곳(카드 및 `SiteInfoBottomSheet` props 전달 부분)에 `onClick` 또는 `onOpenMap`으로 연결.
2. `modules/mobile/components/site/SiteInfoBottomSheet.tsx`
   - `mapHandler`에서 `TMap.search` 대신 `openSmartMap`.
   - 주소 텍스트(`.site-info-sheet-address-value`)와 숙소 텍스트에 `onClick`/`role="button"`/`tabIndex` 부여, 키보드 접근성 확보.
   - 토스트 메시지: `success && result.fallback ? 'T맵 미설치로 카카오맵을 실행했습니다.'` 등의 안내 제공.

### 2.3 UX/에러 처리

1. `openSmartMap` 결과 객체를 기반으로 토스트 문구 템플릿 정의.
2. 앱 실행 시도마다 `trackAppLaunch`에 `app_name`과 `fallback` 정보를 전달하여 추후 분석 가능하게 함.
3. 모든 실패(웹 열기까지 실패) 시 “연결할 수 없습니다. 주소를 복사해 직접 열어주세요.” 토스트 출력.

## 3. 작업 및 검증 순서

1. `lib/external-apps.ts` 리팩터링 및 새 orchestrator/타입 추가.
2. `SiteInfoPage.tsx`, `SiteInfoBottomSheet.tsx`에서 신규 함수 사용 + UI 이벤트 확장.
3. 수동 테스트 시나리오:
   - iOS/Android 각 1대에서 T맵 유무에 따라 체인이 정상 동작하는지 확인.
   - 데스크톱 브라우저에서 주소 텍스트 클릭 시 웹 T맵 새 탭이 열리는지 확인.
4. 회귀: 기존 “복사”/“전화” 버튼과 토스트 로직이 영향받지 않았는지 확인.

## 4. 향후 고려사항

- 사용자 설정에서 기본 맵 앱을 직접 선택하도록 옵션 추가 가능.
- 체인 우선순위를 서버/로컬 스토리지에서 조절할 수 있도록 확장 여지 확보.
- 향후 지도 앱이 추가될 경우 `chain` 배열만 확장하면 되도록 상수화.
