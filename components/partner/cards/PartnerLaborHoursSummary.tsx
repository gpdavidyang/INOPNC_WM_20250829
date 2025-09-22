'use client'

interface PartnerLaborHoursSummaryProps {
  totalHours?: number
}

export function PartnerLaborHoursSummary({ totalHours = 0 }: PartnerLaborHoursSummaryProps) {
  return (
    <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-600">
      <p>이번 달 누적 근로 시간</p>
      <p className="mt-1 text-xl font-semibold text-gray-900">{totalHours} h</p>
    </div>
  )
}
