export const metadata = { title: '로그인' }
export default function Page() {
  return (
    <main className="h-[100svh] w-screen p-0 m-0">
      <iframe src={'/legacy/login.html'} className="w-full h-full border-0" title="로그인" />
    </main>
  )
}
