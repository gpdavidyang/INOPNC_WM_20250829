/**
 * 페이지 컴포넌트 Props 타입 정의
 */

import { ReactNode } from 'react'
import { BaseComponentProps } from './index'
import { AuthUser } from '../api/auth'
import { Site } from '../api/sites'
import { DailyReport } from '../api/daily-reports'

// Dashboard Page Props
export interface DashboardPageProps extends BaseComponentProps {
  user: AuthUser
  stats?: {
    totalWorkers?: number
    activeSites?: number
    todayReports?: number
    pendingApprovals?: number
  }
  recentActivities?: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
  loading?: boolean
  error?: string | null
}

// Login Page Props
export interface LoginPageProps extends BaseComponentProps {
  onSubmit: (email: string, password: string) => void | Promise<void>
  loading?: boolean
  error?: string | null
  redirectUrl?: string
  showSignup?: boolean
  showForgotPassword?: boolean
}

// Sites Page Props
export interface SitesPageProps extends BaseComponentProps {
  sites: Site[]
  loading?: boolean
  error?: string | null
  onSiteSelect?: (site: Site) => void
  onSiteCreate?: () => void
  canCreate?: boolean
  viewMode?: 'grid' | 'list' | 'map'
}

// Daily Reports Page Props
export interface DailyReportsPageProps extends BaseComponentProps {
  reports: DailyReport[]
  currentSite?: Site
  loading?: boolean
  error?: string | null
  onReportCreate?: () => void
  onReportEdit?: (report: DailyReport) => void
  onReportView?: (report: DailyReport) => void
  canCreate?: boolean
  filters?: {
    dateRange?: [string, string]
    status?: string
    siteId?: string
  }
}

// Workers Management Page Props
export interface WorkersPageProps extends BaseComponentProps {
  workers: Array<{
    id: string
    name: string
    role: string
    site?: string
    status: 'active' | 'inactive'
  }>
  loading?: boolean
  error?: string | null
  onWorkerAdd?: () => void
  onWorkerEdit?: (workerId: string) => void
  onWorkerRemove?: (workerId: string) => void
  canManage?: boolean
}

// Documents Page Props
export interface DocumentsPageProps extends BaseComponentProps {
  documents: Array<{
    id: string
    title: string
    type: string
    uploadedAt: string
    status: string
  }>
  categories?: string[]
  selectedCategory?: string
  loading?: boolean
  error?: string | null
  onUpload?: () => void
  onDocumentView?: (documentId: string) => void
  onDocumentDelete?: (documentId: string) => void
  canUpload?: boolean
}

// Profile Page Props
export interface ProfilePageProps extends BaseComponentProps {
  user: AuthUser
  editable?: boolean
  onSave?: (data: Partial<AuthUser>) => void | Promise<void>
  onPasswordChange?: () => void
  onLogout?: () => void
  loading?: boolean
  error?: string | null
}

// Settings Page Props
export interface SettingsPageProps extends BaseComponentProps {
  sections: Array<{
    id: string
    title: string
    description?: string
    component: ReactNode
  }>
  activeSection?: string
  onSectionChange?: (sectionId: string) => void
  onSave?: (sectionId: string, data: Record<string, unknown>) => void | Promise<void>
  loading?: boolean
  error?: string | null
}

// Error Page Props
export interface ErrorPageProps extends BaseComponentProps {
  statusCode: number
  title?: string
  message?: string
  showBackButton?: boolean
  onBack?: () => void
  showHomeButton?: boolean
  onHome?: () => void
}

// Salary Management Page Props
export interface SalaryPageProps extends BaseComponentProps {
  workerId?: string
  period?: {
    year: number
    month: number
  }
  salaryData?: {
    totalDays: number
    totalHours: number
    basePay: number
    overtimePay: number
    deductions: number
    netPay: number
  }
  loading?: boolean
  error?: string | null
  onCalculate?: () => void
  onExport?: (format: 'pdf' | 'excel') => void
  canManage?: boolean
}

// Notifications Page Props
export interface NotificationsPageProps extends BaseComponentProps {
  notifications: Array<{
    id: string
    title: string
    message: string
    type: string
    timestamp: string
    isRead: boolean
  }>
  unreadCount?: number
  loading?: boolean
  error?: string | null
  onMarkAsRead?: (notificationId: string) => void
  onMarkAllAsRead?: () => void
  onDelete?: (notificationId: string) => void
}