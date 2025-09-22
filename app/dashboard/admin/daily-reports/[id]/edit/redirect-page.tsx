import { redirect } from 'next/navigation'

interface RedirectPageProps {
  params: { id: string }
}

export default function AdminDailyReportEditRedirect({ params }: RedirectPageProps) {
  // 관리자 전용 편집 URL을 통합된 URL로 리다이렉트
  redirect(`/dashboard/daily-reports/${params.id}/edit`)
}