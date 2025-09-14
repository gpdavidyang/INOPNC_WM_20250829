/**
 * 내비게이션 컴포넌트 Props 타입 정의
 */


// Navigation Item
export interface NavItem {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  badge?: string | number
  disabled?: boolean
  children?: NavItem[]
  onClick?: () => void
}

// Navbar Props
export interface NavbarProps extends BaseComponentProps {
  logo?: ReactNode
  title?: string
  items?: NavItem[]
  actions?: ReactNode
  sticky?: boolean
  transparent?: boolean
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  variant?: 'light' | 'dark'
}

// Sidebar Navigation Props
export interface SideNavProps extends BaseComponentProps {
  items: NavItem[]
  activeItem?: string
  onItemClick?: (item: NavItem) => void
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
  header?: ReactNode
  footer?: ReactNode
  variant?: 'light' | 'dark'
}

// Breadcrumb Props
export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: ReactNode
  onClick?: () => void
}

export interface BreadcrumbProps extends BaseComponentProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
  maxItems?: number
  showHome?: boolean
  homeIcon?: ReactNode
}

// Tabs Navigation Props
export interface TabNavProps extends BaseComponentProps {
  tabs: Array<{
    id: string
    label: string
    href?: string
    icon?: ReactNode
    badge?: string | number
    disabled?: boolean
  }>
  activeTab?: string
  onChange?: (tabId: string) => void
  variant?: 'line' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

// Steps/Stepper Props
export interface StepItem {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  status?: 'pending' | 'active' | 'completed' | 'error'
  disabled?: boolean
}

export interface StepperProps extends BaseComponentProps {
  steps: StepItem[]
  current?: number
  onChange?: (step: number) => void
  orientation?: 'horizontal' | 'vertical'
  labelPlacement?: 'horizontal' | 'vertical'
  showNumber?: boolean
  clickable?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Menu Props
export interface MenuItem {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  children?: MenuItem[]
  onClick?: () => void
}

export interface MenuProps extends BaseComponentProps {
  items: MenuItem[]
  trigger?: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  closeOnSelect?: boolean
}

// Pagination Navigation Props
export interface PaginationNavProps extends BaseComponentProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirst?: boolean
  showLast?: boolean
  showPrevNext?: boolean
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'rounded' | 'minimal'
}

// Bottom Navigation Props (Mobile)
export interface BottomNavProps extends BaseComponentProps {
  items: Array<{
    id: string
    label?: string
    icon: ReactNode
    href?: string
    badge?: string | number
    onClick?: () => void
  }>
  activeItem?: string
  onChange?: (itemId: string) => void
  showLabel?: boolean | 'active'
  fixed?: boolean
}