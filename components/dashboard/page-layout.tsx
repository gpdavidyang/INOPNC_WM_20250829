
interface PageLayoutProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function PageLayout({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName
}: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Page Header */}
      <div className={cn(
        "sticky top-0 z-20 border-b border-gray-200 bg-white px-4 sm:px-6 py-4 sm:py-6",
        headerClassName
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold leading-7 text-gray-900 sm:truncate">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-600 max-w-2xl">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="flex-shrink-0">
              {action}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className={cn("flex-1", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

interface PageSectionProps {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  headerClassName?: string
  contentClassName?: string
}

export function PageSection({
  title,
  description,
  action,
  children,
  className,
  headerClassName,
  contentClassName
}: PageSectionProps) {
  return (
    <div className={cn("bg-white shadow rounded-lg", className)}>
      {(title || description || action) && (
        <div className={cn(
          "px-4 sm:px-6 py-4 border-b border-gray-200",
          headerClassName
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {(title || description) && (
              <div className="min-w-0 flex-1">
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {description}
                  </p>
                )}
              </div>
            )}
            {action && (
              <div className="flex-shrink-0">
                {action}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={cn("p-4 sm:p-6", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

interface PageContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = '7xl',
  padding = 'md'
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-3 py-3',
    md: 'px-4 sm:px-6 py-4 sm:py-6',
    lg: 'px-6 sm:px-8 py-6 sm:py-8'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-4",
      className
    )}>
      {icon && (
        <div className="mx-auto w-12 h-12 text-gray-300 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}

interface LoadingStateProps {
  title?: string
  description?: string
  className?: string
}

export function LoadingState({
  title = "로딩 중...",
  description = "데이터를 불러오고 있습니다.",
  className
}: LoadingStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-4",
      className
    )}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = "오류가 발생했습니다",
  description = "페이지를 불러오는 중 문제가 발생했습니다.",
  action,
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      "text-center py-12 px-4",
      className
    )}>
      <div className="mx-auto w-12 h-12 text-red-300 mb-4">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  )
}