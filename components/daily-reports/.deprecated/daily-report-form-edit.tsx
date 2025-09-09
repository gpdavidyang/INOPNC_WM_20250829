'use client'

// Temporary placeholder component to fix build issues
export default function DailyReportFormEdit(props: any) {
  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">작업일지 편집 (임시)</h2>
        <p className="text-gray-600">
          작업일지 편집 기능이 임시적으로 비활성화되었습니다. 
          통합 보기 테스트를 완료한 후 수정하겠습니다.
        </p>
        <div className="mt-4">
          <button 
            onClick={() => window.history.back()} 
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}