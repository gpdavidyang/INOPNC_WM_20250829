/* eslint-disable no-useless-escape */

'use client'
import React from 'react'
import Script from 'next/script'

export default function ResetPasswordPage() {
  return (
    <div>
      {/* Page-specific styles from original */}
      <style>{`
        /* 비밀번호 초기화 페이지 전용 스타일 */
        body {
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        .reset-password-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 16px;
            background: #FFFFFF;
        }

        .reset-password-content {
            width: 100%;
            max-width: 400px;
            padding: 32px 24px;
            box-sizing: border-box;
        }

        .reset-password-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 24px;
            width: 100%;
        }

        .reset-password-logo {
            height: 30px !important;
            width: auto !important;
            object-fit: contain !important;
            max-width: 100% !important;
            display: block !important;
            flex-shrink: 0 !important;
            margin-right: 0 !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: transparent !important;
            position: relative !important;
            z-index: 1 !important;
        }

        .reset-password-title {
            font-size: 20px;
            font-weight: 600;
            color: #1A254F;
            margin: 0;
            line-height: 1.2;
        }

        .form-group {
            margin-bottom: 16px;
        }

        .form-input {
            width: 100%;
            height: 45px;
            padding: 0 16px;
            border: 1px solid #E6ECF4;
            border-radius: 10px;
            background: #FFFFFF;
            color: #1A1A1A;
            font-size: 14px;
            transition: all 0.2s ease;
            padding-right: 45px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--tag-blue);
            box-shadow: 0 0 0 3px var(--tag-blue-20);
        }

        .form-input::placeholder {
            color: #6B7280;
        }

        .input-wrapper {
            position: relative;
        }

        .password-toggle {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 18px;
            height: 18px;
            color: #6B7280;
            cursor: pointer;
            transition: color 0.2s ease;
            background: none;
            border: none;
            padding: 0;
        }

        .password-toggle:hover {
            color: var(--tag-blue);
        }

        .password-toggle svg {
            width: 100%;
            height: 100%;
        }

        .apply-button {
            width: 100%;
            height: 45px;
            padding: 0 16px;
            background: #1A254F;
            color: #FFFFFF;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 20px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .apply-button:hover {
            background: #0F1A3A;
            transform: translateY(-1px);
        }

        .apply-button.loading {
            pointer-events: none;
        }

        .apply-button.loading::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid transparent;
            border-top: 2px solid #FFFFFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        .back-link {
            text-align: center;
            margin-top: 24px;
        }

        .back-link a {
            color: #1A254F;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.2s ease;
        }

        .back-link a:hover {
            color: #0068FE;
            text-decoration: underline;
        }

        /* 반응형 디자인 */
        @media (max-width: 480px) {
            .reset-password-container {
                padding: 12px;
            }
            
            .reset-password-content {
                padding: 24px 16px;
                max-width: 100%;
                width: calc(100% - 24px);
            }
            
            .reset-password-title {
                font-size: 22px;
            }
            
            .reset-password-logo {
                height: 35px;
                width: auto;
                max-width: 100%;
            }
            
            .form-input {
                height: 45px;
                padding: 0 12px;
                padding-right: 40px;
                font-size: 14px;
                box-sizing: border-box;
            }
            
            .apply-button {
                height: 45px;
                font-size: 14px;
            }
        }

        @media (max-width: 360px) {
            .reset-password-container {
                padding: 8px;
            }
            
            .reset-password-content {
                padding: 20px 12px;
                width: calc(100% - 16px);
            }
            
            .reset-password-title {
                font-size: 20px;
            }
            
            .reset-password-logo {
                height: 35px;
                width: auto;
                max-width: 100%;
            }
            
            .form-input {
                height: 45px;
                padding: 0 10px;
                padding-right: 35px;
                font-size: 14px;
            }
            
            .apply-button {
                height: 45px;
                font-size: 14px;
            }
        }

        /* 접근성 */
        @media (prefers-reduced-motion: reduce) {
            .apply-button,
            .form-input {
                transition: none;
            }
            
            .apply-button:hover {
                transform: none;
            }
        }

        /* 포커스 표시 */
        .form-input:focus-visible,
        .apply-button:focus-visible {
            outline: 2px solid var(--tag-blue);
            outline-offset: 2px;
        }
      `}</style>
      {/* Original body markup injected 1:1 */}
      <div
        dangerouslySetInnerHTML={{
          __html: `<div class="reset-password-container">
        <div class="reset-password-content">
            <div class="reset-password-header">
            <img src="images/logo_main.png" 
                 alt="INOPNC 로고" 
                 class="reset-password-logo"
                 style="height: 35px; width: auto; object-fit: contain; display: block !important;"
                 onload="console.log('비밀번호 초기화 로고 이미지 로드 성공'); this.style.display='block';"
                 onerror="console.log('비밀번호 초기화 로고 이미지 로드 실패'); this.style.display='none';"
                 loading="eager">
                <h1 class="reset-password-title">비밀번호 초기화</h1>
            </div>

            <form id="resetPasswordForm" class="reset-password-form">
                <div class="form-group">
                    <div class="input-wrapper">
                        <input 
                            type="password" 
                            id="newPassword" 
                            class="form-input" 
                            placeholder="새 비밀번호"
                            value="........"
                            required
                            autocomplete="new-password"
                        >
                        <button type="button" class="password-toggle" onclick="togglePassword('newPassword')" aria-label="비밀번호 표시/숨기기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <div class="input-wrapper">
                        <input 
                            type="password" 
                            id="confirmPassword" 
                            class="form-input" 
                            placeholder="비밀번호 확인"
                            value="........"
                            required
                            autocomplete="new-password"
                        >
                        <button type="button" class="password-toggle" onclick="togglePassword('confirmPassword')" aria-label="비밀번호 표시/숨기기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <button type="submit" class="apply-button" id="applyButton">
                    제출
                </button>
            </form>

            <div class="back-link">
                <a href="login.html">로그인으로 돌아가기</a>
            </div>
        </div>
    </div>

    <script>
        // 이미지 로딩 확인 및 디버깅
        function checkImageLoad() {
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                console.log('로고 요소 찾음:', logo);
                console.log('이미지 src:', logo.src);
                console.log('이미지 완료 상태:', logo.complete);
                console.log('이미지 자연 크기:', logo.naturalWidth, 'x', logo.naturalHeight);
                
                if (logo.complete && logo.naturalHeight !== 0) {
                    console.log('이미지가 이미 로드됨');
                    logo.style.display = 'block';
                } else {
                    console.log('이미지 로딩 중...');
                    // 이미지 재로딩 시도
                    setTimeout(() => {
                        if (!logo.complete || logo.naturalHeight === 0) {
                            console.log('이미지 재로딩 시도');
                            const originalSrc = logo.src.split('&t=')[0];
                            logo.src = originalSrc + '&t=' + Date.now();
                        }
                    }, 2000);
                }
            } else {
                console.log('로고 요소를 찾을 수 없음');
            }
        }

        // 이미지 재로딩 함수
        function reloadImage() {
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                const baseUrl = 'images/logo_n.png';
                logo.src = baseUrl + '?t=' + Date.now();
                console.log('강제 이미지 재로딩:', logo.src);
            }
        }

        // 페이지 로드 후 이미지 상태 확인
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(checkImageLoad, 1000);
            
            // 이미지 로딩 실패 시 재시도
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                logo.addEventListener('error', function() {
                    console.log('이미지 로딩 실패, 재시도 중...');
                    setTimeout(reloadImage, 1000);
                });
                
                // 이미지 로딩 성공 시 확인
                logo.addEventListener('load', function() {
                    console.log('이미지 로딩 성공 확인됨');
                    this.style.display = 'block';
                });
                
                // 강제 이미지 로딩 시도
                if (!logo.complete) {
                    console.log('이미지 강제 로딩 시도');
                    logo.src = logo.src;
                }
            }
        });

        // 비밀번호 표시/숨기기
        function togglePassword(inputId) {
            const passwordInput = document.getElementById(inputId);
            const passwordToggle = passwordInput.parentElement.querySelector('.password-toggle svg');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordInput.value = '12345678'; // 실제 비밀번호 표시
                passwordToggle.innerHTML = \`
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                \`;
            } else {
                passwordInput.type = 'password';
                passwordInput.value = '........'; // 점으로 표시
                passwordToggle.innerHTML = \`
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                \`;
            }
        }

        // 비밀번호 초기화 폼 처리
        document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const applyButton = document.getElementById('applyButton');
            
            // 로딩 상태 표시
            applyButton.classList.add('loading');
            applyButton.textContent = '반영중';
            applyButton.disabled = true;
            
            // 실제 비밀번호 초기화 로직 (여기서는 시뮬레이션)
            setTimeout(() => {
                // 비밀번호 일치 확인
                if (newPassword && confirmPassword) {
                    if (newPassword === confirmPassword) {
                        // 회원가입 정보 가져오기
                        const userInfo = getUserInfo();
                        
                        // 비밀번호 초기화 메일 발송
                        sendPasswordResetEmail(userInfo, newPassword);
                        
                        // 비밀번호 초기화 성공 알림
                        showNotification('비밀번호가 성공적으로 초기화되었습니다. 관리자에게 알림이 발송되었습니다.', 'success');
                        
                        // 로그인 페이지로 이동
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 3000);
                    } else {
                        showNotification('비밀번호가 일치하지 않습니다.', 'error');
                        applyButton.classList.remove('loading');
                        applyButton.textContent = '반영중';
                        applyButton.disabled = false;
                    }
                } else {
                    showNotification('새 비밀번호와 비밀번호 확인을 입력해주세요.', 'error');
                    applyButton.classList.remove('loading');
                    applyButton.textContent = '반영중';
                    applyButton.disabled = false;
                }
            }, 2000);
        });

        // 회원가입 정보 가져오기
        function getUserInfo() {
            // 로컬 스토리지에서 회원가입 정보 가져오기
            const userInfo = {
                name: localStorage.getItem('userName') || '정보 없음',
                company: localStorage.getItem('userCompany') || '정보 없음',
                position: localStorage.getItem('userPosition') || '정보 없음',
                phone: localStorage.getItem('userPhone') || '정보 없음',
                email: localStorage.getItem('userEmail') || '정보 없음',
                resetTime: new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            };
            return userInfo;
        }

        // 비밀번호 초기화 메일 발송
        function sendPasswordResetEmail(userInfo, newPassword) {
            const emailData = {
                to: 'khy972@inopnc.com',
                subject: '[INOPNC] 비밀번호 초기화 알림',
                body: \`
비밀번호 초기화가 완료되었습니다.

=== 회원 정보 ===
이름: ${userInfo.name}
소속(회사명): ${userInfo.company}
직함: ${userInfo.position}
핸드폰 번호: ${userInfo.phone}
이메일 주소: ${userInfo.email}

=== 비밀번호 초기화 정보 ===
초기화 시간: ${userInfo.resetTime}
새 비밀번호: ${newPassword}

이 알림은 시스템에서 자동으로 발송되었습니다.
                \`.trim()
            };

            // 실제 구현에서는 서버 API를 통해 메일 발송
            // 여기서는 시뮬레이션으로 로컬 스토리지에 저장
            const emailLog = JSON.parse(localStorage.getItem('emailLog') || '[]');
            emailLog.push({
                ...emailData,
                timestamp: new Date().toISOString(),
                status: 'sent'
            });
            localStorage.setItem('emailLog', JSON.stringify(emailLog));

            // 콘솔에 메일 내용 출력 (개발용)
            console.log('=== 비밀번호 초기화 메일 발송 ===');
            console.log('수신자:', emailData.to);
            console.log('제목:', emailData.subject);
            console.log('내용:', emailData.body);
            console.log('발송 시간:', new Date().toLocaleString('ko-KR'));
        }

        // 알림 표시
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification notification-${type}\`;
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--card);
                color: var(--ink);
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid var(--line);
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
                max-width: 90vw;
                text-align: center;
                font-size: 14px;
            \`;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // 3초 후 자동 제거
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // 애니메이션 CSS 추가
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        \`;
        document.head.appendChild(style);

        // 키보드 접근성
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
                const form = document.getElementById('resetPasswordForm');
                const inputs = Array.from(form.querySelectorAll('.form-input'));
                const currentIndex = inputs.indexOf(e.target);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    </script>`,
        }}
      />
      {/* Original scripts executed via next/script */}
      <Script
        id="reset-password-inline-0"
        strategy="afterInteractive"
      >{`// 이미지 로딩 확인 및 디버깅
        function checkImageLoad() {
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                console.log('로고 요소 찾음:', logo);
                console.log('이미지 src:', logo.src);
                console.log('이미지 완료 상태:', logo.complete);
                console.log('이미지 자연 크기:', logo.naturalWidth, 'x', logo.naturalHeight);
                
                if (logo.complete && logo.naturalHeight !== 0) {
                    console.log('이미지가 이미 로드됨');
                    logo.style.display = 'block';
                } else {
                    console.log('이미지 로딩 중...');
                    // 이미지 재로딩 시도
                    setTimeout(() => {
                        if (!logo.complete || logo.naturalHeight === 0) {
                            console.log('이미지 재로딩 시도');
                            const originalSrc = logo.src.split('&t=')[0];
                            logo.src = originalSrc + '&t=' + Date.now();
                        }
                    }, 2000);
                }
            } else {
                console.log('로고 요소를 찾을 수 없음');
            }
        }

        // 이미지 재로딩 함수
        function reloadImage() {
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                const baseUrl = 'images/logo_n.png';
                logo.src = baseUrl + '?t=' + Date.now();
                console.log('강제 이미지 재로딩:', logo.src);
            }
        }

        // 페이지 로드 후 이미지 상태 확인
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(checkImageLoad, 1000);
            
            // 이미지 로딩 실패 시 재시도
            const logo = document.querySelector('.reset-password-logo');
            if (logo) {
                logo.addEventListener('error', function() {
                    console.log('이미지 로딩 실패, 재시도 중...');
                    setTimeout(reloadImage, 1000);
                });
                
                // 이미지 로딩 성공 시 확인
                logo.addEventListener('load', function() {
                    console.log('이미지 로딩 성공 확인됨');
                    this.style.display = 'block';
                });
                
                // 강제 이미지 로딩 시도
                if (!logo.complete) {
                    console.log('이미지 강제 로딩 시도');
                    logo.src = logo.src;
                }
            }
        });

        // 비밀번호 표시/숨기기
        function togglePassword(inputId) {
            const passwordInput = document.getElementById(inputId);
            const passwordToggle = passwordInput.parentElement.querySelector('.password-toggle svg');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordInput.value = '12345678'; // 실제 비밀번호 표시
                passwordToggle.innerHTML = \`
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                \`;
            } else {
                passwordInput.type = 'password';
                passwordInput.value = '........'; // 점으로 표시
                passwordToggle.innerHTML = \`
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                \`;
            }
        }

        // 비밀번호 초기화 폼 처리
        document.getElementById('resetPasswordForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const applyButton = document.getElementById('applyButton');
            
            // 로딩 상태 표시
            applyButton.classList.add('loading');
            applyButton.textContent = '반영중';
            applyButton.disabled = true;
            
            // 실제 비밀번호 초기화 로직 (여기서는 시뮬레이션)
            setTimeout(() => {
                // 비밀번호 일치 확인
                if (newPassword && confirmPassword) {
                    if (newPassword === confirmPassword) {
                        // 회원가입 정보 가져오기
                        const userInfo = getUserInfo();
                        
                        // 비밀번호 초기화 메일 발송
                        sendPasswordResetEmail(userInfo, newPassword);
                        
                        // 비밀번호 초기화 성공 알림
                        showNotification('비밀번호가 성공적으로 초기화되었습니다. 관리자에게 알림이 발송되었습니다.', 'success');
                        
                        // 로그인 페이지로 이동
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 3000);
                    } else {
                        showNotification('비밀번호가 일치하지 않습니다.', 'error');
                        applyButton.classList.remove('loading');
                        applyButton.textContent = '반영중';
                        applyButton.disabled = false;
                    }
                } else {
                    showNotification('새 비밀번호와 비밀번호 확인을 입력해주세요.', 'error');
                    applyButton.classList.remove('loading');
                    applyButton.textContent = '반영중';
                    applyButton.disabled = false;
                }
            }, 2000);
        });

        // 회원가입 정보 가져오기
        function getUserInfo() {
            // 로컬 스토리지에서 회원가입 정보 가져오기
            const userInfo = {
                name: localStorage.getItem('userName') || '정보 없음',
                company: localStorage.getItem('userCompany') || '정보 없음',
                position: localStorage.getItem('userPosition') || '정보 없음',
                phone: localStorage.getItem('userPhone') || '정보 없음',
                email: localStorage.getItem('userEmail') || '정보 없음',
                resetTime: new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })
            };
            return userInfo;
        }

        // 비밀번호 초기화 메일 발송
        function sendPasswordResetEmail(userInfo, newPassword) {
            const emailData = {
                to: 'khy972@inopnc.com',
                subject: '[INOPNC] 비밀번호 초기화 알림',
                body: \`
비밀번호 초기화가 완료되었습니다.

=== 회원 정보 ===
이름: ${userInfo.name}
소속(회사명): ${userInfo.company}
직함: ${userInfo.position}
핸드폰 번호: ${userInfo.phone}
이메일 주소: ${userInfo.email}

=== 비밀번호 초기화 정보 ===
초기화 시간: ${userInfo.resetTime}
새 비밀번호: ${newPassword}

이 알림은 시스템에서 자동으로 발송되었습니다.
                \`.trim()
            };

            // 실제 구현에서는 서버 API를 통해 메일 발송
            // 여기서는 시뮬레이션으로 로컬 스토리지에 저장
            const emailLog = JSON.parse(localStorage.getItem('emailLog') || '[]');
            emailLog.push({
                ...emailData,
                timestamp: new Date().toISOString(),
                status: 'sent'
            });
            localStorage.setItem('emailLog', JSON.stringify(emailLog));

            // 콘솔에 메일 내용 출력 (개발용)
            console.log('=== 비밀번호 초기화 메일 발송 ===');
            console.log('수신자:', emailData.to);
            console.log('제목:', emailData.subject);
            console.log('내용:', emailData.body);
            console.log('발송 시간:', new Date().toLocaleString('ko-KR'));
        }

        // 알림 표시
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = \`notification notification-${type}\`;
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--card);
                color: var(--ink);
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                border: 1px solid var(--line);
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
                max-width: 90vw;
                text-align: center;
                font-size: 14px;
            \`;
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // 3초 후 자동 제거
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.3s ease-out';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // 애니메이션 CSS 추가
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes slideDown {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes slideUp {
                from {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-50%) translateY(-20px);
                }
            }
        \`;
        document.head.appendChild(style);

        // 키보드 접근성
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
                const form = document.getElementById('resetPasswordForm');
                const inputs = Array.from(form.querySelectorAll('.form-input'));
                const currentIndex = inputs.indexOf(e.target);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });`}</Script>
    </div>
  )
}
