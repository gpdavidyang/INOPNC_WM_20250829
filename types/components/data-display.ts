/**
 * 데이터 디스플레이 컴포넌트 Props 타입 정의
 */


// Table Column Definition
export interface TableColumn<T = Record<string, unknown>> {
  key: string
  title: string
  dataIndex?: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: unknown, record: T, index: number) => ReactNode
  className?: string
}

// Table Props
export interface TableProps<T = Record<string, unknown>> extends BaseComponentProps {
  columns: TableColumn<T>[]
  data: T[]
  rowKey?: string | ((record: T) => string)
  loading?: boolean
  empty?: ReactNode
  selectable?: boolean
  selectedRows?: string[]
  onSelectChange?: (selectedRows: string[]) => void
  sortable?: boolean
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  pagination?: PaginationProps
  sticky?: boolean
  striped?: boolean
  hoverable?: boolean
  bordered?: boolean
  size?: 'sm' | 'md' | 'lg'
  onRowClick?: (record: T, index: number) => void
}

// Pagination Props
export interface PaginationProps extends BaseComponentProps {
  current: number
  total: number
  pageSize: number
  pageSizeOptions?: number[]
  showSizeChanger?: boolean
  showTotal?: boolean
  showJumper?: boolean
  onChange?: (page: number, pageSize: number) => void
  onPageSizeChange?: (pageSize: number) => void
  size?: 'sm' | 'md' | 'lg'
}

// List Props
export interface ListProps<T = Record<string, unknown>> extends BaseComponentProps {
  data: T[]
  renderItem: (item: T, index: number) => ReactNode
  loading?: boolean
  empty?: ReactNode
  header?: ReactNode
  footer?: ReactNode
  bordered?: boolean
  split?: boolean
  size?: 'sm' | 'md' | 'lg'
  grid?: {
    gutter?: number
    column?: number
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

// Description List Props
export interface DescriptionListProps extends BaseComponentProps {
  title?: string
  items: Array<{
    label: string
    value: ReactNode
    span?: number
  }>
  column?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
  bordered?: boolean
  colon?: boolean
  layout?: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
}

// Stats Card Props
export interface StatsCardProps extends BaseComponentProps {
  title: string
  value: string | number
  prefix?: ReactNode
  suffix?: ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  icon?: ReactNode
  color?: string
  loading?: boolean
  footer?: ReactNode
}

// Timeline Props
export interface TimelineItemProps {
  title: string
  description?: string
  time?: string
  icon?: ReactNode
  color?: string
  active?: boolean
}

export interface TimelineProps extends BaseComponentProps {
  items: TimelineItemProps[]
  orientation?: 'vertical' | 'horizontal'
  position?: 'left' | 'right' | 'alternate'
  pending?: boolean
  pendingContent?: ReactNode
}

// Tag Props
export interface TagProps extends BaseComponentProps {
  label: string
  color?: string
  closable?: boolean
  onClose?: () => void
  icon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

// Accordion Props
export interface AccordionItemProps {
  key: string
  title: ReactNode
  content: ReactNode
  disabled?: boolean
  extra?: ReactNode
}

export interface AccordionProps extends BaseComponentProps {
  items: AccordionItemProps[]
  activeKey?: string | string[]
  defaultActiveKey?: string | string[]
  onChange?: (key: string | string[]) => void
  multiple?: boolean
  bordered?: boolean
  ghost?: boolean
}

// Tabs Props
export interface TabItemProps {
  key: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
  closable?: boolean
  icon?: ReactNode
}

export interface TabsProps extends BaseComponentProps {
  items: TabItemProps[]
  activeKey?: string
  defaultActiveKey?: string
  onChange?: (key: string) => void
  onClose?: (key: string) => void
  type?: 'line' | 'card' | 'button'
  position?: 'top' | 'bottom' | 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
  centered?: boolean
}