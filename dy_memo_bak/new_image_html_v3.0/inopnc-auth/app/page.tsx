export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">INOPNC Auth (Next + Tailwind)</h1>
      <p className="mb-6">
        아래 링크는 원본 코드를 100% 그대로 유지하기 위해 <code>public/legacy</code>의 HTML을
        iframe으로 표시합니다.
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <a className="text-blue-600 underline" href="/signup">
            회원가입
          </a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/login">
            로그인
          </a>
        </li>
        <li>
          <a className="text-blue-600 underline" href="/reset">
            비밀번호 초기화
          </a>
        </li>
      </ul>
    </main>
  )
}
