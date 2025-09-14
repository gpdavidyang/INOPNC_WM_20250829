
export default function MarkupDocumentDetailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">도면마킹 상세</h1>
        <p className="text-gray-600 mt-1">도면마킹 문서의 상세 정보와 편집 도구입니다.</p>
      </div>
      
      <MarkupDocumentDetail />
    </div>
  )
}