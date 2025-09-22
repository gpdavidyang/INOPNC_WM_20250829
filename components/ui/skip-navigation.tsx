'use client'


export function SkipNavigation() {
  const { isLargeFont } = useFontSize()
  
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className={cn(
          'absolute top-4 left-4 z-[100] bg-toss-blue-500 text-white px-4 py-2 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-toss-blue-500 focus:ring-offset-2',
          'transform -translate-y-16 focus:translate-y-0 transition-transform',
          getTypographyClass('body', 'sm', isLargeFont)
        )}
      >
        메인 콘텐츠로 건너뛰기
      </a>
      <a
        href="#main-navigation"
        className={cn(
          'absolute top-4 left-48 z-[100] bg-toss-blue-500 text-white px-4 py-2 rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-toss-blue-500 focus:ring-offset-2',
          'transform -translate-y-16 focus:translate-y-0 transition-transform',
          getTypographyClass('body', 'sm', isLargeFont)
        )}
      >
        메인 메뉴로 건너뛰기
      </a>
    </div>
  )
}

// Helper function to ensure element exists (client-side safe)
export function ensureMainContentId() {
  if (typeof window !== 'undefined') {
    const mainContent = document.querySelector('main')
    if (mainContent && !mainContent.id) {
      mainContent.id = 'main-content'
    }
  }
}