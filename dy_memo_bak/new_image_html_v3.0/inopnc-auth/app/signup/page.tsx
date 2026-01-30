export const metadata = { title: '회원가입' }
export default function Page() {
  return (
    <main className="h-[100svh] w-screen p-0 m-0">
      <iframe src={'/legacy/signup.html'} className="w-full h-full border-0" title="회원가입" />
    </main>
  )
}
