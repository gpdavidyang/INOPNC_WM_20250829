'use client'


export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ReactNode
}

export interface PageHeaderAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  icon?: React.ReactNode
  disabled?: boolean
}

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: PageHeaderAction[]
  showBackButton?: boolean
  backButtonHref?: string
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  showBackButton = false,
  backButtonHref,
  className
}: PageHeaderProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const router = useRouter()

  const touchModeClasses = {
    normal: 'py-4',
    glove: 'py-6',
    precision: 'py-3'
  }

  const handleBackClick = () => {
    if (backButtonHref) {
      router.push(backButtonHref)
    } else {
      router.back()
    }
  }

  return (
    <header 
      className={cn(
        'bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700',
        touchModeClasses[touchMode],
        className
      )}
      role="banner"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav 
            className="flex items-center space-x-1 text-sm mb-2" 
            aria-label="브레드크럼 네비게이션"
          >
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                <div className="flex items-center">
                  {item.icon && (
                    <span className="mr-1 text-gray-400 dark:text-gray-500" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        getFullTypographyClass('body', 'sm', isLargeFont),
                        'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded'
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span 
                      className={cn(
                        getFullTypographyClass('body', 'sm', isLargeFont),
                        index === breadcrumbs.length - 1
                          ? 'text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight 
                    className="h-3 w-3 text-gray-400 dark:text-gray-500" 
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Header content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Back button */}
            {showBackButton && (
              <Button
                variant="ghost"
                size="compact"
                onClick={handleBackClick}
                className="flex-shrink-0 p-1.5"
                aria-label="뒤로 가기"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}

            {/* Title and subtitle */}
            <div className="min-w-0 flex-1">
              <h1 
                className={cn(
                  getFullTypographyClass('heading', '2xl', isLargeFont),
                  'font-bold text-gray-900 dark:text-gray-100 truncate'
                )}
              >
                {title}
              </h1>
              {subtitle && (
                <p 
                  className={cn(
                    getFullTypographyClass('body', 'sm', isLargeFont),
                    'text-gray-500 dark:text-gray-400 mt-1 truncate'
                  )}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions.length > 0 && (
            <div 
              className="flex items-center space-x-2 flex-shrink-0"
              role="group"
              aria-label="페이지 액션"
            >
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'primary'}
                  size="standard"
                  touchMode={touchMode}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex items-center space-x-2"
                >
                  {action.icon && (
                    <span aria-hidden="true">
                      {action.icon}
                    </span>
                  )}
                  <span className="hidden sm:inline">{action.label}</span>
                  <span className="sm:hidden" aria-label={action.label}>
                    {action.icon || action.label.charAt(0)}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Pre-configured page header variants for common use cases
export function DashboardPageHeader({
  title,
  subtitle,
  actions = [],
  ...props
}: Omit<PageHeaderProps, 'breadcrumbs'>) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/dashboard', icon: <Home className="h-3 w-3" /> },
    { label: title }
  ]

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      {...props}
    />
  )
}

export function AdminPageHeader({
  title,
  subtitle,
  actions = [],
  ...props
}: Omit<PageHeaderProps, 'breadcrumbs'>) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/dashboard', icon: <Home className="h-3 w-3" /> },
    { label: '관리자', href: '/dashboard/admin' },
    { label: title }
  ]

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      {...props}
    />
  )
}

export function ReportsPageHeader({
  title,
  subtitle,
  actions = [],
  showBackButton = true,
  ...props
}: Omit<PageHeaderProps, 'breadcrumbs'>) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/dashboard', icon: <Home className="h-3 w-3" /> },
    { label: '작업일지', href: '/dashboard/daily-reports' },
    { label: title }
  ]

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      showBackButton={showBackButton}
      backButtonHref="/dashboard/daily-reports"
      {...props}
    />
  )
}

export function DocumentsPageHeader({
  title,
  subtitle,
  actions = [],
  ...props
}: Omit<PageHeaderProps, 'breadcrumbs'>) {
  const breadcrumbs: BreadcrumbItem[] = [
    { label: '홈', href: '/dashboard', icon: <Home className="h-3 w-3" /> },
    { label: '문서함', href: '/dashboard/documents' },
    { label: title }
  ]

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      actions={actions}
      {...props}
    />
  )
}