'use client'

import { Button } from '@/components/ui/button'
import { AttendanceCalendar } from '@/components/attendance/attendance-calendar'

interface AttendanceCalendarPageClientProps {
  profile: unknown
  showNoSiteMessage: boolean
}

export function AttendanceCalendarPageClient({ profile, showNoSiteMessage }: AttendanceCalendarPageClientProps) {
  const { isLargeFont } = useFontSize()
  const { touchMode } = useTouchMode()

  if (showNoSiteMessage) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className={touchMode === 'glove' ? 'p-16' : touchMode === 'precision' ? 'p-8' : 'p-12'}>
          <h2 className={`${getFullTypographyClass('heading', 'xl', isLargeFont)} font-semibold mb-4 text-center`}>
            현장 배정 필요
          </h2>
          <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 dark:text-gray-400 mb-6 text-center`}>
            출퇴근 현황을 확인하려면 현장에 배정되어야 합니다.
            <br />
            관리자에게 문의하세요.
          </p>
          <div className="text-center">
            <Link href="/dashboard/attendance">
              <Button 
                variant="outline"
                size={touchMode === 'glove' ? 'field' : touchMode === 'precision' ? 'compact' : 'standard'}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                돌아가기
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/attendance">
            <Button 
              variant="ghost" 
              size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              뒤로
            </Button>
          </Link>
          <div>
            <h1 className={`${getFullTypographyClass('heading', '2xl', isLargeFont)} font-bold`}>
              월별 출퇴근 현황
            </h1>
            <p className={`${getFullTypographyClass('body', 'base', isLargeFont)} text-gray-600 dark:text-gray-400`}>
              {Array.isArray(profile.site) && profile.site.length > 0 ? profile.site[0].name : '현장 정보 없음'} - {profile.full_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          >
            <FileText className="h-4 w-4 mr-2" />
            상세 내역
          </Button>
          <Button 
            variant="outline"
            size={touchMode === 'glove' ? 'standard' : touchMode === 'precision' ? 'compact' : 'compact'}
          >
            <Download className="h-4 w-4 mr-2" />
            다운로드
          </Button>
        </div>
      </div>

      <AttendanceCalendar 
        profile={profile}
        isPartnerView={false}
      />
    </div>
  )
}