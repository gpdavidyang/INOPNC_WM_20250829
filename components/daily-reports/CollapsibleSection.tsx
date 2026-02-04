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
    if (adminOnly) return 'border-blue-200 shadow-sm shadow-blue-50'
    return 'border-gray-200 dark:border-gray-700 shadow-sm shadow-gray-100/50'
  }

  const getHeaderBg = () => {
    if (adminOnly) return 'hover:bg-blue-50/50'
    return 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
  }

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 overflow-hidden',
        getBorderColor()
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full px-4 py-3.5 flex items-center justify-between transition-all duration-200',
          getHeaderBg()
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-xl transition-colors',
              adminOnly ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-[#1A254F]'
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-[15px] font-black text-foreground tracking-tight flex items-center">
              {title}
              {required && <span className="text-rose-500 ml-1.5">*</span>}
            </h3>
            {adminOnly && (
              <Badge className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                <Shield className="h-3 w-3 mr-1" />
                ADMIN ONLY
              </Badge>
            )}
            {badge && !adminOnly && badge}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'p-1 rounded-full transition-transform duration-300',
              isExpanded ? 'bg-gray-100 rotate-0' : 'rotate-0'
            )}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  )
}
