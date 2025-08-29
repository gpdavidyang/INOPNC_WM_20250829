'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/types'
import PartnerSidebar from './PartnerSidebar'
import PartnerHeader from './PartnerHeader'
import PartnerHomeTab from './tabs/PartnerHomeTab'
import PartnerPrintStatusTab from './tabs/PartnerPrintStatusTab'
import PartnerWorkLogsTab from './tabs/PartnerWorkLogsTab'
import PartnerSiteInfoTab from './tabs/PartnerSiteInfoTab'
import PartnerDocumentsTab from './tabs/PartnerDocumentsTab'
import PartnerMyInfoTab from './tabs/PartnerMyInfoTab'
import PartnerBottomNavigation from './PartnerBottomNavigation'

interface PartnerDashboardProps {
  user: User
  profile: Profile
  sites: any[]
  organization: any
}

export default function PartnerDashboard({ 
  user, 
  profile, 
  sites, 
  organization 
}: PartnerDashboardProps) {
  const [activeTab, setActiveTab] = useState('home')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <PartnerHomeTab profile={profile} sites={sites} organization={organization} onTabChange={setActiveTab} />
      case 'print-status':
        return <PartnerPrintStatusTab profile={profile} sites={sites} />
      case 'work-logs':
        return <PartnerWorkLogsTab profile={profile} sites={sites} />
      case 'site-info':
        return <PartnerSiteInfoTab profile={profile} sites={sites} />
      case 'documents':
        return <PartnerDocumentsTab profile={profile} sites={sites} />
      case 'my-info':
        return <PartnerMyInfoTab profile={profile} />
      default:
        return <PartnerHomeTab profile={profile} sites={sites} organization={organization} onTabChange={setActiveTab} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <PartnerSidebar
        profile={profile}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <PartnerHeader
          profile={profile}
          onMenuClick={() => setIsSidebarOpen(true)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Content Area */}
        <main className="py-6 pb-20 lg:pb-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <PartnerBottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}