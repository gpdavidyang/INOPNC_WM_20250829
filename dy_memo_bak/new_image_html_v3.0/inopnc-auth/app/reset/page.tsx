export const metadata = { title: '비밀번호 초기화' }
export default function Page() {
  return (
    <main className="h-[100svh] w-screen p-0 m-0">
      <iframe
        src={'/legacy/reset.html'}
        className="w-full h-full border-0"
        title="비밀번호 초기화"
      />
    </main>
  )
}
