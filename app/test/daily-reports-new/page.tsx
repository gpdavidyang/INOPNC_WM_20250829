
export default function TestDailyReportsNewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="appbar">
        <div className="brand-logo">INOPNC WM</div>
      </header>
      <main style={{ paddingTop: 'var(--header-h, 56px)' }}>
        <DailyReportsTabNew />
      </main>
    </div>
  )
}