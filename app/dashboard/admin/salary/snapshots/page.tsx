'use client'

import dynamic from 'next/dynamic'

const SalarySnapshotTool = dynamic(() => import('../SalarySnapshotTool'), { ssr: false })
const SnapshotList = dynamic(() => import('../SnapshotList'), { ssr: false })

export default function SnapshotsPage() {
  return (
    <div className="space-y-4">
      <div>
        <SalarySnapshotTool />
      </div>
      <div>
        <h2 className="text-lg font-medium mb-3">발행 이력</h2>
        <SnapshotList />
      </div>
    </div>
  )
}
