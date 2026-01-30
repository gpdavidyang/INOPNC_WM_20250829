/* =========================================
   GLOBAL THEME MANAGER
   전역 다크모드 상태 관리 및 동기화
   ========================================= */

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'inopnc-theme'
const THEME_CLASS = 'dark-mode'

class ThemeManager {
  private currentTheme: Theme = 'light'
  private listeners: Set<(theme: Theme) => void> = new Set()
  private observer: MutationObserver | null = null

  constructor() {
    this.initialize()
  }

  /**
   * 초기화: localStorage에서 테마 로드 및 시스템 설정 확인
   */
  private initialize(): void {
    // 1. localStorage에서 저장된 테마 로드
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null

    // 2. 저장된 테마가 없으면 시스템 설정 확인
    if (savedTheme) {
      this.currentTheme = savedTheme
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.currentTheme = 'dark'
    }

    // 3. 테마 적용
    this.applyTheme(this.currentTheme, false)

    // 4. 시스템 테마 변경 감지
    this.watchSystemTheme()

    // 5. 동적 컨텐츠 감지 (iframe, 동적 로드 컴포넌트)
    this.watchDynamicContent()
  }

  /**
   * 테마 적용
   */
  private applyTheme(theme: Theme, animate: boolean = true): void {
    const body = document.body

    // 애니메이션 방지 (테마 전환 시 깜빡임 방지)
    if (!animate) {
      body.classList.add('theme-transitioning')
    }

    // 테마 클래스 적용
    if (theme === 'dark') {
      body.classList.add(THEME_CLASS)
    } else {
      body.classList.remove(THEME_CLASS)
    }

    // 애니메이션 재활성화
    if (!animate) {
      setTimeout(() => {
        body.classList.remove('theme-transitioning')
      }, 50)
    }

    // 모든 iframe에 테마 전파
    this.propagateToIframes(theme)

    // localStorage에 저장
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    // 리스너 호출
    this.notifyListeners(theme)
  }

  /**
   * 모든 iframe에 테마 전파
   */
  private propagateToIframes(theme: Theme): void {
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach(iframe => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc && iframeDoc.body) {
          if (theme === 'dark') {
            iframeDoc.body.classList.add(THEME_CLASS)
          } else {
            iframeDoc.body.classList.remove(THEME_CLASS)
          }
        }
      } catch (e) {
        // Cross-origin iframe은 접근 불가 (보안상 정상)
        console.debug('Cannot access iframe:', e)
      }
    })
  }

  /**
   * 시스템 테마 변경 감지
   */
  private watchSystemTheme(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

      // 최신 브라우저
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', e => {
          // 사용자가 수동으로 설정하지 않은 경우만 시스템 테마 따름
          const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
          if (!savedTheme) {
            this.setTheme(e.matches ? 'dark' : 'light')
          }
        })
      }
      // 구형 브라우저
      else if (mediaQuery.addListener) {
        mediaQuery.addListener(e => {
          const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
          if (!savedTheme) {
            this.setTheme(e.matches ? 'dark' : 'light')
          }
        })
      }
    }
  }

  /**
   * 동적 컨텐츠 감지 (MutationObserver)
   */
  private watchDynamicContent(): void {
    this.observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          // iframe이 추가되면 테마 전파
          if (node.nodeName === 'IFRAME') {
            setTimeout(() => {
              this.propagateToIframes(this.currentTheme)
            }, 100)
          }

          // 다른 동적 컨텐츠에도 테마 클래스 확인
          if (node instanceof HTMLElement) {
            const iframes = node.querySelectorAll('iframe')
            if (iframes.length > 0) {
              setTimeout(() => {
                this.propagateToIframes(this.currentTheme)
              }, 100)
            }
          }
        })
      })
    })

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * 테마 설정 (Public API)
   */
  public setTheme(theme: Theme): void {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme
      this.applyTheme(theme)
    }
  }

  /**
   * 테마 토글 (Public API)
   */
  public toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
    this.setTheme(newTheme)
  }

  /**
   * 현재 테마 가져오기 (Public API)
   */
  public getTheme(): Theme {
    return this.currentTheme
  }

  /**
   * 테마 변경 리스너 등록 (Public API)
   */
  public subscribe(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener)

    // 즉시 현재 테마 전달
    listener(this.currentTheme)

    // Unsubscribe 함수 반환
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * 리스너 호출
   */
  private notifyListeners(theme: Theme): void {
    this.listeners.forEach(listener => {
      try {
        listener(theme)
      } catch (e) {
        console.error('Theme listener error:', e)
      }
    })
  }

  /**
   * 정리 (Public API)
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.listeners.clear()
  }
}

// 싱글톤 인스턴스 생성
export const themeManager = new ThemeManager()

// 전역 접근을 위한 window 객체에 추가
if (typeof window !== 'undefined') {
  ;(window as any).themeManager = themeManager
}
