/* eslint-disable no-useless-escape */

'use client'

import type { Metadata } from 'next'
import React, { useEffect } from 'react'

export const metadata: Metadata = {
  title: '홈 - INOPNC',
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
    <main id="home-page" className="min-h-screen w-full">
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
            <div class="content-area">
                <!-- BASE 페이지 컨텐츠 영역 -->
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

        <!-- 하단 네비게이터 -->
        <nav class="bottom-nav-wrap">
            <div class="bottom-nav">
                <ul class="nav-list">
                    <li class="nav-item">
                        <a class="nav-link" data-route="home" href="home.html">
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
                        <li><a class="menu-item" href="home.html"><span class="menu-label">홈</span></a></li>
                        <li><a class="menu-item" href="worklog.html"><span class="menu-label">출력현황</span></a></li>
                        <li><a class="menu-item" href="task.html"><span class="menu-label">작업일지</span></a></li>
                        <li><a class="menu-item" href="site.html"><span class="menu-label">현장정보</span></a></li>
                        <li><a class="menu-item" href="doc.html"><span class="menu-label">문서함</span></a></li>
                        <li class="menu-item-with-btn">
                            <a class="menu-item" href="home.html"><span class="menu-label">내정보</span></a>
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
    </div>

    <script>
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
            
            // Lucide 아이콘 초기화
            lucide.createIcons();


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


                // ESC 키 이벤트는 통합 이벤트 리스너에서 처리
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

            // ESC 키 이벤트는 통합 이벤트 리스너에서 처리

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
            
            // ESC 키 이벤트는 통합 이벤트 리스너에서 처리
            
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
                    let container = document.querySelector('.content-area');
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

                // 다크모드 버튼 기능
                const darkModeBtn = document.getElementById('darkModeBtn');
                const darkModeIcon = document.getElementById('darkModeIcon');
                let isDarkMode = false;

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

            // 메뉴 버튼은 햄버거 드로어 기능에서 처리됨

            // 하단 네비게이션 기능
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

            // INOPNC 브랜드 타이틀 클릭 시 메인 페이지로 이동
            const brandTitle = document.getElementById('brandTitle');
            if (brandTitle) {
                brandTitle.addEventListener('click', function() {
                    window.location.href = 'main.html';
                });
            }
        });
    </script>`,
        }}
      />
    </main>
  )
}
