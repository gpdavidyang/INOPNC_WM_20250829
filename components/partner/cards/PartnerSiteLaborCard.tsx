'use client'

interface PartnerSiteLaborCardProps {
  siteName?: string
  crewCount?: number
}

export function PartnerSiteLaborCard({ siteName = '현장', crewCount = 0 }: PartnerSiteLaborCardProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p className="font-medium text-gray-900">{siteName}</p>
      <p className="mt-1">참여 인원: {crewCount}명</p>
    </div>
  )
}
