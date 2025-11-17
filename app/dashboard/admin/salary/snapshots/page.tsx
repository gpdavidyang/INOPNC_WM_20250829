'use client'

import dynamic from 'next/dynamic'

const SnapshotList = dynamic(() => import('../SnapshotList'), { ssr: false })

export default function SnapshotsPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">월별 조회</h2>
        <p className="text-sm text-gray-600">
          이미 발행된 명세서를 조건별로 검색하고 승인/지급 상태를 확인하세요.
        </p>
      </div>
      <SnapshotList />
    </div>
  )
}
