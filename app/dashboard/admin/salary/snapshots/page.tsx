'use client'

import dynamic from 'next/dynamic'

const SnapshotList = dynamic(() => import('../SnapshotList'), { ssr: false })

export default function SnapshotsPage() {
  return (
    <div className="space-y-6">
      <SnapshotList />
    </div>
  )
}
