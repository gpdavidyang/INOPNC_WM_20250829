/* eslint-disable no-useless-escape */

'use client'

import type { Metadata } from 'next'
import React, { useEffect } from 'react'

export const metadata: Metadata = {
  title: '메인 - INOPNC',
}

export default function Page() {
  useEffect(() => {
    // Run Lucide replace if present
    if (typeof window !== 'undefined' && window.lucide && window.lucide.createIcons) {
      try {
        window.lucide.createIcons()
      } catch (e) {
        /* noop */
      }
    }
  }, [])

  return (
    <main id="main-page" className="min-h-screen w-full">
      <div
        dangerouslySetInnerHTML={{
          __html: `<div class="app-container">
        <!-- 상단 헤더 -->
        <header class="app-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="brand-title" id="brandTitle" style="cursor: pointer;">INOPNC</h1>
                </div>
                
                <div class="header-center">
                    <!-- 중앙 영역은 비워둠 -->
                </div>
                
                <div class="header-right">
                    <button class="header-icon-btn" id="searchBtn" aria-label="검색">
                        <i data-lucide="search" class="w-5 h-5"></i>
                        <span class="icon-text">검색</span>
                    </button>
                    <button class="header-icon-btn" id="darkModeBtn" aria-label="다크모드">
                        <i data-lucide="moon" class="w-5 h-5" id="darkModeIcon"></i>
                        <span class="icon-text">다크모드</span>
                    </button>
                    <button class="header-icon-btn" id="fontSizeBtn" aria-label="글씨 크기">
                        <i data-lucide="type" class="w-5 h-5"></i>
                        <span class="icon-text" id="fontSizeText">작은글씨</span>
                    </button>
                    <button class="header-icon-btn" id="notificationBtn" aria-label="알림">
                        <i data-lucide="bell" class="w-5 h-5" id="bellIcon"></i>
                        <span class="icon-text">알림</span>
                        <span class="notification-badge hidden" id="notificationBadge">0</span>
                    </button>
                    <button class="header-icon-btn" id="menuBtn" aria-label="메뉴">
                        <i data-lucide="menu" class="w-5 h-5"></i>
                        <span class="icon-text">메뉴</span>
                    </button>
                </div>
            </div>
        </header>

        <!-- 메인 컨텐츠 -->
        <main class="main-content">
            <div class="main-page-content">

               <!-- 빠른메뉴 -->
               <section id="home-quick" class="section mb-3.5">
                       <div class="section-header">
                           <img src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjYz/MDAxNzU3MzczOTIzNjUy.938EaPjiHzNGNoECgw9vItJhy_4pR6ZYVq3-8Z3tJecg.pSbWcXNy1U9El6kYe8OpwKmCEwkZiWJUiIM2R1qL2Swg.PNG/Flash.png?type=w966" alt="빠른메뉴" class="quick-menu-icon" onerror="this.onerror=null; this.src='./public/images/Flash.png';">
                           <h3 class="section-title">빠른메뉴</h3>
                       </div>
                       <ul id="quick-menu" class="quick-grid">
                           <li class="quick-item">
                               <a href="worklog.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966" width="64" height="64" alt="출력현황" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/calculator.png';">
                                   <span>출력현황</span>
                               </a>
                           </li>
                           <li class="quick-item">
                               <a href="task.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966" width="64" height="64" alt="작업일지" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/clipboard-list.png';">
                                   <span>작업일지</span>
                               </a>
                           </li>
                           <li class="quick-item">
                               <a href="site.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966" width="64" height="64" alt="현장정보" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/map.png';">
                                   <span>현장정보</span>
                               </a>
                           </li>
                           <li class="quick-item">
                               <a href="doc.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966" width="64" height="64" alt="문서함" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/doc.png';">
                                   <span>문서함</span>
                               </a>
                           </li>
                           <li class="quick-item">
                               <a href="request.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966" width="64" height="64" alt="본사요청" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/request.png';">
                                   <span>본사요청</span>
                               </a>
                           </li>
                           <li class="quick-item">
                               <a href="stock.html" class="quick-item">
                                   <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTAg/MDAxNzU3MzczOTIzODc2.V3ORy11Kszltv6qJ6M3zt4qFtdNopNi1sYcrZALvFD0g.5ZpgJNYRXfyedL0hVpIfo1sxqgBPUAO9SmMjmKf7qZgg.PNG/%EC%9E%AC%EA%B3%A0%EA%B4%80%EB%A6%AC.png?type=w966" width="64" height="64" alt="재고관리" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/stock.png';">
                                   <span>재고관리</span>
                               </a>
                           </li>
                       </ul>
               </section>

               <!-- 공지사항 -->
               <section id="home-notice" class="section mb-3.5">
                   <div class="card notice-card">
                       <div class="notice-content">
                           <div class="notice-item active">
                               <span class="notice-text">
                                   <strong class="tag-label">[공지사항]</strong>
                                   시스템 점검 안내: 1월 15일 오전 2시~4시
                               </span>
                           </div>
                           <div class="notice-item">
                               <span class="notice-text">
                                   <strong class="tag-label">[업데이트]</strong>
                                   새로운 기능이 추가되었습니다. 확인해보세요!
                               </span>
                           </div>
                           <div class="notice-item">
                               <span class="notice-text">
                                   <strong class="tag-label">[이벤트]</strong>
                                   신규 회원 대상 특별 혜택 이벤트 진행 중
                               </span>
                           </div>
                       </div>
                   </div>
               </section>

               <!-- 작업일지 입력 폼 -->
               <section id="work-log-form" class="section mb-3.5">
                   <div class="work-form-container">
                       
                       <!-- 현장선택 -->
                       <div class="form-section">
                           <div class="section-header">
                               <h3 class="section-title">선택 현장 <span class="required">*</span></h3>
                               <span class="form-note">필수입력값(*)작성 후 저장</span>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">소속</label>
                                   <select class="form-select" id="departmentSelect">
                                       <option value="">소속 선택</option>
                                       <option value="inopnc_hq">이노피앤씨 본사</option>
                                       <option value="inopnc_coking">이노피앤씨 코킹</option>
                                       <option value="sampyo_pnc">삼표피앤씨</option>
                                       <option value="camu_enc">까뮤이엔씨</option>
                                   </select>
                               </div>
                               <div class="form-group">
                                   <label class="form-label">선택</label>
                                   <select class="form-select" id="siteSelect">
                                       <option value="">현장 선택</option>
                                       <option value="site1">현장 A</option>
                                       <option value="site2">현장 B</option>
                                       <option value="site3">현장 C</option>
                                   </select>
                               </div>
                           </div>
                       </div>

                       <!-- 작성 정보 입력 -->
                       <div class="form-section">
                           <div class="section-header">
                               <h3 class="section-title">작성 정보 입력 <span class="required">*</span></h3>
                               <span class="author-info">작성자</span>
                           </div>
                           <div class="form-row work-data-form-row">
                               <div class="form-group">
                                   <label class="form-label">작업일자</label>
                                   <div class="date-input-wrapper">
                                       <input type="date" class="form-input" id="workDate">
                                       <span class="calendar-icon" id="calendarIcon"></span>
                                   </div>
                               </div>
                           </div>
                           <div class="form-row">
                               <div class="form-group">
                                   <label class="form-label">선택된 현장</label>
                                   <input type="text" class="form-input" id="selectedSiteDisplay" value="현장 미선택" readonly title="현장 미선택">
                               </div>
                           </div>
                       </div>

                       <!-- 작업 내용 기록 -->
                       <div class="form-section">
                           <div class="section-header">
                               <h3 class="section-title">작업 내용 기록 <span class="required">*</span></h3>
                               <button class="add-btn" id="addWorkContentBtn">추가</button>
                           </div>
                           <div class="form-group">
                               <label class="form-label">부재명</label>
                               <div class="button-group">
                                   <button class="option-btn" data-value="slab">슬라브</button>
                                   <button class="option-btn" data-value="girder">거더</button>
                                   <button class="option-btn" data-value="column">기둥</button>
                                   <button class="option-btn" data-value="other">기타</button>
                               </div>
                               <input type="text" class="form-input custom-input" placeholder="부재명을 직접 입력하세요" id="component-custom" style="display: none; margin-top: 8px; border-radius: 14px;">
                           </div>
                           <div class="form-group">
                               <label class="form-label">작업공정</label>
                               <div class="button-group">
                                   <button class="option-btn" data-value="crack">균열</button>
                                   <button class="option-btn" data-value="surface">면</button>
                                   <button class="option-btn" data-value="finish">마감</button>
                                   <button class="option-btn" data-value="other">기타</button>
                               </div>
                               <input type="text" class="form-input custom-input" placeholder="작업공정을 직접 입력하세요" id="process-custom" style="display: none; margin-top: 8px; border-radius: 14px;">
                           </div>
                       </div>

                       <!-- 작업구간 -->
                       <div class="form-section work-section">
                           <div class="section-header">
                               <h3 class="section-title">작업구간</h3>
                           </div>
                           <div class="form-group">
                               <label class="form-label">작업유형</label>
                               <div class="button-group">
                                   <button class="option-btn" data-value="underground">지하</button>
                                   <button class="option-btn" data-value="roof">지붕</button>
                                   <button class="option-btn" data-value="other">기타</button>
                               </div>
                               <input type="text" class="form-input custom-input" placeholder="작업유형을 직접 입력하세요" id="worktype-custom" style="display: none; margin-top: 8px; border-radius: 14px;">
                           </div>
                           <div class="form-group block-dong-ho-group">
                               <label class="form-label">블럭 / 동 / 호수</label>
                               <div class="form-row">
                                   <div class="form-group">
                                       <input type="text" class="form-input" placeholder="블럭" id="block">
                                   </div>
                                   <div class="form-group">
                                       <input type="text" class="form-input" placeholder="동" id="building">
                                   </div>
                                   <div class="form-group">
                                       <input type="text" class="form-input" placeholder="호수" id="unit">
                                   </div>
                               </div>
                           </div>
                       </div>

                       <!-- 추가 작업 내용 태그들 -->
                       <div id="additionalWorkTagsContainer"></div>

                       <!-- 공수(일) -->
                       <div class="form-section manpower-section">
                           <div class="section-header">
                               <h3 class="section-title">공수(일) <span class="required">*</span></h3>
                               <button class="add-btn" id="addManDaysBtn">추가</button>
                           </div>
                           <div class="form-row author-manpower-row">
                               <div class="form-group">
                                   <label class="form-label">작성자</label>
                                   <input type="text" class="form-input" placeholder="작성자명" id="author">
                               </div>
                               <div class="form-group">
                                   <label class="form-label">공수</label>
                                   <div class="number-input qty-split3" data-values="0,0.5,1,1.5,2,2.5,3">
                                       <button class="number-btn minus">-</button>
                                       <input type="number" class="number-field" value="1" min="0" step="0.5" id="manDays">
                                       <button class="number-btn plus">+</button>
                                   </div>
                               </div>
                           </div>
                       </div>

                       <!-- 액션 버튼 -->
                       <div class="form-actions">
                           <button class="btn btn-secondary" id="resetBtn">처음부터</button>
                           <button class="btn btn-primary" id="saveBtn">저장하기</button>
                       </div>

                   </div>
               </section>

               <!-- 첨부파일 섹션 -->
               <section id="attachment-section" class="section mb-3.5">
                   <div class="work-form-container">
                       
                       <!-- 사진업로드 -->
                       <div class="form-section">
                           <div class="section-header">
                               <h3 class="section-title">사진업로드</h3>
                               <span class="upload-hint">↔ 전/후 업로드</span>
                           </div>
                           <div class="photo-upload-grid">
                               <div class="photo-upload-item">
                                   <div class="upload-header">
                                       <span class="upload-title">보수 전</span>
                                       <div class="upload-counter">
                                           <span class="counter-number" id="before-counter">0</span>
                                           <span class="counter-total">/30</span>
                                       </div>
                                   </div>
                                   <div class="upload-area before-area" data-type="before">
                                   </div>
                               </div>
                               <div class="photo-upload-item">
                                   <div class="upload-header">
                                       <span class="upload-title">보수 후</span>
                                       <div class="upload-counter">
                                           <span class="counter-number" id="after-counter">0</span>
                                           <span class="counter-total">/30</span>
                                       </div>
                                   </div>
                                   <div class="upload-area after-area" data-type="after">
                                   </div>
                               </div>
                           </div>
                           <div class="upload-actions">
                               <button class="btn btn-secondary" id="photoResetBtn">처음부터</button>
                               <button class="btn btn-primary" id="photoSaveBtn">저장하기</button>
                           </div>
                       </div>

                       <!-- 도면마킹 -->
                       <div class="form-section drawing-section">
                           <div class="section-header">
                               <h3 class="section-title">도면마킹</h3>
                           </div>
                           <div class="drawing-actions">
                               <button class="btn btn-outline">업로드</button>
                               <button class="btn btn-secondary">불러오기</button>
                               <button class="btn btn-primary">저장하기</button>
                           </div>
                       </div>


                   </div>
               </section>

               <!-- 작성 내용 요약 섹션 -->
               <section id="summary-section" class="section mb-3.5">
                   <div class="work-form-container">
                       <div class="form-section">
                           <div class="section-header">
                               <h3 class="section-title">작성 내용 요약</h3>
                           </div>
                           <div class="summary-grid">
                               <!-- 현장 (한 행) -->
                               <div class="summary-item summary-full-width">
                                   <span class="summary-label">현장:</span>
                                   <span class="summary-value" id="summary-site">선택 안됨</span>
                               </div>
                               
                               <!-- 작업일자, 작성자 (한 행) -->
                               <div class="summary-row">
                                   <div class="summary-item">
                                       <span class="summary-label">작업일자:</span>
                                       <span class="summary-value" id="summary-date">2025-01-13</span>
                                   </div>
                                   <div class="summary-item highlight-line">
                                       <span class="summary-label">작성자:</span>
                                       <span class="summary-value" id="summary-author">없음</span>
                                   </div>
                               </div>
                               
                               <!-- 부재명, 작업공정 (한 행) -->
                               <div class="summary-row">
                                   <div class="summary-item">
                                       <span class="summary-label">부재명:</span>
                                       <span class="summary-value" id="summary-component">없음</span>
                                   </div>
                                   <div class="summary-item highlight-line">
                                       <span class="summary-label">작업공정:</span>
                                       <span class="summary-value" id="summary-process">없음</span>
                                   </div>
                               </div>
                               
                               <!-- 작업유형, 출력인원 (한 행) -->
                               <div class="summary-row">
                                   <div class="summary-item">
                                       <span class="summary-label">작업유형:</span>
                                       <span class="summary-value" id="summary-worktype">없음</span>
                                   </div>
                                   <div class="summary-item highlight-line">
                                       <span class="summary-label">출력인원:</span>
                                       <span class="summary-value" id="summary-personnel">1명</span>
                                   </div>
                               </div>
                               
                               <!-- 블럭/동/호수 (한 행) -->
                               <div class="summary-item summary-full-width">
                                   <span class="summary-label">블럭 / 동 / 호수:</span>
                                   <span class="summary-value" id="summary-location">없음</span>
                               </div>
                               
                               <!-- 사진 (한 행) -->
                               <div class="summary-item summary-full-width">
                                   <span class="summary-label">사진:</span>
                                   <span class="summary-value" id="summary-photos">보수 전 0장 / 보수 후 0장</span>
                               </div>
                               
                               <!-- 공수, 도면 (한 행) -->
                               <div class="summary-row">
                                   <div class="summary-item">
                                       <span class="summary-label">공수:</span>
                                       <span class="summary-value" id="summary-mandays">1일</span>
                                   </div>
                                   <div class="summary-item highlight-line">
                                       <span class="summary-label">도면:</span>
                                       <span class="summary-value" id="summary-documents">0장</span>
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               </section>

            </div>
        </main>

        <!-- 검색 전체화면 페이지 -->
        <div id="searchPage" class="search-page" role="dialog" aria-modal="true">
            <div class="sp-head">
                <button id="spBack" class="sp-back" aria-label="취소">
                    <span class="sp-back-text">취소</span>
                </button>
                <div class="sp-input-wrap">
                    <input id="spInput" class="sp-input" type="text" placeholder="검색어를 입력하세요." />
                    <i data-lucide="search" class="sp-icon"></i>
                </div>
            </div>
            <div class="sp-body">
                <div class="sp-section-title">최근 검색어</div>
                <div class="sp-list" id="spList">
                    <!-- 검색 결과가 여기에 표시됩니다 -->
                </div>
            </div>
        </div>

        <!-- 알림 팝업 -->
        <div id="notificationPopup" class="notification-popup" role="dialog" aria-modal="true">
            <div class="notification-popup-content">
                <div class="notification-popup-header">
                    <h3>알림</h3>
                    <button class="notification-popup-close" id="notificationClose">닫기</button>
                </div>
                <div class="notification-popup-body">
                    <div class="notification-content">
                        <p>새로운 알림이 있습니다.</p>
                    </div>
                    <div class="notification-list" id="notificationList">
                        <div class="notification-item">
                            <div class="notification-icon">
                                <i data-lucide="bell" class="w-5 h-5"></i>
                            </div>
                            <div class="notification-text">
                                <div class="notification-title">시스템 알림</div>
                                <div class="notification-desc">새로운 업데이트가 있습니다.</div>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon">
                                <i data-lucide="info" class="w-5 h-5"></i>
                            </div>
                            <div class="notification-text">
                                <div class="notification-title">정보 알림</div>
                                <div class="notification-desc">작업이 완료되었습니다.</div>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon">
                                <i data-lucide="alert-circle" class="w-5 h-5"></i>
                            </div>
                            <div class="notification-text">
                                <div class="notification-title">주의 알림</div>
                                <div class="notification-desc">확인이 필요한 항목이 있습니다.</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="notification-popup-footer">
                    <button class="notification-btn notification-btn-primary" id="notificationMore">알림 더보기</button>
                </div>
            </div>
        </div>

        <!-- 햄버거 드로어 -->
        <div id="drawerScrim" class="drawer-scrim" aria-hidden="true"></div>
        <aside id="drawer" class="drawer" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="drawer-body">
                <div class="drawer-scale">
                    <div class="profile-sec">
                        <div class="profile-header">
                            <div class="profile-name" id="profileUserName">이현수 <span class="important-tag" style="position: relative; top: 0; right: 0; margin-left: 8px;">현장관리자</span></div>
                            <button class="close-btn" id="drawerCloseBtn">닫기</button>
                        </div>
                        <div class="profile-email" id="profileUserEmail">manager@inopnc.com</div>
                    </div>
                    
                    <ul class="menu-list">
                        <li><a class="menu-item" href="main.html"><span class="menu-label">홈</span></a></li>
                        <li><a class="menu-item" href="worklog.html"><span class="menu-label">출력현황</span></a></li>
                        <li><a class="menu-item" href="task.html"><span class="menu-label">작업일지</span></a></li>
                        <li><a class="menu-item" href="site.html"><span class="menu-label">현장정보</span></a></li>
                        <li><a class="menu-item" href="doc.html"><span class="menu-label">문서함</span></a></li>
                        <li class="menu-item-with-btn">
                            <a class="menu-item" href="main.html"><span class="menu-label">내정보</span></a>
                            <button class="account-manage-btn" id="accountManageBtn">계정관리</button>
                        </li>
                        <li class="account-info" id="accountInfo" style="display: none;">
                            <div class="account-info-item">
                                <span class="account-label">연락처</span>
                                <span class="account-value">010-1234-5678</span>
                            </div>
                            <div class="account-info-item">
                                <span class="account-label">가입일</span>
                                <span class="account-value">2024.01.15</span>
                            </div>
                            <div class="account-info-item">
                                <span class="account-label">비밀번호 변경</span>
                                <span class="account-value change-password-btn" id="changePasswordBtn">변경하기</span>
                            </div>
                        </li>
                        <li class="password-change-form" id="passwordChangeForm" style="display: none;">
                            <div class="password-form-container">
                                <div class="form-group">
                                    <input type="password" class="form-input" id="currentPassword" placeholder="현재 비밀번호를 입력" inputmode="text">
                                </div>
                                <div class="form-group">
                                    <input type="password" class="form-input" id="newPassword" placeholder="새 비밀번호 (최소 6자)" inputmode="text">
                                </div>
                                <div class="form-group">
                                    <input type="password" class="form-input" id="confirmPassword" placeholder="새 비밀번호를 다시 입력" inputmode="text">
                                </div>
                                <div class="form-actions">
                                    <button class="cancel-btn" id="cancelPasswordChange">취소</button>
                                    <button class="save-btn" id="savePasswordChange">저장</button>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="drawer-foot">
                <button class="logout-btn" type="button" id="drawerLogout">로그아웃</button>
            </div>
        </aside>

        <!-- 하단 네비게이터 -->
        <nav class="bottom-nav-wrap">
            <div class="bottom-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a class="nav-link" data-route="home" href="main.html">
                            <span class="nav-ico">
                                <i data-lucide="home" class="nav-svg"></i>
                            </span>
                            <span class="nav-label">홈</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-route="output" href="worklog.html">
                            <span class="nav-ico">
                                <i data-lucide="calculator" class="nav-svg"></i>
                            </span>
                            <span class="nav-label">출력현황</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-route="worklog" href="task.html">
                            <span class="nav-ico">
                                <i data-lucide="clipboard-list" class="nav-svg"></i>
                            </span>
                            <span class="nav-label">작업일지</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-route="sites" href="site.html">
                            <span class="nav-ico">
                                <i data-lucide="map" class="nav-svg"></i>
                            </span>
                            <span class="nav-label">현장정보</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-route="docs" href="doc.html">
                            <span class="nav-ico">
                                <i data-lucide="folder" class="nav-svg"></i>
                            </span>
                            <span class="nav-label">문서함</span>
                        </a>
                    </li>
                </ul>
            </div>
        </nav>

    </div>

    <script>
        // Lucide 아이콘 초기화
        lucide.createIcons();


        // 폰트 로딩 상태 확인 및 fallback 처리
        function checkFontLoading() {
            // Poppins 폰트 로딩 확인
            if ('fonts' in document) {
                document.fonts.load('700 24px Poppins').then(() => {
                    console.log('Poppins 폰트 로딩 완료');
                }).catch(() => {
                    console.log('Poppins 폰트 로딩 실패 - fallback 폰트 사용');
                    // 폰트 로딩 실패 시 fallback 클래스 추가
                    document.body.classList.add('font-loading-fallback');
                });
            }
            
            // Noto Sans KR 폰트 로딩 확인
            if ('fonts' in document) {
                document.fonts.load('400 15px Noto Sans KR').then(() => {
                    console.log('Noto Sans KR 폰트 로딩 완료');
                }).catch(() => {
                    console.log('Noto Sans KR 폰트 로딩 실패 - fallback 폰트 사용');
                });
            }
        }

        // 통합 ESC 키 이벤트 리스너
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                // 검색 페이지 닫기
                const searchPage = document.getElementById('searchPage');
                if (searchPage && searchPage.classList.contains('active')) {
                    searchPage.classList.remove('active');
                    const spInput = document.getElementById('spInput');
                    if (spInput) spInput.value = '';
                    return;
                }
                
                // 알림 팝업 닫기
                const notificationPopup = document.getElementById('notificationPopup');
                if (notificationPopup && notificationPopup.classList.contains('show')) {
                    notificationPopup.classList.remove('show');
                    notificationPopup.classList.add('hidden');
                    return;
                }
                
                // 햄버거 드로어 닫기
                const drawer = document.getElementById('drawer');
                if (drawer && drawer.classList.contains('show')) {
                    const scrim = document.getElementById('drawerScrim');
                    if (scrim) scrim.classList.remove('show');
                    drawer.classList.remove('show');
                    drawer.setAttribute('aria-hidden','true');
                    document.body.classList.remove('modal-open');
                    return;
                }
            }
        });

        // 헤더 기능들
        // 터치/마우스 눌림 효과
        document.addEventListener('pointerdown', e => {
            const a = e.target.closest('.nav-link');
            if (!a) return;
            a.classList.add('pressed');
        });
        document.addEventListener('pointerup', e => {
            document.querySelectorAll('.nav-link.pressed').forEach(el => el.classList.remove('pressed'));
        });
        document.addEventListener('pointercancel', e => {
            document.querySelectorAll('.nav-link.pressed').forEach(el => el.classList.remove('pressed'));
        });

        document.addEventListener('DOMContentLoaded', function() {
            // 페이지 로드 시 폰트 상태 확인
            checkFontLoading();
            
            // 네비게이터 상태 관리 초기화
            initNavigationStatus();
            
            // 검색 페이지 기능
            const searchBtn = document.getElementById('searchBtn');
            const searchPage = document.getElementById('searchPage');
            const spBack = document.getElementById('spBack');
            const spInput = document.getElementById('spInput');
            const spList = document.getElementById('spList');

            // 최근 검색어 예시
            const keywords = [
                "INOPNC 프로젝트", "현장 관리", "작업 일지", "출력 현황", 
                "문서 관리", "사용자 설정", "알림 설정", "데이터 분석"
            ];

            if (searchBtn && searchPage && spBack && spInput && spList) {
                // 검색 버튼 클릭 시 검색 페이지 활성화
                searchBtn.addEventListener('click', function(e) {
                    // 리플 효과 추가
                    searchBtn.classList.add('ripple');
                    setTimeout(() => {
                        searchBtn.classList.remove('ripple');
                    }, 300);
                    
                    // 햅틱 피드백 (지원하는 경우)
                    if (navigator.vibrate) {
                        navigator.vibrate(10);
                    }
                    
                    searchPage.classList.add('active');
                    spInput.focus();
                    renderRecentKeywords();
                    console.log('검색 페이지 활성화됨');
                });

                // 뒤로가기 버튼 클릭 시 검색 페이지 닫기
                spBack.addEventListener('click', function() {
                    searchPage.classList.remove('active');
                    spInput.value = '';
                    console.log('검색 페이지 비활성화됨');
                });

                // 검색 입력 처리 (디바운스 적용)
                let searchTimeout;
                let currentIndex = -1;
                let searchResults = [];
                
                spInput.addEventListener('input', function() {
                    const searchTerm = this.value.trim();
                    
                    // 이전 타이머 클리어
                    clearTimeout(searchTimeout);
                    currentIndex = -1;
                    
                    if (searchTerm.length > 0) {
                        // 입력 중일 때 로딩 효과
                        spList.innerHTML = '<div class="sp-loading">검색 중...</div>';
                        
                        // 300ms 후 검색 실행 (디바운스)
                        searchTimeout = setTimeout(() => {
                            console.log('검색어:', searchTerm);
                            performSearch(searchTerm);
                        }, 300);
                    } else {
                        // 빈 값일 때 최근 검색어 표시
                        renderRecentKeywords();
                    }
                });

                // 키보드 네비게이션
                spInput.addEventListener('keydown', function(e) {
                    const rows = spList.querySelectorAll('.sp-row');
                    
                    if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        currentIndex = Math.min(currentIndex + 1, rows.length - 1);
                        updateActiveRow(rows);
                    } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        currentIndex = Math.max(currentIndex - 1, -1);
                        updateActiveRow(rows);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (currentIndex >= 0 && rows[currentIndex]) {
                            rows[currentIndex].click();
                        } else {
                            const searchTerm = this.value.trim();
                            if (searchTerm.length > 0) {
                                console.log('Enter로 검색:', searchTerm);
                                performSearch(searchTerm);
                            }
                        }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        searchPage.classList.remove('active');
                        spInput.value = '';
                    }
                });
                
                function updateActiveRow(rows) {
                    rows.forEach((row, index) => {
                        row.classList.toggle('active', index === currentIndex);
                    });
                }

                // 최근 검색어 렌더링
                function renderRecentKeywords() {
                    spList.innerHTML = '';
                    spList.className = 'sp-list recent-keywords';
                    searchResults = keywords;
                    keywords.forEach((keyword, index) => {
                        const row = document.createElement('div');
                        row.className = 'sp-row recent-keyword';
                        row.innerHTML = \`
                            <div class="sp-num">\${index + 1}</div>
                            <div class="sp-item">\${keyword}</div>
                        \`;
                        row.addEventListener('click', function(e) {
                            // 리플 효과 추가
                            const rect = row.getBoundingClientRect();
                            const size = Math.max(rect.width, rect.height);
                            const ripple = document.createElement('span');
                            ripple.className = 'search-ripple';
                            ripple.style.width = ripple.style.height = size + 'px';
                            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                            row.appendChild(ripple);
                            setTimeout(() => ripple.remove(), 460);
                            
                            // 클릭 애니메이션
                            row.classList.add('clicked');
                            setTimeout(() => row.classList.remove('clicked'), 600);
                            
                            // 햅틱 피드백
                            if (navigator.vibrate) {
                                navigator.vibrate(10);
                            }
                            
                            spInput.value = keyword;
                            performSearch(keyword);
                        });
                        spList.appendChild(row);
                    });
                }

                // 검색 실행 함수
                function performSearch(searchTerm) {
                    console.log('검색 실행:', searchTerm);
                    // 검색 결과 렌더링 (예시)
                    const results = [
                        \`"\${searchTerm}"에 대한 검색 결과 1\`,
                        \`"\${searchTerm}"에 대한 검색 결과 2\`,
                        \`"\${searchTerm}"에 대한 검색 결과 3\`,
                        \`"\${searchTerm}"에 대한 검색 결과 4\`,
                        \`"\${searchTerm}"에 대한 검색 결과 5\`
                    ];
                    
                    spList.innerHTML = '';
                    spList.className = 'sp-list';
                    searchResults = results;
                    results.forEach((result, index) => {
                        const row = document.createElement('div');
                        row.className = 'sp-row';
                        row.innerHTML = \`
                            <div class="sp-num">\${index + 1}</div>
                            <div class="sp-item">\${result}</div>
                        \`;
                        row.addEventListener('click', function(e) {
                            // 리플 효과 추가
                            const rect = row.getBoundingClientRect();
                            const size = Math.max(rect.width, rect.height);
                            const ripple = document.createElement('span');
                            ripple.className = 'search-ripple';
                            ripple.style.width = ripple.style.height = size + 'px';
                            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                            row.appendChild(ripple);
                            setTimeout(() => ripple.remove(), 460);
                            
                            // 클릭 애니메이션
                            row.classList.add('clicked');
                            setTimeout(() => row.classList.remove('clicked'), 600);
                            
                            // 햅틱 피드백
                            if (navigator.vibrate) {
                                navigator.vibrate(10);
                            }
                            
                            console.log('검색 결과 클릭:', result);
                        });
                        spList.appendChild(row);
                    });
                }
            }

            // 알림 팝업 기능
            const notificationBtn = document.getElementById('notificationBtn');
            const notificationPopup = document.getElementById('notificationPopup');
            const notificationClose = document.getElementById('notificationClose');
            const notificationMore = document.getElementById('notificationMore');
            const notificationBadge = document.getElementById('notificationBadge');
            const bellIcon = document.getElementById('bellIcon');

            // 알림 카운트 관리
            let notificationCount = 0;
            let unreadCount = 0;

            // 알림 카운트 업데이트 함수
            function updateNotificationCount(count) {
                notificationCount = count;
                if (notificationBadge) {
                    if (count > 0) {
                        notificationBadge.textContent = count > 99 ? '99+' : count;
                        notificationBadge.classList.remove('hidden');
                        notificationBadge.classList.add('count-up');
                        
                        // 카운트 업 애니메이션 완료 후 클래스 제거
                        setTimeout(() => {
                            notificationBadge.classList.remove('count-up');
                        }, 500);
                    } else {
                        notificationBadge.classList.add('hidden');
                    }
                }
            }

            // 따릉따릉 애니메이션 함수
            function triggerBellShake() {
                if (bellIcon) {
                    bellIcon.classList.add('bell-shake');
                    
                    // 애니메이션 완료 후 클래스 제거
                    setTimeout(() => {
                        bellIcon.classList.remove('bell-shake');
                    }, 600);
                }
            }

            // 새 알림 추가 함수 (시뮬레이션용)
            function addNewNotification() {
                unreadCount++;
                updateNotificationCount(unreadCount);
                triggerBellShake();
                
                // 배지에 펄스 효과 추가
                if (notificationBadge) {
                    notificationBadge.classList.add('pulse');
                    setTimeout(() => {
                        notificationBadge.classList.remove('pulse');
                    }, 3000);
                }
                
                console.log(\`새 알림 추가됨. 총 \${unreadCount}개\`);
            }

            // 알림 읽음 처리 함수
            function markNotificationsAsRead() {
                unreadCount = 0;
                updateNotificationCount(0);
                console.log('모든 알림을 읽음으로 처리');
            }

            if (notificationBtn && notificationPopup) {
                // 알림 버튼 클릭 시 팝업 표시 및 읽음 처리
                notificationBtn.addEventListener('click', function() {
                    notificationPopup.classList.add('show');
                    notificationPopup.classList.remove('hidden');
                    
                    // 알림 팝업을 열면 읽음 처리
                    markNotificationsAsRead();
                    
                    console.log('알림 팝업 표시됨');
                });

                // 닫기 버튼 클릭 시 팝업 숨김
                if (notificationClose) {
                    notificationClose.addEventListener('click', function() {
                        notificationPopup.classList.remove('show');
                        notificationPopup.classList.add('hidden');
                        console.log('알림 팝업 숨김됨');
                    });
                }

                // 알림 더보기 버튼
                if (notificationMore) {
                    notificationMore.addEventListener('click', function() {
                        console.log('알림 더보기 클릭됨');
                        // 알림 더보기 페이지로 이동하거나 추가 알림 로드
                        notificationPopup.classList.remove('show');
                        notificationPopup.classList.add('hidden');
                    });
                }

                // 팝업 외부 클릭 시 닫기
                notificationPopup.addEventListener('click', function(e) {
                    if (e.target === notificationPopup) {
                        notificationPopup.classList.remove('show');
                        notificationPopup.classList.add('hidden');
                    }
                });

                // 시뮬레이션: 새 알림 추가 (테스트용)
                // 실제 환경에서는 서버에서 푸시 알림을 받아서 호출
                window.addTestNotification = addNewNotification;
                
                // 자동 시뮬레이션 (5초마다 새 알림 추가)
                // 실제 환경에서는 제거하고 서버 푸시로 대체
                setInterval(() => {
                    if (Math.random() < 0.3) { // 30% 확률로 새 알림
                        addNewNotification();
                    }
                }, 5000);
            }

            // 햄버거 드로어 기능
            (function(){
                const btn = document.getElementById('menuBtn');
                const scrim = document.getElementById('drawerScrim');
                const drawer = document.getElementById('drawer');
                const drawerScale = document.querySelector('.drawer-scale');
                const closeBtn = document.getElementById('drawerCloseBtn');
                const accountManageBtn = document.getElementById('accountManageBtn');
                const accountInfo = document.getElementById('accountInfo');
                const changePasswordBtn = document.getElementById('changePasswordBtn');
                const passwordChangeForm = document.getElementById('passwordChangeForm');
                const cancelPasswordChange = document.getElementById('cancelPasswordChange');
                const savePasswordChange = document.getElementById('savePasswordChange');
                const drawerLogout = document.getElementById('drawerLogout');
                
                function lockScroll(lock){ 
                    document.body.classList.toggle('modal-open', !!lock); 
                }
                
                function fitDrawer(){
                    if(!drawer || !drawerScale) return;
                    
                    // 모바일에서는 스케일링 비활성화
                    if (window.innerWidth <= 768) {
                        drawerScale.style.transform = 'none';
                        return;
                    }
                    
                    // 가용 높이(패널 패딩/안전영역 감안)
                    const style = getComputedStyle(drawer);
                    const padTop = parseFloat(style.paddingTop);
                    const padBottom = parseFloat(style.paddingBottom);
                    const avail = window.innerHeight - padTop - padBottom;

                    // 실제 콘텐츠 전체 높이
                    const contentH = drawerScale.scrollHeight;

                    // 축소 비율 계산 (최소 0.85 유지)
                    const s = Math.max(0.85, Math.min(1, avail / contentH));
                    drawerScale.style.transform = \`scale(\${s})\`;
                }
                
                function open(){ 
                    scrim.classList.add('show'); 
                    drawer.classList.add('show'); 
                    drawer.setAttribute('aria-hidden','false'); 
                    lockScroll(true);
                    // 열릴 때 자동 축소 적용
                    setTimeout(fitDrawer, 50);
                }
                
                function close(){ 
                    scrim.classList.remove('show'); 
                    drawer.classList.remove('show'); 
                    drawer.setAttribute('aria-hidden','true'); 
                    lockScroll(false); 
                }
                
                // 햄버거 버튼 클릭 시 드로어 열기
                btn?.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    open();
                });
                
                closeBtn?.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                });
                
                scrim?.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    close();
                });
                
                // 햄버거 메뉴 링크 클릭 이벤트
                const menuItems = document.querySelectorAll('.menu-item');
                menuItems.forEach(item => {
                    item.addEventListener('click', function(e) {
                        const href = this.getAttribute('href');
                        if (href && href !== '#' && !href.startsWith('#')) {
                            e.preventDefault();
                            // 드로어 닫기
                            close();
                            // 페이지 이동
                            setTimeout(() => {
                                window.location.href = href;
                            }, 200);
                        }
                    });
                });
                
                // 뷰포트 변동에 대응
                window.addEventListener('resize', fitDrawer);
                window.visualViewport?.addEventListener('resize', fitDrawer);
                window.visualViewport?.addEventListener('scroll', fitDrawer);
                
                // 모바일 키보드 대응
                if (window.visualViewport) {
                    window.visualViewport.addEventListener('resize', function() {
                        // 키보드가 올라올 때 드로어 높이 조정
                        if (window.visualViewport.height < window.innerHeight) {
                            drawer.style.height = window.visualViewport.height + 'px';
                        } else {
                            drawer.style.height = '100vh';
                        }
                    });
                }
                
                // 계정관리 버튼 클릭
                accountManageBtn?.addEventListener('click', function() {
                    if (accountInfo.style.display === 'none') {
                        accountInfo.style.display = 'block';
                        this.textContent = '접기';
                    } else {
                        accountInfo.style.display = 'none';
                        this.textContent = '계정관리';
                    }
                });
                
                // 비밀번호 변경 버튼 클릭
                changePasswordBtn?.addEventListener('click', function() {
                    passwordChangeForm.style.display = 'block';
                    accountInfo.style.display = 'none';
                    accountManageBtn.textContent = '계정관리';
                });
                
                // 비밀번호 변경 취소
                cancelPasswordChange?.addEventListener('click', function() {
                    // 폼 초기화
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                    // 폼 숨기기
                    passwordChangeForm.style.display = 'none';
                    // 계정 정보 다시 보이기
                    accountInfo.style.display = 'block';
                });
                
                // 비밀번호 변경 저장
                savePasswordChange?.addEventListener('click', function() {
                    const currentPassword = document.getElementById('currentPassword').value;
                    const newPassword = document.getElementById('newPassword').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    
                    // 입력값 검증
                    if (!currentPassword.trim()) {
                        alert('현재 비밀번호를 입력해주세요.');
                        document.getElementById('currentPassword').focus();
                        return;
                    }
                    
                    if (!newPassword.trim()) {
                        alert('새 비밀번호를 입력해주세요.');
                        document.getElementById('newPassword').focus();
                        return;
                    }
                    
                    if (!confirmPassword.trim()) {
                        alert('새 비밀번호 확인을 입력해주세요.');
                        document.getElementById('confirmPassword').focus();
                        return;
                    }
                    
                    if (newPassword !== confirmPassword) {
                        alert('새 비밀번호가 일치하지 않습니다.');
                        document.getElementById('confirmPassword').focus();
                        return;
                    }
                    
                    if (newPassword.length < 6) {
                        alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
                        document.getElementById('newPassword').focus();
                        return;
                    }
                    
                    if (currentPassword === newPassword) {
                        alert('현재 비밀번호와 새 비밀번호가 같습니다.');
                        document.getElementById('newPassword').focus();
                        return;
                    }
                    
                    // 비밀번호 변경 로직 (실제 API 호출)
                    console.log('비밀번호 변경 요청:', {
                        currentPassword,
                        newPassword
                    });
                    
                    // 성공 시 처리
                    alert('비밀번호가 성공적으로 변경되었습니다.');
                    
                    // 폼 초기화 및 숨기기
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                    passwordChangeForm.style.display = 'none';
                    accountInfo.style.display = 'block';
                });
                
                // 로그아웃 버튼 클릭
                drawerLogout?.addEventListener('click', function() {
                    if (confirm('정말 로그아웃하시겠습니까?')) {
                        console.log('로그아웃');
                        // 실제 구현 시 로그아웃 로직
                        alert('로그아웃되었습니다.');
                        close();
                    }
                });
            })();

            // 글씨 크기 토글 버튼 (본문 컨테이너에 fs-150 적용)
                const fontSizeBtn = document.getElementById('fontSizeBtn');
                const fontSizeText = document.getElementById('fontSizeText');
                let isLargeFont = false;
                
                if (fontSizeBtn && fontSizeText) {
                fontSizeBtn.addEventListener('click', function() {
                    isLargeFont = !isLargeFont;
                    
                    // 컨테이너 찾기 (여러 선택자 시도)
                    let container = document.querySelector('.main-page-content');
                    if (!container) {
                        container = document.querySelector('.main-content');
                    }
                    if (!container) {
                        container = document.querySelector('.container');
                    }
                    if (!container) {
                        container = document.querySelector('main');
                    }
                    
                    console.log('찾은 컨테이너:', container);
                        
                        if (isLargeFont) {
                        if (container) {
                            container.classList.add('fs-150');
                            console.log('큰글씨 클래스 추가됨:', container.className);
                        }
                            fontSizeText.textContent = '큰글씨';
                        console.log('큰글씨로 변경됨 (본문 컨테이너에 적용):', container);
                        } else {
                        if (container) {
                            container.classList.remove('fs-150');
                            console.log('큰글씨 클래스 제거됨:', container.className);
                        }
                            fontSizeText.textContent = '작은글씨';
                        console.log('작은글씨로 변경됨 (본문 컨테이너에서 제거):', container);
                    }
                });
            }

            // 다크모드 버튼 기능
            const darkModeBtn = document.getElementById('darkModeBtn');
            const darkModeIcon = document.getElementById('darkModeIcon');
            let isDarkMode = false;

            if (darkModeBtn && darkModeIcon) {
                darkModeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    isDarkMode = !isDarkMode;
                    
                    if (isDarkMode) {
                        document.documentElement.setAttribute('data-theme', 'dark');
                        darkModeIcon.setAttribute('data-lucide', 'sun');
                        console.log('다크모드로 변경됨');
                    } else {
                        document.documentElement.setAttribute('data-theme', 'light');
                        darkModeIcon.setAttribute('data-lucide', 'moon');
                        console.log('라이트모드로 변경됨');
                    }
                    
                    // Lucide 아이콘 다시 렌더링
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                });
            }

            // 하단 네비게이션 기능 (베이스 파일과 100% 동일)
            const navLinks = document.querySelectorAll('.nav-link');
            
            // 현재 페이지에 따른 활성 네비게이션 아이템 설정
            const currentPage = window.location.pathname.split('/').pop() || 'home.html';
            
            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href === currentPage || 
                    (currentPage === 'index.html' && href === 'home.html') ||
                    (currentPage === '' && href === 'home.html')) {
                    link.classList.add('active');
                }
            });

            // 네비게이션 클릭 이벤트
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    const route = this.getAttribute('data-route');
                    const href = this.getAttribute('href');
                    
                    // 해시 링크인 경우 페이지 이동 없이 처리
                    if (href.startsWith('#')) {
                        e.preventDefault();
                        console.log(\`\${route} 섹션으로 스크롤\`);
                        // 해당 섹션으로 스크롤하는 로직 추가
                        return;
                    }
                    
                    // 모든 활성 클래스 제거
                    navLinks.forEach(l => l.classList.remove('active'));
                    // 현재 클릭된 링크에 활성 클래스 추가
                    this.classList.add('active');
                    
                    console.log(\`\${route} 페이지로 이동: \${href}\`);
                });
            });

            // INOPNC 브랜드 타이틀 클릭 시 메인으로 이동
            const brandTitle = document.getElementById('brandTitle');
            if (brandTitle) {
                brandTitle.addEventListener('click', function() {
                    window.location.href = 'main.html';
                });
            }

            // ========== 공지사항 슬라이드 기능 ==========
            function initNoticeSlider() {
                const noticeItems = document.querySelectorAll('.notice-item');
                let currentIndex = 0;
                
                if (noticeItems.length <= 1) return; // 공지사항이 1개 이하면 슬라이드 불필요
                
                function showNextNotice() {
                    // 현재 활성화된 항목을 이전으로 표시
                    noticeItems[currentIndex].classList.remove('active');
                    noticeItems[currentIndex].classList.add('prev');
                    
                    // 다음 인덱스 계산
                    currentIndex = (currentIndex + 1) % noticeItems.length;
                    
                    // 다음 항목을 활성화
                    noticeItems[currentIndex].classList.remove('prev');
                    noticeItems[currentIndex].classList.add('active');
                    
                    // 이전 항목의 prev 클래스 제거 (애니메이션 완료 후)
                    setTimeout(() => {
                        noticeItems.forEach((item, index) => {
                            if (index !== currentIndex) {
                                item.classList.remove('prev');
                            }
                        });
                    }, 400);
                }
                
                // 3초마다 다음 공지사항으로 슬라이드
                setInterval(showNextNotice, 3000);
            }

            // 공지사항 슬라이드 초기화
            initNoticeSlider();

            // ========== 이미지 로딩 오류 처리 ==========
            function handleImageErrors() {
                const quickMenuImages = document.querySelectorAll('#quick-menu .quick-item img');
                
                quickMenuImages.forEach(img => {
                    // 이미지 로딩 실패 시 처리
                    img.addEventListener('error', function() {
                        console.log('이미지 로딩 실패:', this.src);
                        
                        // 로컬 이미지로 대체 시도
                        const altText = this.alt;
                        let fallbackSrc = '';
                        
                        switch(altText) {
                            case '출력현황':
                                fallbackSrc = './public/images/pay.png';
                                break;
                            case '작업일지':
                                fallbackSrc = './public/images/report.png';
                                break;
                            case '현장정보':
                                fallbackSrc = './public/images/map.png';
                                break;
                            case '문서함':
                                fallbackSrc = './public/images/doc.png';
                                break;
                            case '본사요청':
                                fallbackSrc = './public/images/request.png';
                                break;
                            case '재고관리':
                                fallbackSrc = './public/images/stock.png';
                                break;
                            default:
                                fallbackSrc = './public/images/logo_a.png';
                        }
                        
                        // 로컬 이미지로 대체
                        if (fallbackSrc) {
                            this.src = fallbackSrc;
                            this.onerror = null; // 무한 루프 방지
                        }
                    });
                    
                    // 이미지 로딩 성공 시 처리
                    img.addEventListener('load', function() {
                        console.log('이미지 로딩 성공:', this.src);
                    });
                });
            }

        // 이미지 오류 처리 초기화
        handleImageErrors();

        // ========== 빠른메뉴 모바일 인터랙션 처리 ==========
        function initQuickMenuInteractions() {
            console.log('빠른메뉴 인터랙션 초기화 시작');
            const quickItems = document.querySelectorAll('#quick-menu .quick-item');
            console.log(\`빠른메뉴 아이템 개수: \${quickItems.length}\`);
            
            quickItems.forEach(item => {
                // 모바일에서 pointer 이벤트로 pressed 클래스 토글
                item.addEventListener('pointerdown', function(e) {
                    e.preventDefault();
                    this.classList.add('pressed');
                });
                
                item.addEventListener('pointerup', function(e) {
                    e.preventDefault();
                    this.classList.remove('pressed');
                });
                
                item.addEventListener('pointercancel', function(e) {
                    e.preventDefault();
                    this.classList.remove('pressed');
                });
                
                // 터치 이벤트도 처리 (iOS Safari 호환성)
                item.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    this.classList.add('pressed');
                });
                
                item.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    this.classList.remove('pressed');
                });
                
                item.addEventListener('touchcancel', function(e) {
                    e.preventDefault();
                    this.classList.remove('pressed');
                });
                
                // 키보드 접근성 개선
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.classList.add('pressed');
                    }
                });
                
                item.addEventListener('keyup', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.classList.remove('pressed');
                        // 링크 클릭 실행
                        if (e.key === 'Enter') {
                            this.click();
                        }
                    }
                });
                
                // 클릭 이벤트 처리
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    const href = this.getAttribute('href');
                    const text = this.querySelector('span')?.textContent || '알 수 없음';
                    
                    console.log(\`빠른메뉴 클릭: \${text} -> \${href}\`);
                    
                    if (href && href !== '#') {
                        // 페이지 이동 전에 pressed 클래스 제거
                        this.classList.remove('pressed');
                        
                        // 약간의 지연 후 페이지 이동 (시각적 피드백을 위해)
                        setTimeout(() => {
                            console.log(\`페이지 이동: \${href}\`);
                            window.location.href = href;
                        }, 150);
                    } else {
                        console.log('유효하지 않은 링크:', href);
                    }
                });
            });
            
            console.log('빠른메뉴 인터랙션 초기화 완료');
        }
        
        // 빠른메뉴 인터랙션 초기화
        initQuickMenuInteractions();
        
        // 빠른메뉴 팝업 초기화
        initQuickMenuPopup();

        // ========== 네비게이터 상태 관리 ==========
        function initNavigationStatus() {
            // 네비게이터 상태 관리 제거됨
        }

        // 현재 페이지 감지 함수 제거됨

        // 현재 페이지 표시 제거됨

        // 폼 작성 상태 모니터링 제거됨

        // 네비게이터 상태 설정 함수들 제거됨

        // ========== 전역 상태 객체 ==========
        const state = {
            site: '',
            date: new Date().toISOString().split('T')[0],
            writer: '',
            part: [], // 부재명 배열
            proc: [], // 작업공정 배열
            area: [], // 작업유형 배열
            block: { type: '', val: '' },
            dong: '',
            section: '',
            ho: '',
            men: 1,
            additionalTags: [], // 추가태그 배열
            additionalManpower: [], // 추가 공수 배열
            photos: {
                pre: [],
                post: [],
                receipt: [],
                drawing: []
            }
        };

        // ========== 로그인된 사용자 정보 가져오기 ==========
        function getLoggedInUser() {
            // 실제로는 서버에서 로그인된 사용자 정보를 가져와야 함
            // 현재는 프로필에서 사용자명을 가져옴
            const profileUserName = document.getElementById('profileUserName');
            if (profileUserName) {
                const userName = profileUserName.textContent.split(' ')[0]; // "이현수 현장관리자"에서 "이현수"만 추출
                return userName;
            }
            return '이현수'; // 기본값
        }

        // ========== localStorage 유틸리티 ==========
        const storage = {
            save: function(key, data) {
                try {
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (e) {
                    console.error('저장 실패:', e);
                    return false;
                }
            },
            load: function(key) {
                try {
                    const data = localStorage.getItem(key);
                    return data ? JSON.parse(data) : null;
                } catch (e) {
                    console.error('로드 실패:', e);
                    return null;
                }
            },
            remove: function(key) {
                try {
                    localStorage.removeItem(key);
                    return true;
                } catch (e) {
                    console.error('삭제 실패:', e);
                    return false;
                }
            }
        };

        // ========== 오늘 날짜 가져오기 ==========
        function getTodayDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            return \`\${year}-\${month}-\${day}\`;
        }

        // ========== 작업일지 폼 기능 ==========
        function initWorkLogForm() {
            // 작성자 자동 설정
            const authorInput = document.getElementById('author');
            if (authorInput) {
                authorInput.value = getLoggedInUser();
                state.writer = getLoggedInUser();
            }

            // 작업일자 자동 설정 (오늘 날짜)
            const workDateInput = document.getElementById('workDate');
            if (workDateInput) {
                workDateInput.value = getTodayDate();
            }

            // 옵션 버튼 토글 기능 (다중 선택 허용)
            const optionButtons = document.querySelectorAll('.option-btn');
            optionButtons.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // 토글 기능 (다중 선택 허용)
                    this.classList.toggle('active');
                    
                    // 상태 업데이트
                    updateButtonGroupState(this);
                    
                    // 직접입력 처리
                    handleCustomInput(this);
                    
                    // 요약 업데이트
                    updateSummary();
                });
                
                // 키보드 접근성 추가
                btn.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.click();
                    }
                });
            });

            // 버튼 그룹 상태 업데이트 함수
            function updateButtonGroupState(clickedButton) {
                const group = clickedButton.closest('.button-group');
                const formGroup = group.closest('.form-group');
                const groupId = formGroup.querySelector('.form-label').textContent;
                
                const activeButtons = group.querySelectorAll('.option-btn.active');
                const values = Array.from(activeButtons).map(btn => {
                    const customInput = formGroup.querySelector('.custom-input');
                    if (btn.dataset.value === 'other' && customInput && customInput.value.trim()) {
                        return customInput.value.trim();
                    }
                    return btn.dataset.value;
                }).filter(value => value && value.trim() !== '');

                // 상태에 반영
                if (groupId.includes('부재명')) {
                    state.part = values;
                } else if (groupId.includes('작업공정')) {
                    state.proc = values;
                } else if (groupId.includes('작업유형')) {
                    state.area = values;
                }
                
                // 디버깅을 위한 콘솔 로그
                console.log(\`Updated \${groupId}:\`, values);
            }

            // 직접입력 처리 함수
            function handleCustomInput(button) {
                const formGroup = button.closest('.form-group');
                const customInput = formGroup.querySelector('.custom-input');
                
                if (button.dataset.value === 'other' && customInput) {
                    if (button.classList.contains('active')) {
                        customInput.style.display = 'block';
                        customInput.focus();
                        
                        // 기존 이벤트 리스너 제거 후 새로 추가 (중복 방지)
                        customInput.removeEventListener('input', handleCustomInputChange);
                        customInput.removeEventListener('blur', handleCustomInputBlur);
                        customInput.addEventListener('input', handleCustomInputChange);
                        customInput.addEventListener('blur', handleCustomInputBlur);
                        
                        // 다른 화면 클릭 시 텍스트박스 숨김
                        const hideInputOnClickOutside = (event) => {
                            if (!formGroup.contains(event.target)) {
                                customInput.style.display = 'none';
                                document.removeEventListener('click', hideInputOnClickOutside);
                            }
                        };
                        
                        setTimeout(() => {
                            document.addEventListener('click', hideInputOnClickOutside);
                        }, 100);
                    } else {
                        customInput.style.display = 'none';
                        customInput.value = '';
                        // 상태 업데이트
                        updateButtonGroupState(button);
                        updateSummary();
                    }
                }
            }

            // 직접입력 변경 처리 함수
            function handleCustomInputChange(event) {
                const customInput = event.target;
                const formGroup = customInput.closest('.form-group');
                const button = formGroup.querySelector('.option-btn[data-value="other"]');
                updateButtonGroupState(button);
                updateSummary();
            }
            
            // 직접입력 blur 처리 함수
            function handleCustomInputBlur(event) {
                const customInput = event.target;
                if (!customInput.value.trim()) {
                    const formGroup = customInput.closest('.form-group');
                    const button = formGroup.querySelector('.option-btn[data-value="other"]');
                    if (button) {
                        button.classList.remove('active');
                        customInput.style.display = 'none';
                        updateButtonGroupState(button);
                        updateSummary();
                    }
                }
            }

            // 숫자 입력 컨트롤
            // 블럭/동/호수 입력 이벤트
            const blockInput = document.getElementById('block');
            const buildingInput = document.getElementById('building');
            const unitInput = document.getElementById('unit');

            if (blockInput) {
                blockInput.addEventListener('input', function() {
                    state.block.val = this.value.toUpperCase();
                    this.value = state.block.val; // 대문자로 변환된 값을 다시 입력
                    updateSummary();
                });
            }

            if (buildingInput) {
                buildingInput.addEventListener('input', function() {
                    state.dong = this.value;
                    updateSummary();
                });
            }

            if (unitInput) {
                unitInput.addEventListener('input', function() {
                    state.ho = this.value;
                    updateSummary();
                });
            }

            // 공수(일) 컨트롤 이벤트 (data-values 기반)
            const minusBtn = document.querySelector('.number-btn.minus');
            const plusBtn = document.querySelector('.number-btn.plus');
            const numberField = document.getElementById('manDays');
            const qtySplit3 = document.querySelector('.qty-split3');

            // data-values 파싱 (기본값: 0,0.5,1,1.5,2,2.5,3)
            const dataValues = qtySplit3 ? qtySplit3.getAttribute('data-values') : '0,0.5,1,1.5,2,2.5,3';
            const values = dataValues.split(',').map(v => parseFloat(v.trim()));

            if (minusBtn && plusBtn && numberField) {
                minusBtn.addEventListener('click', function() {
                    const currentValue = parseFloat(numberField.value) || 1;
                    const currentIndex = values.indexOf(currentValue);
                    if (currentIndex > 0) {
                        const newValue = values[currentIndex - 1];
                        numberField.value = newValue;
                        state.men = newValue;
                        updateSummary();
                        updateSummaryPersonnel(newValue);
                    }
                });

                plusBtn.addEventListener('click', function() {
                    const currentValue = parseFloat(numberField.value) || 1;
                    const currentIndex = values.indexOf(currentValue);
                    if (currentIndex < values.length - 1) {
                        const newValue = values[currentIndex + 1];
                        numberField.value = newValue;
                        state.men = newValue;
                        updateSummary();
                        updateSummaryPersonnel(newValue);
                    }
                });

                // 키보드 이벤트 (←/→, +/-)
                numberField.addEventListener('keydown', function(e) {
                    const currentValue = parseFloat(this.value) || 1;
                    const currentIndex = values.indexOf(currentValue);
                    
                    if (e.key === 'ArrowLeft' || e.key === '-') {
                        e.preventDefault();
                        if (currentIndex > 0) {
                            const newValue = values[currentIndex - 1];
                            this.value = newValue;
                            state.men = newValue;
                            updateSummary();
                            updateSummaryPersonnel(newValue);
                        }
                    } else if (e.key === 'ArrowRight' || e.key === '+') {
                        e.preventDefault();
                        if (currentIndex < values.length - 1) {
                            const newValue = values[currentIndex + 1];
                            this.value = newValue;
                            state.men = newValue;
                            updateSummary();
                            updateSummaryPersonnel(newValue);
                        }
                    }
                });

                // 직접 입력 시에도 출력인원 업데이트
                numberField.addEventListener('input', function() {
                    let value = parseFloat(this.value) || 1;
                    // data-values에 있는 값으로 제한
                    if (!values.includes(value)) {
                        // 가장 가까운 값으로 조정
                        const closest = values.reduce((prev, curr) => 
                            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                        );
                        value = closest;
                        this.value = value;
                    }
                    state.men = value;
                    updateSummary();
                    updateSummaryPersonnel(value);
                });
            }

            // 출력인원 업데이트 함수
            function updateSummaryPersonnel(manDays) {
                const personnelElement = document.getElementById('summary-personnel');
                if (personnelElement) {
                    personnelElement.textContent = manDays + '명';
                }
            }

            // 현장 선택 시 선택된 현장 표시 업데이트
            const siteSelect = document.getElementById('siteSelect');
            const selectedSiteDisplay = document.getElementById('selectedSiteDisplay');

            if (siteSelect && selectedSiteDisplay) {
                siteSelect.addEventListener('change', function() {
                    const selectedValue = this.value;
                    const selectedText = this.options[this.selectedIndex].text;
                    
                    // 선택된 현장 표시 업데이트 (input 필드에 텍스트 표시)
                    if (selectedValue) {
                        selectedSiteDisplay.value = selectedText;
                        selectedSiteDisplay.title = selectedText; // 툴팁 업데이트
                    } else {
                        selectedSiteDisplay.value = "현장 미선택";
                        selectedSiteDisplay.title = "현장 미선택";
                    }
                    
                    // 요약 업데이트
                    updateSummary();
                });
            }

            // 폼 리셋 기능 (최적화)
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    // 모든 입력 필드 초기화
                    const form = document.querySelector('.work-form-container');
                    const inputs = form.querySelectorAll('input, select');
                    inputs.forEach(input => {
                         if (input.id === 'workDate') {
                             input.value = getTodayDate(); // 오늘 날짜로 초기화
                         } else if (input.id === 'author') {
                             input.value = getLoggedInUser(); // 로그인된 사용자로 초기화
                        } else if (input.type === 'number') {
                            input.value = '1';
                        } else {
                            input.value = '';
                        }
                    });

                    // 모든 옵션 버튼 비활성화
                    optionButtons.forEach(btn => btn.classList.remove('active'));

                     // 직접입력 필드 숨김 및 초기화
                     const customInputs = document.querySelectorAll('.custom-input');
                     customInputs.forEach(input => {
                         input.style.display = 'none';
                         input.value = '';
                     });

                // 상태 초기화
                state.part = [];
                state.proc = [];
                state.area = [];
                state.block = { type: '', val: '' };
                state.dong = '';
                state.section = '';
                state.ho = '';
                state.men = 1;
                state.additionalTags = [];
                state.additionalManpower = [];
                
                // 추가태그 컨테이너 초기화
                if (additionalWorkTagsContainer) {
                    additionalWorkTagsContainer.innerHTML = '';
                }
                
                // 추가 공수 행들 초기화
                const additionalManpowerRows = document.querySelectorAll('.additional-manpower-row');
                additionalManpowerRows.forEach(row => row.remove());

                    // 선택된 현장 표시 초기화
                    if (selectedSiteDisplay) {
                        selectedSiteDisplay.value = '';
                    }

                     // 요약 재렌더
                     updateSummary();

                     // 네비게이터 상태 초기화 제거됨

                     // 알림 표시
                     alert('폼이 초기화되었습니다.');

                    console.log('폼이 초기화되었습니다.');
                });
            }

            // 저장 기능
            const saveBtn = document.getElementById('saveBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    // 필수값 검증: site, date, writer, part, men
                    let isValid = true;
                    const missingFields = [];

                    // site 검증
                    const siteValue = document.getElementById('siteSelect').value;
                    if (!siteValue || !siteValue.trim()) {
                            isValid = false;
                        missingFields.push('현장');
                    }

                    // date 검증
                    const dateValue = document.getElementById('workDate').value;
                    if (!dateValue || !dateValue.trim()) {
                        isValid = false;
                        missingFields.push('작업일자');
                    }

                    // writer 검증
                    const writerValue = document.getElementById('author').value;
                    if (!writerValue || !writerValue.trim()) {
                        isValid = false;
                        missingFields.push('작성자');
                    }

                    // part 검증 (홈 변형에서는 part 필요)
                    if (state.part.length === 0) {
                        isValid = false;
                        missingFields.push('부재명');
                    }

                    // men 검증 (men<1이면 1로 보정)
                    let menValue = parseFloat(document.getElementById('manDays').value) || 0;
                    if (menValue < 1) {
                        menValue = 1; // 1로 보정
                        document.getElementById('manDays').value = 1;
                        state.men = 1;
                    }

                    if (isValid) {
                        // newWorkLog 객체 생성
                        const newWorkLog = {
                            date: dateValue,
                            site: siteValue,
                            men: menValue,
                            writer: writerValue,
                            part: state.part.join(', '),
                            process: state.proc.join(', '),
                            area: state.area.join(', '),
                            photos: {
                                before: state.photos.pre.length,
                                after: state.photos.post.length,
                                receipt: state.photos.receipt.length,
                                drawing: state.photos.drawing.length
                            },
                            timestamp: new Date().toISOString()
                        };

                        // localStorage에 저장
                        const existingData = storage.load('workLogData') || [];
                        
                        // 동일 날짜가 존재하면 교체, 없으면 push
                        const existingIndex = existingData.findIndex(item => item.date === dateValue);
                        if (existingIndex !== -1) {
                            existingData[existingIndex] = newWorkLog;
                        } else {
                            existingData.push(newWorkLog);
                        }
                        
                        storage.save('workLogData', existingData);

                        // 요약 재렌더
                        updateSummary();

                        // 네비게이터 상태 업데이트 제거됨

                        // 알림 표시
                        alert('작업일지가 성공적으로 저장되었습니다!');
                        
                        console.log('저장된 데이터:', newWorkLog);
                        console.log('전체 저장 데이터:', existingData);
                    } else {
                        alert(\`다음 필수 항목을 입력해주세요:\n\${missingFields.join(', ')}\`);
                    }
                });
            }

            // ========== 추가태그 기능 ==========
            const addWorkContentBtn = document.getElementById('addWorkContentBtn');
            const addManDaysBtn = document.getElementById('addManDaysBtn');
            const additionalWorkTagsContainer = document.getElementById('additionalWorkTagsContainer');

            // 추가태그 행 생성 함수
            function createAdditionalWorkRow(tagId) {
                const row = document.createElement('div');
                row.className = 'additional-work-row';
                row.setAttribute('data-tag-id', tagId);
                
                row.innerHTML = \`
                    <div class="section-header">
                        <h3 class="section-title">작업 내용 기록</h3>
                        <div class="header-actions">
                            <button class="delete-tag-btn" onclick="deleteAdditionalTag('\${tagId}')">삭제</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">부재명</label>
                        <div class="button-group">
                            <button class="option-btn" data-value="slab">슬라브</button>
                            <button class="option-btn" data-value="girder">거더</button>
                            <button class="option-btn" data-value="column">기둥</button>
                            <button class="option-btn" data-value="other">기타</button>
                        </div>
                        <input type="text" class="form-input custom-input" placeholder="부재명을 직접 입력하세요" style="display: none; margin-top: 8px; border-radius: 14px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">작업공정</label>
                        <div class="button-group">
                            <button class="option-btn" data-value="crack">균열</button>
                            <button class="option-btn" data-value="surface">면</button>
                            <button class="option-btn" data-value="finish">마감</button>
                            <button class="option-btn" data-value="other">기타</button>
                        </div>
                        <input type="text" class="form-input custom-input" placeholder="작업공정을 직접 입력하세요" style="display: none; margin-top: 8px; border-radius: 14px;">
                    </div>
                    <div class="form-group">
                        <label class="form-label">작업유형</label>
                        <div class="button-group">
                            <button class="option-btn" data-value="underground">지하</button>
                            <button class="option-btn" data-value="roof">지붕</button>
                            <button class="option-btn" data-value="other">기타</button>
                        </div>
                        <input type="text" class="form-input custom-input" placeholder="작업유형을 직접 입력하세요" style="display: none; margin-top: 8px; border-radius: 14px;">
                    </div>
                    <div class="form-group block-dong-ho-group">
                        <label class="form-label">블럭 / 동 / 호수</label>
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" class="form-input" placeholder="블럭" maxlength="2">
                            </div>
                            <div class="form-group">
                                <input type="text" class="form-input" placeholder="동" maxlength="2">
                            </div>
                            <div class="form-group">
                                <input type="text" class="form-input" placeholder="호수" maxlength="2">
                            </div>
                        </div>
                    </div>
                \`;
                
                return row;
            }

            // 추가태그 삭제 함수
            window.deleteAdditionalTag = function(tagId) {
                const row = document.querySelector(\`[data-tag-id="\${tagId}"]\`);
                if (row) {
                    row.remove();
                    // 상태에서도 제거
                    state.additionalTags = state.additionalTags.filter(tag => tag.id !== tagId);
                    updateSummary();
                    console.log(\`추가태그 \${tagId} 삭제됨\`);
                }
            };

            // 작업 내용 추가 버튼
            if (addWorkContentBtn) {
                addWorkContentBtn.addEventListener('click', function() {
                    const tagId = 'tag_' + Date.now();
                    const newRow = createAdditionalWorkRow(tagId);
                    
                    if (additionalWorkTagsContainer) {
                        additionalWorkTagsContainer.appendChild(newRow);
                        
                        // 상태에 추가
                        state.additionalTags.push({
                            id: tagId,
                            part: [],
                            proc: [],
                            area: [],
                            block: { type: '', val: '' },
                            dong: '',
                            section: '',
                            ho: ''
                        });
                        
                        // 새로 추가된 행의 이벤트 리스너 설정
                        initAdditionalTagRowEvents(newRow, tagId);
                        
                        console.log(\`추가태그 \${tagId} 추가됨\`);
                    }
                });
            }

            // 추가태그 행의 이벤트 리스너 설정
            function initAdditionalTagRowEvents(row, tagId) {
                const optionButtons = row.querySelectorAll('.option-btn');
                const customInputs = row.querySelectorAll('.custom-input');
                const blockInputs = row.querySelectorAll('.block-dong-ho-group input');

                // 옵션 버튼 이벤트
                optionButtons.forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.classList.toggle('active');
                        updateAdditionalTagButtonGroupState(this, tagId);
                        handleAdditionalTagCustomInput(this, tagId);
                        updateSummary();
                    });
                });

                // 블럭/동/호수 입력 이벤트
                blockInputs.forEach((input, index) => {
                    input.addEventListener('input', function() {
                        const tag = state.additionalTags.find(t => t.id === tagId);
                        if (tag) {
                            if (index === 0) { // 블럭
                                tag.block.val = this.value.toUpperCase();
                            } else if (index === 1) { // 동
                                tag.dong = this.value;
                            } else if (index === 2) { // 호수
                                tag.ho = this.value;
                            }
                        }
                        updateSummary();
                    });
                });
            }

            // 추가태그 버튼 그룹 상태 업데이트
            function updateAdditionalTagButtonGroupState(clickedButton, tagId) {
                const buttonGroup = clickedButton.closest('.button-group');
                const groupId = buttonGroup.previousElementSibling.textContent;
                const activeButtons = buttonGroup.querySelectorAll('.option-btn.active');
                
                const values = Array.from(activeButtons).map(btn => {
                    if (btn.dataset.value === 'other') {
                        const customInput = buttonGroup.nextElementSibling;
                        if (customInput && customInput.style.display !== 'none') {
                            return customInput.value.trim();
                        }
                    }
                    return btn.dataset.value;
                }).filter(value => value && value.trim() !== '');

                // 해당 태그의 상태에 반영
                const tag = state.additionalTags.find(t => t.id === tagId);
                if (tag) {
                    if (groupId.includes('부재명')) {
                        tag.part = values;
                    } else if (groupId.includes('작업공정')) {
                        tag.proc = values;
                    } else if (groupId.includes('작업유형')) {
                        tag.area = values;
                    }
                }
                
                console.log(\`Updated additional tag \${tagId} \${groupId}:\`, values);
            }

            // 추가태그 직접입력 처리
            function handleAdditionalTagCustomInput(button, tagId) {
                if (button.dataset.value === 'other') {
                    const customInput = button.closest('.button-group').nextElementSibling;
                    if (customInput) {
                        if (button.classList.contains('active')) {
                            customInput.style.display = 'block';
                            customInput.focus();
                            
                            // 직접입력 이벤트 리스너 추가
                            customInput.addEventListener('input', function(e) {
                                updateAdditionalTagButtonGroupState(button, tagId);
                            });
                            
                            customInput.addEventListener('blur', function(e) {
                                if (!this.value.trim()) {
                                    button.classList.remove('active');
                                    this.style.display = 'none';
                                }
                            });
                        } else {
                            customInput.style.display = 'none';
                            customInput.value = '';
                        }
                    }
                }
            }

            // 공수 추가 버튼 - 동일한 구조의 행 추가
            if (addManDaysBtn) {
                addManDaysBtn.addEventListener('click', function() {
                    const rowId = 'manpower_row_' + Date.now();
                    const newRow = createAdditionalManpowerRow(rowId);
                    
                    // 기존 작성자/공수 행 다음에 추가
                    const existingRow = document.querySelector('.author-manpower-row');
                    if (existingRow && existingRow.parentNode) {
                        existingRow.parentNode.insertBefore(newRow, existingRow.nextSibling);
                        
                        // 상태에 추가
                        state.additionalManpower = state.additionalManpower || [];
                        state.additionalManpower.push({
                            id: rowId,
                            author: '',
                            manDays: 1
                        });
                        
                        // 새로 추가된 행의 이벤트 리스너 설정
                        initAdditionalManpowerRowEvents(newRow, rowId);
                        
                        console.log(\`추가 공수 행 \${rowId} 추가됨\`);
                    }
                });
            }

            // 추가 공수 행 생성 함수
            function createAdditionalManpowerRow(rowId) {
                const row = document.createElement('div');
                row.className = 'additional-manpower-section';
                row.setAttribute('data-row-id', rowId);
                
                row.innerHTML = \`
                    <div class="section-header">
                        <h3 class="section-title">공수(일)</h3>
                        <div class="header-actions">
                            <button class="delete-tag-btn" onclick="deleteAdditionalManpowerRow('\${rowId}')">삭제</button>
                        </div>
                    </div>
                    <div class="form-row author-manpower-row">
                        <div class="form-group">
                            <label class="form-label">작성자</label>
                            <select class="form-select author-select" data-row-id="\${rowId}">
                                <option value="">선택</option>
                                <option value="김재형">김재형</option>
                                <option value="송용호">송용호</option>
                                <option value="권용호">권용호</option>
                                <option value="강영권">강영권</option>
                                <option value="김문수">김문수</option>
                                <option value="이장환">이장환</option>
                                <option value="직접입력">직접입력</option>
                            </select>
                            <input type="text" class="form-input custom-author-input" placeholder="작성자명을 직접 입력하세요" style="display: none; margin-top: 8px;" data-row-id="\${rowId}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">공수</label>
                            <div class="number-input qty-split3" data-values="0,0.5,1,1.5,2,2.5,3">
                                <button class="number-btn minus">-</button>
                                <input type="number" class="number-field" value="1" min="0" step="0.5" data-row-id="\${rowId}">
                                <button class="number-btn plus">+</button>
                            </div>
                        </div>
                    </div>
                \`;
                
                return row;
            }

            // 추가 공수 행 삭제 함수
            window.deleteAdditionalManpowerRow = function(rowId) {
                const row = document.querySelector(\`[data-row-id="\${rowId}"]\`);
                if (row) {
                    row.remove();
                    // 상태에서도 제거
                    if (state.additionalManpower) {
                        state.additionalManpower = state.additionalManpower.filter(item => item.id !== rowId);
                    }
                    updateSummary();
                    console.log(\`추가 공수 행 \${rowId} 삭제됨\`);
                }
            };

            // 추가 공수 행의 이벤트 리스너 설정
            function initAdditionalManpowerRowEvents(row, rowId) {
                const authorSelect = row.querySelector('.author-select');
                const customAuthorInput = row.querySelector('.custom-author-input');
                const numberField = row.querySelector('.number-field');
                const minusBtn = row.querySelector('.number-btn.minus');
                const plusBtn = row.querySelector('.number-btn.plus');

                // 작성자 선택 이벤트
                if (authorSelect) {
                    authorSelect.addEventListener('change', function() {
                        const selectedAuthor = this.value;
                        const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                        
                        if (selectedAuthor === '직접입력') {
                            customAuthorInput.style.display = 'block';
                            customAuthorInput.focus();
                        } else if (selectedAuthor) {
                            customAuthorInput.style.display = 'none';
                            customAuthorInput.value = '';
                            if (manpowerItem) {
                                manpowerItem.author = selectedAuthor;
                            }
                            updateSummary();
                        }
                    });
                }

                // 직접입력 작성자 이벤트
                if (customAuthorInput) {
                    customAuthorInput.addEventListener('input', function() {
                        const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                        if (manpowerItem) {
                            manpowerItem.author = this.value.trim();
                        }
                        updateSummary();
                    });

                    customAuthorInput.addEventListener('blur', function() {
                        if (!this.value.trim()) {
                            const authorSelect = row.querySelector('.author-select');
                            if (authorSelect) {
                                authorSelect.value = '';
                            }
                            this.style.display = 'none';
                        }
                    });
                }

                // 공수 입력 이벤트 (data-values 기반)
                const qtySplit3 = row.querySelector('.qty-split3');
                const dataValues = qtySplit3 ? qtySplit3.getAttribute('data-values') : '0,0.5,1,1.5,2,2.5,3';
                const values = dataValues.split(',').map(v => parseFloat(v.trim()));

                if (minusBtn && plusBtn && numberField) {
                    minusBtn.addEventListener('click', function() {
                        const currentValue = parseFloat(numberField.value) || 1;
                        const currentIndex = values.indexOf(currentValue);
                        if (currentIndex > 0) {
                            const newValue = values[currentIndex - 1];
                            numberField.value = newValue;
                            const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                            if (manpowerItem) {
                                manpowerItem.manDays = newValue;
                            }
                            updateSummary();
                        }
                    });

                    plusBtn.addEventListener('click', function() {
                        const currentValue = parseFloat(numberField.value) || 1;
                        const currentIndex = values.indexOf(currentValue);
                        if (currentIndex < values.length - 1) {
                            const newValue = values[currentIndex + 1];
                            numberField.value = newValue;
                            const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                            if (manpowerItem) {
                                manpowerItem.manDays = newValue;
                            }
                            updateSummary();
                        }
                    });

                    // 키보드 이벤트
                    numberField.addEventListener('keydown', function(e) {
                        const currentValue = parseFloat(this.value) || 1;
                        const currentIndex = values.indexOf(currentValue);
                        
                        if (e.key === 'ArrowLeft' || e.key === '-') {
                            e.preventDefault();
                            if (currentIndex > 0) {
                                const newValue = values[currentIndex - 1];
                                this.value = newValue;
                                const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                                if (manpowerItem) {
                                    manpowerItem.manDays = newValue;
                                }
                                updateSummary();
                            }
                        } else if (e.key === 'ArrowRight' || e.key === '+') {
                            e.preventDefault();
                            if (currentIndex < values.length - 1) {
                                const newValue = values[currentIndex + 1];
                                this.value = newValue;
                                const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                                if (manpowerItem) {
                                    manpowerItem.manDays = newValue;
                                }
                                updateSummary();
                            }
                        }
                    });

                    numberField.addEventListener('input', function() {
                        let value = parseFloat(this.value) || 1;
                        if (!values.includes(value)) {
                            const closest = values.reduce((prev, curr) => 
                                Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                            );
                            value = closest;
                            this.value = value;
                        }
                        const manpowerItem = state.additionalManpower.find(item => item.id === rowId);
                        if (manpowerItem) {
                            manpowerItem.manDays = value;
                        }
                        updateSummary();
                    });
                }
            }

            // 캘린더 아이콘 클릭 이벤트
            const calendarIcon = document.getElementById('calendarIcon');
            
            if (calendarIcon && workDateInput) {
                calendarIcon.addEventListener('click', function() {
                    workDateInput.focus();
                    // showPicker() 메서드가 지원되는 브라우저에서 날짜 선택기 열기
                    if (workDateInput.showPicker) {
                        workDateInput.showPicker();
                    }
                });

                // 작업일자 변경 시 요약 업데이트
                workDateInput.addEventListener('change', function() {
                    updateSummary();
                });
            }

            // 작성자 변경 시 요약 업데이트
            if (authorInput) {
                authorInput.addEventListener('input', function() {
                    updateSummary();
                });
            }

            // 요약 업데이트 함수 (최적화)
            function updateSummary() {
                // DOM 요소들을 한 번에 가져와서 성능 최적화
                const elements = {
                    site: document.getElementById('summary-site'),
                    date: document.getElementById('summary-date'),
                    author: document.getElementById('summary-author'),
                    component: document.getElementById('summary-component'),
                    process: document.getElementById('summary-process'),
                    worktype: document.getElementById('summary-worktype'),
                    mandays: document.getElementById('summary-mandays'),
                    personnel: document.getElementById('summary-personnel'),
                    photos: document.getElementById('summary-photos'),
                    documents: document.getElementById('summary-documents'),
                    location: document.getElementById('summary-location')
                };

                // 현장 요약 업데이트
                if (elements.site) {
                    const siteSelect = document.getElementById('siteSelect');
                    elements.site.textContent = siteSelect && siteSelect.value ? siteSelect.value : '선택 안됨';
                }

                // 작업일자 요약 업데이트
                if (elements.date && workDateInput) {
                    elements.date.textContent = workDateInput.value || getTodayDate();
                }

                // 작성자 요약 업데이트
                if (elements.author && authorInput) {
                    elements.author.textContent = authorInput.value || getLoggedInUser();
                }

                // 부재명 요약 업데이트
                if (elements.component) {
                    elements.component.textContent = state.part.length > 0 ? state.part.join(', ') : '없음';
                }

                // 작업공정 요약 업데이트
                if (elements.process) {
                    elements.process.textContent = state.proc.length > 0 ? state.proc.join(', ') : '없음';
                }

                // 작업유형 요약 업데이트
                if (elements.worktype) {
                    elements.worktype.textContent = state.area.length > 0 ? state.area.join(', ') : '없음';
                }

                // 공수 요약 업데이트 (n일)
                if (elements.mandays) {
                    elements.mandays.textContent = \`\${state.men}일\`;
                }

                // 출력인원 요약 업데이트 (n명)
                if (elements.personnel) {
                    elements.personnel.textContent = \`\${state.men}명\`;
                }

                // 사진 합계 요약 업데이트
                if (elements.photos) {
                    const preCount = state.photos.pre.length;
                    const postCount = state.photos.post.length;
                    elements.photos.textContent = \`보수 전 \${preCount}장 / 보수 후 \${postCount}장\`;
                }

                // 도면 요약 업데이트
                if (elements.documents) {
                    const drawingCount = state.photos.drawing.length;
                    elements.documents.textContent = \`\${drawingCount}장\`;
                }

                // 위치 요약 업데이트 (block/dong/ho 형식)
                if (elements.location) {
                    const block = state.block.val || '';
                    const dong = state.dong || '';
                    const ho = state.ho || '';
                    
                    if (block || dong || ho) {
                        elements.location.textContent = \`\${block}/\${dong}/\${ho}\`.replace(/\/$/, '');
                    } else {
                        elements.location.textContent = '없음';
                    }
                }
                
                // 디버깅을 위한 콘솔 로그
                console.log('Summary updated:', {
                    site: elements.site?.textContent,
                    date: elements.date?.textContent,
                    author: elements.author?.textContent,
                    part: state.part,
                    proc: state.proc,
                    area: state.area,
                    men: state.men,
                    photos: { pre: state.photos.pre.length, post: state.photos.post.length },
                    drawing: state.photos.drawing.length,
                    location: \`\${state.block.val}/\${state.dong}/\${state.ho}\`
                });
            }

            // 초기 요약 업데이트
            updateSummary();
        }

        // 작업일지 폼 초기화
        initWorkLogForm();

        // ========== 첨부파일 섹션 기능 ==========
        function initAttachmentSection() {
            const beforeArea = document.querySelector('.before-area');
            const afterArea = document.querySelector('.after-area');
            const beforeCounter = document.querySelector('.photo-upload-item:first-child .counter-number');
            const afterCounter = document.querySelector('.photo-upload-item:last-child .counter-number');

            // 파일 업로드 기능
            function setupUploadArea(area, type) {
                // 기존 이벤트 리스너 제거 (중복 방지)
                area.removeEventListener('click', area._clickHandler);
                area.removeEventListener('dragover', area._dragoverHandler);
                area.removeEventListener('dragleave', area._dragleaveHandler);
                area.removeEventListener('drop', area._dropHandler);
                
                // 클릭으로 파일 선택
                area._clickHandler = function(e) {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.style.display = 'none';
                    
                    input.addEventListener('change', function(e) {
                        const files = Array.from(e.target.files);
                        handleFileUpload(files, type);
                    });
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                };
                area.addEventListener('click', area._clickHandler);

                // 드래그 앤 드롭
                area._dragoverHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '#00BCD4';
                    this.style.backgroundColor = '#F0FDFF';
                };
                area.addEventListener('dragover', area._dragoverHandler);

                area._dragleaveHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = type === 'before' ? '#7C3AED' : '#00BCD4';
                    this.style.backgroundColor = type === 'before' ? '#F3F0FF' : '#F0FDFF';
                };
                area.addEventListener('dragleave', area._dragleaveHandler);

                area._dropHandler = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = type === 'before' ? '#7C3AED' : '#00BCD4';
                    this.style.backgroundColor = type === 'before' ? '#F3F0FF' : '#F0FDFF';
                    
                    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                    handleFileUpload(files, type);
                };
                area.addEventListener('drop', area._dropHandler);
            }

            // 파일 업로드 처리
            function handleFileUpload(files, type) {
                const maxFiles = 30;
                const currentCount = state.photos[type === 'before' ? 'pre' : 'post'].length;
                
                if (currentCount + files.length > maxFiles) {
                    alert(\`최대 \${maxFiles}장까지 업로드 가능합니다. (현재: \${currentCount}장)\`);
                    return;
                }

                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const photoData = {
                            id: 'photo_' + Date.now() + '_' + Math.random(),
                            name: file.name,
                            url: e.target.result,
                            type: file.type,
                            size: file.size
                        };

                        if (type === 'before') {
                            state.photos.pre.push(photoData);
                        } else {
                            state.photos.post.push(photoData);
                        }

                        createThumbnail(photoData, type);
                        refreshCounts();
                        updateSummary();
                    };
                    reader.readAsDataURL(file);
                });
            }

            // 썸네일 생성
            function createThumbnail(photoData, type) {
                const area = type === 'before' ? beforeArea : afterArea;
                
                
                const thumbnail = document.createElement('div');
                thumbnail.className = 'photo-thumbnail';
                thumbnail.draggable = true;
                thumbnail.setAttribute('data-photo-id', photoData.id);
                thumbnail.setAttribute('data-type', type);
                
                thumbnail.innerHTML = \`
                    <img src="\${photoData.url}" alt="\${photoData.name}">
                    <button class="delete-photo-btn" onclick="event.stopPropagation(); deletePhoto('\${photoData.id}', '\${type}')">×</button>
                    <button class="move-photo-btn" onclick="event.stopPropagation(); togglePhotoCategory('\${photoData.id}', '\${type}')">↔</button>
                \`;

                // 드래그 이벤트
                thumbnail.addEventListener('dragstart', function(e) {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        id: photoData.id,
                        type: type
                    }));
                });

                // 썸네일 클릭 시 업로드 영역으로 이벤트 전파 방지
                thumbnail.addEventListener('click', function(e) {
                    e.stopPropagation();
                });

                area.appendChild(thumbnail);
            }

            // 사진 삭제 함수
            window.deletePhoto = function(photoId, type) {
                if (type === 'before') {
                    state.photos.pre = state.photos.pre.filter(photo => photo.id !== photoId);
                } else {
                    state.photos.post = state.photos.post.filter(photo => photo.id !== photoId);
                }
                
                const thumbnail = document.querySelector(\`[data-photo-id="\${photoId}"]\`);
                if (thumbnail) {
                    thumbnail.remove();
                }
                
                
                refreshCounts();
                updateSummary();
            };



            // 카운트 업데이트
            function refreshCounts() {
                const preCount = state.photos.pre.length;
                const postCount = state.photos.post.length;
                const totalCount = preCount + postCount;
                
                // 모든 카운터 요소 찾기
                const allCounters = document.querySelectorAll('.counter-number');
                console.log(\`발견된 카운터 개수: \${allCounters.length}\`);
                
                // 보수전 카운터 업데이트 (첫 번째)
                if (allCounters.length > 0) {
                    allCounters[0].textContent = preCount;
                    console.log(\`보수전 카운터 업데이트: \${preCount}\`);
                }
                
                // 보수후 카운터 업데이트 (두 번째)
                if (allCounters.length > 1) {
                    allCounters[1].textContent = postCount;
                    console.log(\`보수후 카운터 업데이트: \${postCount}\`);
                }
                
                // 전체 카운터 업데이트 (세 번째 또는 별도)
                const totalCounter = document.querySelector('.upload-counter .counter-number');
                if (totalCounter) {
                    totalCounter.textContent = totalCount;
                    console.log(\`전체 카운터 업데이트: \${totalCount}\`);
                }
                
                // 추가 안전장치: ID로 직접 찾기
                const beforeCounterById = document.querySelector('#before-counter');
                const afterCounterById = document.querySelector('#after-counter');
                
                if (beforeCounterById) {
                    beforeCounterById.textContent = preCount;
                    console.log(\`ID로 보수전 카운터 업데이트: \${preCount}\`);
                }
                
                if (afterCounterById) {
                    afterCounterById.textContent = postCount;
                    console.log(\`ID로 보수후 카운터 업데이트: \${postCount}\`);
                }
                
                // 디버깅을 위한 콘솔 로그
                console.log(\`전체 카운터 업데이트 완료: 보수전=\${preCount}, 보수후=\${postCount}, 전체=\${totalCount}\`);
            }

            // 카테고리 간 드래그&드롭 이동
            function setupCategoryDrop(area, targetType) {
                area.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                area.addEventListener('drop', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    try {
                        const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
                        if (dragData.id && dragData.type) {
                            movePhotoBetweenCategories(dragData.id, dragData.type, targetType);
                        }
                    } catch (error) {
                        console.error('드래그 데이터 파싱 오류:', error);
                    }
                });
            }

            // 사진을 카테고리 간 이동
            function movePhotoBetweenCategories(photoId, fromType, toType) {
                if (fromType === toType) return;

                const fromArray = fromType === 'before' ? state.photos.pre : state.photos.post;
                const toArray = toType === 'before' ? state.photos.pre : state.photos.post;
                
                // 최대 30장 제한 확인
                if (toArray.length >= 30) {
                    alert('최대 30장까지 업로드 가능합니다.');
                    return;
                }

                // 사진 찾기 및 이동
                const photoIndex = fromArray.findIndex(photo => photo.id === photoId);
                if (photoIndex !== -1) {
                    const photo = fromArray[photoIndex];
                    fromArray.splice(photoIndex, 1);
                    toArray.push(photo);

                    // DOM에서 썸네일 이동
                    const thumbnail = document.querySelector(\`[data-photo-id="\${photoId}"]\`);
                    if (thumbnail) {
                        thumbnail.remove();
                        createThumbnail(photo, toType);
                    }

                    // 카운터 즉시 업데이트 (여러 번 호출하여 확실하게)
                    console.log(\`이미지 이동: \${fromType} -> \${toType}, 보수전: \${state.photos.pre.length}, 보수후: \${state.photos.post.length}\`);
                    
                    // 즉시 업데이트
                    refreshCounts();
                    
                    // DOM 업데이트 후 재업데이트
                    setTimeout(() => {
                        refreshCounts();
                        updateSummary();
                    }, 10);
                    
                    // 추가 안전장치
                    setTimeout(() => {
                        refreshCounts();
                    }, 50);
                    
                    // 최종 확인
                    setTimeout(() => {
                        refreshCounts();
                        console.log(\`최종 카운터 확인: 보수전=\${state.photos.pre.length}, 보수후=\${state.photos.post.length}\`);
                    }, 100);
                }
            }

            // 사진 카테고리 토글 (보수전 ↔ 보수후)
            window.togglePhotoCategory = function(photoId, currentType) {
                const toType = currentType === 'before' ? 'after' : 'before';
                movePhotoBetweenCategories(photoId, currentType, toType);
            };

            // 드롭 영역 설정
            setupUploadArea(beforeArea, 'before');
            setupUploadArea(afterArea, 'after');
            setupCategoryDrop(beforeArea, 'before');
            setupCategoryDrop(afterArea, 'after');


            // 초기 카운트 설정
            refreshCounts();

            // 사진 업로드 버튼 기능
            const photoResetBtn = document.getElementById('photoResetBtn');
            const photoSaveBtn = document.getElementById('photoSaveBtn');

            // 처음부터 버튼 - 업로드한 행위 초기화
            if (photoResetBtn) {
                photoResetBtn.addEventListener('click', function() {
                    resetPhotoUploads();
                });
            }

            // 저장하기 버튼 - 관리자 콘솔에 사진 데이터 저장
            if (photoSaveBtn) {
                photoSaveBtn.addEventListener('click', function() {
                    savePhotosToAdmin();
                });
            }

            // 사진 업로드 초기화 함수
            function resetPhotoUploads() {
                // 상태 초기화
                state.photos.pre = [];
                state.photos.post = [];
                
                // DOM에서 모든 썸네일 제거
                const beforeArea = document.querySelector('.before-area');
                const afterArea = document.querySelector('.after-area');
                
                if (beforeArea) {
                    beforeArea.innerHTML = '';
                }
                
                if (afterArea) {
                    afterArea.innerHTML = '';
                }
                
                // 카운트 업데이트
                refreshCounts();
                updateSummary();
                
                alert('사진 업로드가 초기화되었습니다.');
            }

            // 사진을 관리자 콘솔에 저장하는 함수
            function savePhotosToAdmin() {
                const prePhotos = state.photos.pre;
                const postPhotos = state.photos.post;
                
                if (prePhotos.length === 0 && postPhotos.length === 0) {
                    alert('저장할 사진이 없습니다.');
                    return;
                }

                // 관리자 콘솔 데이터 구조
                const adminPhotoData = {
                    id: 'photo_upload_' + Date.now(),
                    site: state.site || '미선택',
                    date: state.date || getTodayDate(),
                    writer: state.writer || getLoggedInUser(),
                    part: state.part.join(', ') || '없음',
                    proc: state.proc.join(', ') || '없음',
                    area: state.area.join(', ') || '없음',
                    men: state.men,
                    block: state.block.val || '',
                    dong: state.dong || '',
                    ho: state.ho || '',
                    photos: {
                        pre: prePhotos.map(photo => ({
                            id: photo.id,
                            name: photo.name,
                            type: photo.type,
                            size: photo.size,
                            timestamp: new Date().toISOString()
                        })),
                        post: postPhotos.map(photo => ({
                            id: photo.id,
                            name: photo.name,
                            type: photo.type,
                            size: photo.size,
                            timestamp: new Date().toISOString()
                        }))
                    },
                    timestamp: new Date().toISOString(),
                    status: 'pending' // 관리자 승인 대기 상태
                };

                // 관리자 콘솔에 저장 (localStorage 시뮬레이션)
                const adminData = JSON.parse(localStorage.getItem('adminPhotoData') || '[]');
                adminData.push(adminPhotoData);
                localStorage.setItem('adminPhotoData', JSON.stringify(adminData));

                // 사진 데이터를 관리자 콘솔에 매핑
                const photoMapping = {
                    uploadId: adminPhotoData.id,
                    siteMapping: adminPhotoData.site,
                    dateMapping: adminPhotoData.date,
                    photoCount: {
                        pre: prePhotos.length,
                        post: postPhotos.length,
                        total: prePhotos.length + postPhotos.length
                    },
                    mappingTimestamp: new Date().toISOString()
                };

                // 사진 매핑 데이터 저장
                const mappingData = JSON.parse(localStorage.getItem('photoMappingData') || '[]');
                mappingData.push(photoMapping);
                localStorage.setItem('photoMappingData', JSON.stringify(mappingData));

                alert(\`사진이 관리자 콘솔에 저장되었습니다.\n보수 전: \${prePhotos.length}장, 보수 후: \${postPhotos.length}장\`);
                
                // 요약 업데이트
                updateSummary();
            }

            console.log('첨부파일 섹션 초기화됨');
        }

        // 첨부파일 섹션 초기화
        initAttachmentSection();

        // ========== 도면 관리 섹션 기능 ==========
        function initDrawingSection() {
            const uploadBtn = document.querySelector('.drawing-actions .btn-outline');
            const loadBtn = document.querySelector('.drawing-actions .btn-secondary');
            const saveBtn = document.querySelector('.drawing-actions .btn-primary');
            const drawingPreview = document.getElementById('drawingPreview');

            // 도면 업로드 기능
            if (uploadBtn) {
                uploadBtn.addEventListener('click', function() {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.display = 'none';
                    
                    input.addEventListener('change', function(e) {
                        const file = e.target.files[0];
                        if (file) {
                            handleDrawingUpload(file);
                        }
                    });
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                });
            }

            // 도면 불러오기 기능
            if (loadBtn) {
                loadBtn.addEventListener('click', function() {
                    loadDrawingFromStorage();
                });
            }

            // 도면 저장하기 기능
            if (saveBtn) {
                saveBtn.addEventListener('click', function() {
                    saveMarkedDrawing();
                });
            }

            // 도면 업로드 처리
            function handleDrawingUpload(file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const drawingData = {
                        id: 'drawing_' + Date.now(),
                        name: file.name,
                        url: e.target.result,
                        type: file.type,
                        size: file.size,
                        timestamp: new Date().toISOString()
                    };

                    // 관리자 데이터에 저장 (localStorage 시뮬레이션)
                    const adminData = JSON.parse(localStorage.getItem('adminDrawings') || '[]');
                    adminData.push(drawingData);
                    localStorage.setItem('adminDrawings', JSON.stringify(adminData));

                    // 도면 미리보기 표시
                    showDrawingPreview(drawingData);
                    
                    alert('도면이 관리자 데이터에 저장되었습니다.');
                    updateSummary();
                };
                reader.readAsDataURL(file);
            }

            // 저장된 도면 불러오기
            function loadDrawingFromStorage() {
                const adminData = JSON.parse(localStorage.getItem('adminDrawings') || '[]');
                
                if (adminData.length === 0) {
                    alert('저장된 도면이 없습니다.');
                    return;
                }

                // 가장 최근 도면 불러오기
                const latestDrawing = adminData[adminData.length - 1];
                showDrawingPreview(latestDrawing);
                
                alert('도면을 불러왔습니다. 마킹 기능을 사용할 수 있습니다.');
            }

            // 도면 미리보기 표시
            function showDrawingPreview(drawingData) {
                // 기존 미리보기 제거
                const existingPreview = document.getElementById('drawingPreview');
                if (existingPreview) {
                    existingPreview.remove();
                }

                // 새 미리보기 생성
                const preview = document.createElement('div');
                preview.id = 'drawingPreview';
                preview.className = 'drawing-preview';
                preview.innerHTML = \`
                    <div class="drawing-preview-header">
                        <h4>도면 미리보기</h4>
                        <button class="close-drawing-btn" onclick="closeDrawingPreview()">닫기</button>
                    </div>
                    <div class="drawing-canvas-container">
                        <canvas id="drawingCanvas" width="800" height="600"></canvas>
                    </div>
                    <div class="drawing-tools">
                        <button class="drawing-tool-btn" data-tool="pen">펜</button>
                        <button class="drawing-tool-btn" data-tool="eraser">지우개</button>
                        <button class="drawing-tool-btn" data-tool="clear">전체 지우기</button>
                    </div>
                \`;

                // 도면 섹션에 추가
                const drawingSection = document.querySelector('.drawing-section');
                if (drawingSection) {
                    drawingSection.appendChild(preview);
                }

                // 캔버스에 도면 그리기
                const canvas = document.getElementById('drawingCanvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = function() {
                    // 컨테이너 너비에 맞춘 캔버스 크기 계산
                    const container = canvas.parentElement;
                    const containerWidth = container.clientWidth - 32; // 패딩 고려
                    const imgRatio = img.width / img.height;
                    const canvasWidth = containerWidth;
                    const canvasHeight = canvasWidth / imgRatio;
                    
                    // 캔버스 크기 설정
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    canvas.style.width = canvasWidth + 'px';
                    canvas.style.height = canvasHeight + 'px';
                    
                    // 이미지 그리기
                    ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                    initDrawingTools(canvas, ctx);
                };
                img.src = drawingData.url;
            }

            // 도면 마킹 도구 초기화
            function initDrawingTools(canvas, ctx) {
                let isDrawing = false;
                let currentTool = 'pen';

                // 도구 버튼 이벤트
                document.querySelectorAll('.drawing-tool-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        document.querySelectorAll('.drawing-tool-btn').forEach(b => b.classList.remove('active'));
                        this.classList.add('active');
                        currentTool = this.dataset.tool;
                        
                        // 캔버스 커서 및 모드 변경
                        if (currentTool === 'pen' || currentTool === 'eraser') {
                            canvas.style.cursor = 'crosshair';
                            canvas.classList.remove('upload-mode');
                        } else if (currentTool === 'clear') {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            canvas.style.cursor = 'pointer';
                            canvas.classList.add('upload-mode');
                        } else {
                            // 기본 상태 (업로드 모드)
                            canvas.style.cursor = 'pointer';
                            canvas.classList.add('upload-mode');
                        }
                    });
                });

                // 초기 상태 설정 (업로드 모드)
                canvas.style.cursor = 'pointer';
                canvas.classList.add('upload-mode');

                // 캔버스 클릭으로 파일 업로드
                canvas.addEventListener('click', function(e) {
                    // 마킹 도구가 활성화된 상태가 아닐 때만 파일 업로드
                    if (currentTool === 'pen' || currentTool === 'eraser') {
                        return; // 마킹 도구 사용 중이면 파일 업로드 하지 않음
                    }
                    
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.display = 'none';
                    
                    input.addEventListener('change', function(e) {
                        const file = e.target.files[0];
                        if (file) {
                            handleDrawingUpload(file);
                        }
                    });
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                });

                // 캔버스 우클릭으로 파일 업로드 (마킹 도구 사용 중에도 가능)
                canvas.addEventListener('contextmenu', function(e) {
                    e.preventDefault(); // 기본 우클릭 메뉴 방지
                    
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.style.display = 'none';
                    
                    input.addEventListener('change', function(e) {
                        const file = e.target.files[0];
                        if (file) {
                            handleDrawingUpload(file);
                        }
                    });
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                });

                // 마우스 이벤트
                canvas.addEventListener('mousedown', function(e) {
                    isDrawing = true;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    if (currentTool === 'pen') {
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.strokeStyle = '#FF0000';
                        ctx.lineWidth = 3;
                    }
                });

                canvas.addEventListener('mousemove', function(e) {
                    if (!isDrawing) return;
                    
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    if (currentTool === 'pen') {
                        ctx.lineTo(x, y);
                        ctx.stroke();
                    } else if (currentTool === 'eraser') {
                        ctx.globalCompositeOperation = 'destination-out';
                        ctx.beginPath();
                        ctx.arc(x, y, 10, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalCompositeOperation = 'source-over';
                    }
                });

                canvas.addEventListener('mouseup', function() {
                    isDrawing = false;
                });
            }

            // 도면 미리보기 닫기
            window.closeDrawingPreview = function() {
                const preview = document.getElementById('drawingPreview');
                if (preview) {
                    preview.remove();
                }
            };

            // 마킹된 도면 저장
            function saveMarkedDrawing() {
                const canvas = document.getElementById('drawingCanvas');
                if (!canvas) {
                    alert('저장할 도면이 없습니다.');
                    return;
                }

                // 캔버스를 이미지로 변환
                const dataURL = canvas.toDataURL('image/png');
                
                // 마킹된 도면을 상태에 저장
                const markedDrawing = {
                    id: 'marked_drawing_' + Date.now(),
                    name: 'marked_drawing.png',
                    url: dataURL,
                    timestamp: new Date().toISOString()
                };

                state.photos.drawing.push(markedDrawing);
                
                // 관리자에게 전송 또는 문서함으로 이동 (시뮬레이션)
                const markedDrawings = JSON.parse(localStorage.getItem('markedDrawings') || '[]');
                markedDrawings.push(markedDrawing);
                localStorage.setItem('markedDrawings', JSON.stringify(markedDrawings));

                alert('마킹된 도면이 저장되었습니다.');
                updateSummary();
                
                // 미리보기 닫기
                closeDrawingPreview();
            }

            console.log('도면 관리 섹션 초기화됨');
        }

        // 도면 관리 섹션 초기화
        initDrawingSection();

        // ========== 빠른메뉴 팝업 기능 ==========
        function initQuickMenuPopup() {
            const popup = document.getElementById('quickMenuPopup');
            const popupContent = popup.querySelector('.popup-content');
            const popupHandle = popup.querySelector('.popup-handle');
            const closeBtn = document.getElementById('closeBtn');
            const dontShowToday = document.getElementById('dontShowToday');

            // 드래그 기능 변수
            let isDragging = false;
            let startY = 0;
            let startHeight = 0;
            let minHeight = 200;
            let maxHeight = window.innerHeight * 0.8;

            // 팝업 표시 함수
            function showPopup() {
                // 오늘 그만보기 체크 확인
                const today = new Date().toDateString();
                const lastHideDate = localStorage.getItem('quickMenuPopupHideDate');
                
                if (lastHideDate === today) {
                    return; // 오늘 이미 숨김 처리됨
                }
                
                popup.style.display = 'flex';
                document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
                
                // 바텀시트 애니메이션
                setTimeout(() => {
                    popupContent.classList.add('show');
                }, 10);
            }

            // 드래그 시작
            function startDrag(e) {
                isDragging = true;
                startY = e.clientY || e.touches[0].clientY;
                startHeight = popupContent.offsetHeight;
                popupContent.classList.add('dragging');
                
                // 텍스트 선택 방지
                document.body.style.userSelect = 'none';
                document.body.style.webkitUserSelect = 'none';
                
                e.preventDefault();
            }

            // 드래그 중
            function drag(e) {
                if (!isDragging) return;
                
                const currentY = e.clientY || e.touches[0].clientY;
                const deltaY = startY - currentY;
                const newHeight = startHeight + deltaY;
                
                // 최소/최대 높이 제한
                const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
                popupContent.style.height = clampedHeight + 'px';
                
                e.preventDefault();
            }

            // 드래그 종료
            function endDrag() {
                if (!isDragging) return;
                
                isDragging = false;
                popupContent.classList.remove('dragging');
                
                // 텍스트 선택 복원
                document.body.style.userSelect = '';
                document.body.style.webkitUserSelect = '';
            }

            // 팝업 핸들 이벤트 리스너 추가
            if (popupHandle) {
                // 마우스 이벤트
                popupHandle.addEventListener('mousedown', startDrag);
                document.addEventListener('mousemove', drag);
                document.addEventListener('mouseup', endDrag);
                
                // 터치 이벤트 (모바일)
                popupHandle.addEventListener('touchstart', startDrag, { passive: false });
                document.addEventListener('touchmove', drag, { passive: false });
                document.addEventListener('touchend', endDrag);
            }

            // 팝업 숨기기 함수
            function hidePopup() {
                popupContent.classList.remove('show');
                
                setTimeout(() => {
                    popup.style.display = 'none';
                    document.body.style.overflow = ''; // 스크롤 복원
                    // 높이 초기화
                    popupContent.style.height = '';
                }, 300);
            }


            // 닫기 버튼
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    hidePopup();
                });
            }

            // 오늘은 그만보기 체크박스
            if (dontShowToday) {
                dontShowToday.addEventListener('change', function() {
                    if (this.checked) {
                        const today = new Date().toDateString();
                        localStorage.setItem('quickMenuPopupHideDate', today);
                    } else {
                        localStorage.removeItem('quickMenuPopupHideDate');
                    }
                });
            }

            // 팝업 외부 클릭 시 닫기
            popup.addEventListener('click', function(e) {
                if (e.target === popup) {
                    hidePopup();
                }
            });

            // ESC 키로 팝업 닫기
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && popup.style.display === 'flex') {
                    hidePopup();
                }
            });

            // 페이지 로드 시 팝업 표시 (1초 후)
            setTimeout(showPopup, 1000);
        }

        // 빠른메뉴 팝업 초기화
        initQuickMenuPopup();

        // 전역 함수: 아이콘 클릭 시 페이지 이동
        window.navigateToPage = function(url, event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            console.log('페이지 이동:', url);
            
            // 팝업 닫기
            const popup = document.getElementById('quickMenuPopup');
            if (popup) {
                popup.style.display = 'none';
                document.body.style.overflow = '';
            }
            
            // 즉시 페이지 이동
            window.location.href = url;
        };

        });
    </script>

    <!-- 빠른메뉴 팝업 -->
    <div id="quickMenuPopup" class="popup-overlay" style="display: none;">
        <div class="popup-content">
            <div class="popup-header">
                <div class="popup-handle"></div>
                <h3 class="popup-title">빠른메뉴</h3>
            </div>
            <div class="popup-body">
                <!-- 빠른메뉴 아이콘 6개를 3개씩 2줄로 표기 -->
                <div class="popup-quick-menu">
                    <div class="popup-quick-row">
                        <a href="worklog.html" class="popup-quick-item" onclick="navigateToPage('worklog.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMzMg/MDAxNzU3MzczOTIzOTg2.eKgzH2aeZVhrEtYCSg-Vjyuok2eudz505Ck18_zeqpsg.r-W69aHdwVPEBS58wMg5LyR7-mDy3WaW_Yyt9I-Ax8kg.PNG/%EC%B6%9C%EB%A0%A5%ED%98%84%ED%99%A9.png?type=w966" width="64" height="64" alt="출력현황" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/calculator.png';">
                            <span>출력현황</span>
                        </a>
                        <a href="task.html" class="popup-quick-item" onclick="navigateToPage('task.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfNDIg/MDAxNzU3MzczOTIzOTE5.uKHob9PU2yFuDqyYrTvUYHunByHEBj0A7pUASU7CEREg.3-0zMZk_TTNxnCDNBVAvSSxeGYcWdeot0GzIWhgD72Ug.PNG/%EC%9E%91%EC%97%85%EC%9D%BC%EC%A7%80.png?type=w966" width="64" height="64" alt="작업일지" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/clipboard-list.png';">
                            <span>작업일지</span>
                        </a>
                        <a href="site.html" class="popup-quick-item" onclick="navigateToPage('site.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTg4/MDAxNzU3MzczOTIzNjQ4.t3FLSpag_6badT7CAFsHXFj2wTbUWJh_3iHKxWR1DEwg.80vrXfmE4WGWg206E9n0XibJFSkfk1RkUr-lDpzyXh4g.PNG/%ED%98%84%EC%9E%A5%EC%A0%95%EB%B3%B4.png?type=w966" width="64" height="64" alt="현장정보" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/map.png';">
                            <span>현장정보</span>
                        </a>
                    </div>
                    <div class="popup-quick-row">
                        <a href="doc.html" class="popup-quick-item" onclick="navigateToPage('doc.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMjc2/MDAxNzU3MzczOTIzNjUx.O1t90awoAKjRWjXhHYAnUEen68ptahXE1NWbYNvjy8Yg.440PWbQoaCp1dpPCgCvnlKU8EASGSAXMHb0zGEKnLHkg.PNG/%EB%AC%B8%EC%84%9C%ED%95%A8.png?type=w966" width="64" height="64" alt="문서함" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/doc.png';">
                            <span>문서함</span>
                        </a>
                        <a href="request.html" class="popup-quick-item" onclick="navigateToPage('request.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfNjEg/MDAxNzU3MzczOTIzODI4.vHsIasE2fPt-A9r28ui5Sw7oGf9JXhxetAh96TdAHgcg.iV39dkzonq61Z_hvu1O1-FLwCNFqM-OCqrNDwN3EuI8g.PNG/%EB%B3%B8%EC%82%AC%EC%9A%94%EC%B2%AD.png?type=w966" width="64" height="64" alt="본사요청" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/request.png';">
                            <span>본사요청</span>
                        </a>
                        <a href="stock.html" class="popup-quick-item" onclick="navigateToPage('stock.html', event)">
                            <img class="qm-icon" src="https://postfiles.pstatic.net/MjAyNTA5MDlfMTAg/MDAxNzU3MzczOTIzODc2.V3ORy11Kszltv6qJ6M3zt4qFtdNopNi1sYcrZALvFD0g.5ZpgJNYRXfyedL0hVpIfo1sxqgBPUAO9SmMjmKf7qZgg.PNG/%EC%9E%AC%EA%B3%A0%EA%B4%80%EB%A6%AC.png?type=w966" width="64" height="64" alt="재고관리" decoding="async" loading="lazy" onerror="this.onerror=null; this.src='./public/images/stock.png';">
                            <span>재고관리</span>
                        </a>
                    </div>
                </div>
                
                <!-- 선택박스와 닫기 버튼 -->
                <div class="popup-footer">
                    <div class="popup-checkbox">
                        <input type="checkbox" id="dontShowToday" class="checkbox-input">
                        <label for="dontShowToday" class="checkbox-label">오늘은 그만보기</label>
                    </div>
                    <button class="popup-close-btn" id="closeBtn">닫기</button>
                </div>
            </div>
        </div>
    </div>`,
        }}
      />
    </main>
  )
}
