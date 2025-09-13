import DocumentsTabNew from '@/components/dashboard/tabs/documents-tab-new'

export default function TestDocumentsNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="appbar">
        <div className="brand-logo">INOPNC WM</div>
      </header>
      <main style={{ paddingTop: 'var(--header-h, 56px)' }}>
        <DocumentsTabNew />
      </main>
    </div>
  )
}