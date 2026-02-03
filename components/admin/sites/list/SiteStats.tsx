'use client'

import StatsCard from '@/components/ui/stats-card'
import { t } from '@/lib/ui/strings'

interface SiteStatsProps {
  total: number
  activeCount: number
  statusFilterLabel: string
}

export const SiteStats = ({ total, activeCount, statusFilterLabel }: SiteStatsProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-3 mb-6">
      <StatsCard
        label={t('sites.stats.total')}
        value={total}
        unit="site"
        className="bg-white dark:bg-gray-800 border-none shadow-sm"
      />
      <StatsCard
        label={t('sites.stats.activeOnPage')}
        value={activeCount}
        unit="site"
        className="bg-white dark:bg-gray-800 border-none shadow-sm"
      />
      <StatsCard
        label={t('users.filters.statusSelected')}
        value={statusFilterLabel}
        className="bg-white dark:bg-gray-800 border-none shadow-sm"
      />
    </section>
  )
}
