import {
  Building2,
  Camera,
  DollarSign,
  Edit3,
  FileCheck,
  FileText,
  FolderOpen,
  Home,
  Inbox,
  Layout,
  LucideIcon,
  MessageSquare,
  Package,
  Receipt,
  Settings,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'

export interface MenuItem {
  id: string
  label: string
  icon: LucideIcon
  href: string
  hidden?: boolean
}

export interface MenuGroup {
  id: string
  label: string | null
  collapsible: boolean
  items: MenuItem[]
}

export const menuCategories: MenuGroup[] = [
  {
    id: 'main',
    label: null,
    collapsible: false,
    items: [
      {
        id: 'home',
        label: '홈',
        icon: Home,
        href: '/dashboard/admin',
      },
      {
        id: 'integrated',
        label: '통합 관리 대시보드',
        icon: Layout,
        href: '/dashboard/admin/integrated',
        hidden: true,
      },
    ],
  },
  {
    id: 'analytics',
    label: '현장작업 관리',
    collapsible: true,
    items: [
      {
        id: 'sites',
        label: '현장 관리',
        icon: Building2,
        href: '/dashboard/admin/sites',
      },
      {
        id: 'daily-reports',
        label: '작업일지 관리',
        icon: FileText,
        href: '/dashboard/admin/daily-reports',
      },
      {
        id: 'invoice-documents',
        label: '기성청구 관리',
        icon: Receipt,
        href: '/dashboard/admin/documents/invoice',
      },
      {
        id: 'materials',
        label: '자재 관리',
        icon: Package,
        href: '/dashboard/admin/materials',
      },
      {
        id: 'photo-grid-tool',
        label: '사진대지 관리',
        icon: Camera,
        href: '/dashboard/admin/photo-sheets',
      },
      {
        id: 'markup-tool',
        label: '도면마킹 관리',
        icon: Edit3,
        href: '/dashboard/admin/tools/markup',
      },
    ],
  },
  {
    id: 'accounts',
    label: '사용자 및 소속 관리',
    collapsible: true,
    items: [
      {
        id: 'signup-requests',
        label: '가입 요청 관리',
        icon: UserPlus,
        href: '/dashboard/admin/signup-requests',
      },
      {
        id: 'users',
        label: '사용자 관리',
        icon: Users,
        href: '/dashboard/admin/users',
      },
      {
        id: 'salary',
        label: '급여관리 도구',
        icon: DollarSign,
        href: '/dashboard/admin/salary',
      },
      {
        id: 'document-required',
        label: '필수서류 관리',
        icon: FileCheck,
        href: '/dashboard/admin/documents/required',
      },
      {
        id: 'organizations',
        label: '소속(시공사) 관리',
        icon: Shield,
        href: '/dashboard/admin/organizations',
      },
      {
        id: 'material-partners',
        label: '자재거래처 관리',
        icon: FolderOpen,
        href: '/dashboard/admin/partners',
      },
    ],
  },
  {
    id: 'communication',
    label: '소통',
    collapsible: true,
    items: [
      {
        id: 'communication',
        label: '공지사항 관리',
        icon: MessageSquare,
        href: '/dashboard/admin/communication',
      },
      {
        id: 'hq-requests',
        label: '본사요청 관리',
        icon: Inbox,
        href: '/dashboard/admin/hq-requests',
      },
    ],
  },
]

export const systemCategory: MenuGroup = {
  id: 'system',
  label: '시스템',
  collapsible: true,
  items: [
    {
      id: 'system',
      label: '시스템 설정',
      icon: Settings,
      href: '/dashboard/admin/system',
    },
    {
      id: 'work-options',
      label: '작업 옵션 관리',
      icon: Settings,
      href: '/dashboard/admin/work-options',
    },
    {
      id: 'documents-company',
      label: '이노피앤씨 설정',
      icon: FileText,
      href: '/dashboard/admin/documents/company',
    },
  ],
}
