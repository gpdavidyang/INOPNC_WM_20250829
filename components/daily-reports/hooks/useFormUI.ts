'use client'

import { Settings, Shield, Users } from 'lucide-react'
import React, { useCallback } from 'react'

export const useFormUI = (mode: 'create' | 'edit', permissions: any) => {
  const getPageTitle = useCallback(() => {
    if (mode === 'create') return '작업일지 작성'
    return '작업일지 수정'
  }, [mode])

  const getBreadcrumb = useCallback(() => {
    if (permissions.isAdmin) return '/dashboard/admin/daily-reports'
    if (permissions.isSiteManager) return '/dashboard/site-manager/daily-reports'
    return '/dashboard/worker/daily-reports'
  }, [permissions.isAdmin, permissions.isSiteManager])

  const getRoleIcon = useCallback(() => {
    if (permissions.isAdmin)
      return React.createElement(Shield, { className: 'h-5 w-5 text-[#1B419C]' })
    if (permissions.isSiteManager)
      return React.createElement(Settings, { className: 'h-5 w-5 text-[#FF461C]' })
    return React.createElement(Users, { className: 'h-5 w-5 text-[#5F7AB9]' })
  }, [permissions.isAdmin, permissions.isSiteManager])

  const getRoleBadgeColor = useCallback(() => {
    if (permissions.isAdmin) return 'bg-[#1B419C]/10 text-[#1B419C] border-[#1B419C]/20'
    if (permissions.isSiteManager) return 'bg-[#FF461C]/10 text-[#FF461C] border-[#FF461C]/20'
    return 'bg-[#5F7AB9]/10 text-[#5F7AB9] border-[#5F7AB9]/20'
  }, [permissions.isAdmin, permissions.isSiteManager])

  return {
    getPageTitle,
    getBreadcrumb,
    getRoleIcon,
    getRoleBadgeColor,
  }
}
