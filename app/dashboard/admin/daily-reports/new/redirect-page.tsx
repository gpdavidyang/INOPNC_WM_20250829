import { redirect } from 'next/navigation'

export default function AdminDailyReportNewRedirect() {
  // 관리자 전용 URL을 통합된 URL로 리다이렉트
  redirect('/dashboard/daily-reports/new')
}