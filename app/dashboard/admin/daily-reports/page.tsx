
export default function AdminDailyReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">작업일지 관리</h1>
        <p className="text-gray-600 mt-1">모든 현장의 작업일지를 관리합니다.</p>
      </div>
      
      <DailyReportsManagement />
    </div>
  )
}