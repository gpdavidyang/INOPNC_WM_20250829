
export const metadata: Metadata = {
  title: '작업 옵션 관리',
  description: '작업일지 부재명 및 작업공정 옵션 관리',
}

export default function WorkOptionsPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          작업 옵션 관리
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          작업일지에서 사용되는 부재명과 작업공정 옵션을 관리합니다.
        </p>
      </div>
      
      <WorkOptionsManagement />
    </div>
  )
}