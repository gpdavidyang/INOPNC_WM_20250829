'use client'

import { SalaryView } from './salary-view'
import {
  BrandTabs as Tabs,
  BrandTabsContent as TabsContent,
  BrandTabsList as TabsList,
  BrandTabsTrigger as TabsTrigger,
} from '@/components/ui/brand-tabs'

interface AttendancePageClientProps {
  profile: unknown
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
    isPartnerCompany,
  })

  return (
    <div className="h-full bg-white dark:bg-gray-900">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-3" fill>
            <TabsTrigger value="attendance">출석/출력정보</TabsTrigger>
            <TabsTrigger value="salary">급여정보</TabsTrigger>
          </TabsList>

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
