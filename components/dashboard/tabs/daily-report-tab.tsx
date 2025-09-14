'use client'

import WorkLogsTab from './work-logs-tab'

interface DailyReportTabProps {
  profile: Profile
}

export default function DailyReportTab({ profile }: DailyReportTabProps) {
  return <WorkLogsTab profile={profile} />
}