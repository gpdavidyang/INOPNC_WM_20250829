import type { Metadata } from 'next'
import { requireAdminProfile } from '@/app/dashboard/admin/utils'
import { useState } from 'react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: '문서함 유지보수' }

export default async function AdminDocumentsMaintenancePage() {
  await requireAdminProfile()
  return <ClientView />
}

function ClientView() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const call = async (url: string, label: string) => {
    setBusy(true)
    setMsg('')
    try {
      const res = await fetch(url, { method: 'POST', credentials: 'include' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.error || `${label} 실패`)
      setMsg(`${label} 완료: ${json.migrated ?? json.removed ?? 'ok'}`)
    } catch (e: any) {
      setMsg(e?.message || `${label} 실패`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">문서함 유지보수</h1>
        <p className="text-sm text-muted-foreground">회사서류 초기화 및 공도면 이전(관리자)</p>
      </div>
      <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={() => call('/api/admin/documents/company/clear', '회사서류 초기화')}
            className="px-3 py-2 rounded-md bg-rose-600 text-white disabled:opacity-60"
          >
            회사서류 초기화
          </button>
          <button
            disabled={busy}
            onClick={() => call('/api/admin/documents/migrate-blueprints', '공도면 이전')}
            className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
          >
            공도면 이전
          </button>
        </div>
        {msg && <div className="text-sm text-gray-700">{msg}</div>}
        <div className="text-xs text-muted-foreground">
          - 회사서류 초기화: documents(is_public=true) + 스토리지 삭제, unified shared 정리
          <br />- 공도면 이전: 제목/파일명에 ‘공도면’ 포함 → site_documents(blueprint)로 이전
        </div>
      </div>
    </div>
  )
}
