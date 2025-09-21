import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '문서 관리',
}

export default function AdminDocumentsPage() {
  return (
    <main className="px-4 py-8">
      <section className="mx-auto max-w-4xl space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">문서 관리</h1>
          <p className="mt-2 text-sm text-gray-600">
            문서 관리 기능은 아직 콘솔에 업로드되지 않았습니다. 추후 배포에서 실제 데이터와 연동될
            예정입니다.
          </p>
        </header>

        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            현재는 예제 데이터를 통해 API 응답 구조만 제공하고 있습니다. <br />
            관리자 문서 목록은 향후 업데이트에서 사용할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  )
}
