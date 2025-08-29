'use client'

import { useState } from 'react'
import { AttendanceView } from './attendance-view'
import { SalaryView } from './salary-view'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFontSize } from '@/contexts/FontSizeContext'
import { useTouchMode } from '@/contexts/TouchModeContext'
import { cn } from '@/lib/utils'

interface AttendancePageClientProps {
  profile: any
  isPartnerCompany: boolean
}

export function AttendancePageClient({ profile, isPartnerCompany }: AttendancePageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()
  const [activeTab, setActiveTab] = useState('attendance')

  console.log('AttendancePageClient: Received profile:', {
    hasProfile: !!profile,
    profileId: profile?.id,
    profileRole: profile?.role,
    profileFullName: profile?.full_name,
    isPartnerCompany
  })

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* UI Guidelines에 맞는 탭 디자인 */}
          <div className="flex gap-3 mb-3">
            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
                "min-h-[48px]", // UI Guidelines 표준 버튼 높이
                activeTab === 'attendance' 
                  ? "bg-toss-blue-600 text-white shadow-lg" 
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
              )}
            >
              출력정보
            </button>
            <button
              onClick={() => setActiveTab('salary')}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl font-medium transition-all",
                "min-h-[48px]", // UI Guidelines 표준 버튼 높이
                activeTab === 'salary' 
                  ? "bg-toss-blue-600 text-white shadow-lg" 
                  : "bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 shadow-sm",
                touchMode === 'glove' && "min-h-[60px] text-base",
                touchMode === 'precision' && "min-h-[44px] text-sm",
                touchMode !== 'precision' && touchMode !== 'glove' && "text-sm"
              )}
            >
              급여정보
            </button>
          </div>

          <TabsContent value="attendance" className="mt-0">
            <AttendanceView profile={profile} />
          </TabsContent>

          <TabsContent value="salary" className="mt-0">
            <SalaryView profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}