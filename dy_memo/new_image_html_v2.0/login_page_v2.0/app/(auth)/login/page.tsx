'use client'
import React from 'react'
import Script from 'next/script'

export default function LoginPage() {
  return (
    <div>
      {/* Page-specific styles from original */}
      <style>
        /* 로그인 페이지 전용 스타일 */
        body {
            margin: 0;
            padding: 0;
            background: #FFFFFF;
            font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        .login-container {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 16px;
            background: #FFFFFF;
        }

        .login-content {
            width: 100%;
            max-width: 400px;
            padding: 32px 24px;
            box-sizing: border-box;
        }

        .login-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 24px;
        }

        .login-logo {
            height: 30px;
            width: auto;
            object-fit: contain;
        }

        .login-title {
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

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 20px 0;
        }

        .checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--tag-blue);
            cursor: pointer;
        }

        .checkbox label {
            font-size: 14px;
            color: #1A1A1A;
            cursor: pointer;
        }

        .forgot-password {
            font-size: 14px;
            color: #6B7280;
            text-decoration: none;
            transition: color 0.2s ease;
        }

        .forgot-password:hover {
            color: var(--tag-blue);
        }

        .login-button {
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
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .login-button:hover {
            background: #0F1A3A;
            transform: translateY(-1px);
        }

        [data-theme="dark"] .login-button {
            background: var(--brand);
            color: #FFFFFF;
        }

        [data-theme="dark"] .login-button:hover {
            background: #0F1A3A;
        }

        .signup-link {
            text-align: center;
            font-size: 14px;
            color: #6B7280;
        }

        .signup-link a {
            color: #1A254F;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
        }

        .signup-link a:hover {
            color: #0068FE;
            text-decoration: underline;
        }


        /* 반응형 디자인 */
        @media (max-width: 480px) {
            .login-container {
                padding: 12px;
            }
            
            .login-content {
                padding: 20px 16px;
                max-width: 100%;
                width: calc(100% - 24px);
            }
            
            .login-header {
                gap: 6px;
                margin-bottom: 20px;
            }
            
            .login-title {
                font-size: 18px;
            }
            
            .login-logo {
                height: 28px;
                width: auto;
            }
            
            .form-group {
                margin-bottom: 14px;
            }
            
            .form-input {
                height: 45px;
                padding: 0 12px;
                padding-right: 40px;
                font-size: 14px;
                box-sizing: border-box;
            }
            
            .password-toggle {
                right: 10px;
                width: 16px;
                height: 16px;
            }
            
            .form-options {
                margin: 16px 0;
            }
            
            .login-button {
                height: 45px;
                font-size: 14px;
                margin-bottom: 16px;
            }
        }

        @media (max-width: 360px) {
            .login-container {
                padding: 8px;
            }
            
            .login-content {
                padding: 16px 12px;
                width: calc(100% - 16px);
            }
            
            .login-header {
                gap: 4px;
                margin-bottom: 16px;
            }
            
            .login-title {
                font-size: 16px;
            }
            
            .login-logo {
                height: 24px;
                width: auto;
            }
            
            .form-group {
                margin-bottom: 12px;
            }
            
            .form-input {
                height: 45px;
                padding: 0 10px;
                padding-right: 35px;
                font-size: 14px;
                box-sizing: border-box;
            }
            
            .password-toggle {
                right: 8px;
                width: 14px;
                height: 14px;
            }
            
            .form-options {
                margin: 14px 0;
            }
            
            .login-button {
                height: 45px;
                font-size: 14px;
                margin-bottom: 14px;
            }
        }

        /* 접근성 */
        @media (prefers-reduced-motion: reduce) {
            .login-button,
            .form-input,
            .login-content {
                transition: none;
            }
            
            .login-button:hover {
                transform: none;
            }
        }

        /* 포커스 표시 */
        .form-input:focus-visible,
        .login-button:focus-visible,
        .checkbox:focus-visible {
            outline: 2px solid var(--tag-blue);
            outline-offset: 2px;
        }
    </style>
      {/* Original body markup injected 1:1 */}
      <div dangerouslySetInnerHTML={{__html: `<div class="login-container">
        <div class="login-content">
            <div class="login-header">
                <img src="images/logo_main.png" 
                     alt="INOPNC 로고" 
                     class="login-logo">
                <h1 class="login-title">로그인</h1>
            </div>

            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <div class="input-wrapper">
                        <input 
                            type="email" 
                            id="email" 
                            class="form-input" 
                            placeholder="이메일을 입력하세요"
                            value="1234@1234.com"
                            required
                            autocomplete="email"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <div class="input-wrapper">
                        <input 
                            type="password" 
                            id="password" 
                            class="form-input" 
                            placeholder="비밀번호를 입력하세요"
                            value="........"
                            required
                            autocomplete="current-password"
                        >
                        <button type="button" class="password-toggle" onclick="togglePassword()" aria-label="비밀번호 표시/숨기기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-options">
                    <div class="checkbox">
                        <input type="checkbox" id="rememberMe" name="rememberMe" checked>
                        <label for="rememberMe">자동로그인</label>
                    </div>
                    <a href="reset-password.html" class="forgot-password">비밀번호를 잊어버렸나요?</a>
                </div>

                <button type="submit" class="login-button" id="loginButton">
                    로그인
                </button>
            </form>

            <div class="signup-link">
                계정이 없으신가요? <a href="signup.html">회원가입</a>
            </div>
        </div>
    </div>

    <script>

        // 비밀번호 표시/숨기기
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const passwordToggle = document.querySelector('.password-toggle svg');
            
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

        // 로그인 폼 처리
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const loginButton = document.getElementById('loginButton');
            
            // 로딩 상태 표시
            loginButton.textContent = '로그인 중...';
            loginButton.disabled = true;
            
            // 실제 로그인 로직 (여기서는 시뮬레이션)
            setTimeout(() => {
                // 로그인 성공 시뮬레이션
                if (email && password) {
                    // 자동로그인 설정
                    if (rememberMe) {
                        localStorage.setItem('autoLogin', 'true');
                        localStorage.setItem('userEmail', email);
                        localStorage.setItem('userPassword', password);
                    } else {
                        localStorage.removeItem('autoLogin');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userPassword');
                    }
                    
                    // 로그인 성공 알림
                    showNotification('로그인에 성공했습니다!', 'success');
                    
                    // 메인 페이지로 이동 (실제 구현에서는 적절한 리다이렉트)
                    setTimeout(() => {
                        window.location.href = 'main.html';
                    }, 1500);
                } else {
                    showNotification('이메일과 비밀번호를 입력해주세요.', 'error');
                    loginButton.textContent = '로그인';
                    loginButton.disabled = false;
                }
            }, 2000);
        });

        // JavaScript 함수들은 더 이상 필요하지 않음 (직접 링크 사용)

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

        // 페이지 로드 시 자동로그인 체크
        document.addEventListener('DOMContentLoaded', function() {
            // 자동로그인 체크
            const autoLogin = localStorage.getItem('autoLogin');
            const savedEmail = localStorage.getItem('userEmail');
            const savedPassword = localStorage.getItem('userPassword');
            
            if (autoLogin === 'true' && savedEmail && savedPassword) {
                document.getElementById('email').value = savedEmail;
                document.getElementById('password').value = savedPassword;
                document.getElementById('rememberMe').checked = true;
                
                // 자동로그인 실행
                setTimeout(() => {
                    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
                }, 1000);
            } else if (autoLogin === 'true' && savedEmail) {
                document.getElementById('email').value = savedEmail;
                document.getElementById('rememberMe').checked = true;
            }
        });

        // 키보드 접근성
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
                const form = document.getElementById('loginForm');
                const inputs = Array.from(form.querySelectorAll('.form-input'));
                const currentIndex = inputs.indexOf(e.target);
                
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    </script>`}} />
      {/* Original scripts executed via next/script */}
      <Script id="login-inline-0" strategy="afterInteractive">{`// 비밀번호 표시/숨기기
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const passwordToggle = document.querySelector('.password-toggle svg');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordInput.value = '12345678'; // 실제 비밀번호 표시
                passwordToggle.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                `;
            } else {
                passwordInput.type = 'password';
                passwordInput.value = '........'; // 점으로 표시
                passwordToggle.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                `;
            }
        }

        // 로그인 폼 처리
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            const loginButton = document.getElementById('loginButton');
            
            // 로딩 상태 표시
            loginButton.textContent = '로그인 중...';
            loginButton.disabled = true;
            
            // 실제 로그인 로직 (여기서는 시뮬레이션)
            setTimeout(() => {
                // 로그인 성공 시뮬레이션
                if (email && password) {
                    // 자동로그인 설정
                    if (rememberMe) {
                        localStorage.setItem('autoLogin', 'true');
                        localStorage.setItem('userEmail', email);
                        localStorage.setItem('userPassword', password);
                    } else {
                        localStorage.removeItem('autoLogin');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('userPassword');
                    }
                    
                    // 로그인 성공 알림
                    showNotification('로그인에 성공했습니다!', 'success');
                    
                    // 메인 페이지로 이동 (실제 구현에서는 적절한 리다이렉트)
                    setTimeout(() => {
                        window.location.href = 'main.html';
                    }, 1500);
                } else {
                    showNotification('이메일과 비밀번호를 입력해주세요.', 'error');
                    loginButton.textContent = '로그인';
                    loginButton.disabled = false;
                }
            }, 2000);
        });

        // JavaScript 함수들은 더 이상 필요하지 않음 (직접 링크 사용)

        // 알림 표시
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
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
            `;
            
            
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
        style.textContent = `
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
        `;
        document.head.appendChild(style);

        // 페이지 로드 시 자동로그인 체크
        document.addEventListener('DOMContentLoaded', function() {
            // 자동로그인 체크
            const autoLogin = localStorage.getItem('autoLogin');
            const savedEmail = localStorage.getItem('userEmail');
            const savedPassword = localStorage.getItem('userPassword');
            
            if (autoLogin === 'true' && savedEmail && savedPassword) {
                document.getElementById('email').value = savedEmail;
                document.getElementById('password').value = savedPassword;
                document.getElementById('rememberMe').checked = true;
                
                // 자동로그인 실행
                setTimeout(() => {
                    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
                }, 1000);
            } else if (autoLogin === 'true' && savedEmail) {
                document.getElementById('email').value = savedEmail;
                document.getElementById('rememberMe').checked = true;
            }
        });

        // 키보드 접근성
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
                const form = document.getElementById('loginForm');
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
