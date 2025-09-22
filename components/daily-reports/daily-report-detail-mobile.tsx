import React from 'react'

export function DailyReportDetailMobile({ 
  report, 
  currentUser 
}: { 
  report: any
  currentUser: any 
}) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">작업일지 상세</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">작업일</h3>
          <p>{report?.work_date || '-'}</p>
        </div>
        <div>
          <h3 className="font-semibold">현장</h3>
          <p>{report?.site?.name || '-'}</p>
        </div>
        <div>
          <h3 className="font-semibold">작업내용</h3>
          <p className="whitespace-pre-wrap">{report?.work_description || '-'}</p>
        </div>
      </div>
    </div>
  )
}