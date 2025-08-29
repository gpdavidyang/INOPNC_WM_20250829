import DocumentManagement from '@/components/admin/DocumentManagement'

export default function SharedDocumentsManagementPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
    <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">공유 문서함 관리</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">공유 문서 업로드, 카테고리 관리 및 권한 설정</p>
    </div>

      <DocumentManagement />
    </div>
  )
}