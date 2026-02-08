import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function MobileWorklog2Page() {
  redirect('/mobile/worklog')
}
