'use client'

import { useState } from 'react'
import { Profile } from '@/types'
import DashboardLayout from '@/components/dashboard/dashboard-layout'
import { DailyReportsWorklogView } from '@/components/daily-reports/daily-reports-worklog-view'

interface DailyReportsPageClientProps {
  profile: Profile
  sites: any[]
}

export function DailyReportsPageClient({ profile, sites }: DailyReportsPageClientProps) {
  return (
    <DashboardLayout 
      user={{ id: profile.id, email: profile.email || '' } as any} 
      profile={profile as any}
    >
      <div className="min-h-screen flex flex-col items-center bg-[#f5f7fb] dark:bg-[#0f172a]">
        <main className="w-full max-w-[480px] mx-auto px-4 pb-6">
          <DailyReportsWorklogView 
            profile={profile}
            sites={sites}
          />
        </main>
      </div>
    </DashboardLayout>
  )
}
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        items={bottomNavItems}
        className="lg:hidden"
      />
    </div>
  )
}