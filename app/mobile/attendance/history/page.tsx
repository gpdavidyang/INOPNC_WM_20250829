import nextDynamic from 'next/dynamic'

export const dynamic = 'force-dynamic'

const SalaryHistoryPage = nextDynamic(() => import('@/modules/mobile/pages/salary-history-page'), {
  ssr: false,
})

export default function MobileSalaryHistoryPage() {
  return <SalaryHistoryPage />
}
