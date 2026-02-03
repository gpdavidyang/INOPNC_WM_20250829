'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'
import { ChevronDown, ChevronUp, Shield } from 'lucide-react'
import React from 'react'

export const useRolePermissions = (currentUser: Profile) => {
  const role = currentUser?.role || 'worker'
  const isAdmin = ['admin', 'system_admin'].includes(role)
  const isSiteManager = role === 'site_manager'
  const isWorker = role === 'worker'

  return {
    isAdmin,
    isSiteManager,
    isWorker,
    canManageWorkers: isAdmin || isSiteManager,
    canManageMaterials: isAdmin || isSiteManager || isWorker,
    canManageSafety: isAdmin || isSiteManager,
    canViewAdvancedFeatures: isAdmin || isSiteManager,
  }
}

interface CollapsibleSectionProps {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  badge?: React.ReactNode
  required?: boolean
  adminOnly?: boolean
  managerOnly?: boolean
  permissions?: ReturnType<typeof useRolePermissions>
}

export const CollapsibleSection = ({
  title,
  icon: Icon,
  children,
  isExpanded,
  onToggle,
  badge,
  required = false,
  adminOnly = false,
  managerOnly = false,
  permissions,
}: CollapsibleSectionProps) => {
  // 권한 체크
  if (adminOnly && !permissions?.isAdmin) return null
  if (managerOnly && !permissions?.canViewAdvancedFeatures) return null

  const getBorderColor = () => {
    if (adminOnly) return 'border-[#8DA0CD] shadow-sm'
    return 'border-gray-200 dark:border-gray-700'
  }

  const getHeaderBg = () => {
    if (adminOnly) return 'hover:bg-[rgba(141,160,205,0.15)]'
    return 'hover:bg-[#F3F7FA] dark:hover:bg-gray-700'
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border overflow-hidden',
        getBorderColor()
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-3 py-2.5 flex items-center justify-between transition-all duration-200',
          getHeaderBg()
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1.5 rounded',
              adminOnly ? 'bg-[rgba(141,160,205,0.25)]' : 'bg-[#F3F7FA]'
            )}
          >
            <Icon className={cn('h-4 w-4', adminOnly ? 'text-[#1B419C]' : 'text-[#5F7AB9]')} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {title}
              {required && <span className="text-red-500 ml-1">*</span>}
            </h3>
            {adminOnly && (
              <Badge className="px-1.5 py-0.5 text-xs bg-[rgba(141,160,205,0.25)] text-[#1B419C] border-[#8DA0CD]">
                <Shield className="h-3 w-3 mr-1" />
                관리자
              </Badge>
            )}
            {badge && !adminOnly && badge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">{children}</div>
      )}
    </div>
  )
}
