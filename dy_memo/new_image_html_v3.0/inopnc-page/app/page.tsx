export default function Page() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Next + Tailwind 변환 (원본 100% 유지)</h1>
      <p className="text-sm mb-6">
        아래 목록은 /public/raw 에 그대로 복사된 원본 HTML입니다. &quot;원본 열기&quot;는 원본
        파일을 그대로 보여주고, &quot;미리보기&quot;는 안전한 iframe으로 렌더링합니다.
      </p>
      <ul className="space-y-2">
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">main.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/main.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/main">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">p-main.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/p-main.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/p-main">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">p-site.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/p-site.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/p-site">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">p-task.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/p-task.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/p-task">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">p-worklog.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/p-worklog.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/p-worklog">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">task.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/task.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/task">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">p-doc.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/p-doc.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/p-doc">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">site.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/site.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/site">
              미리보기
            </a>
          </div>
        </li>
        <li className="flex items-center justify-between p-3 rounded-xl border">
          <span className="font-medium">worklog.html</span>
          <div className="flex gap-3">
            <a className="underline" href="/raw/worklog.html" target="_blank" rel="noreferrer">
              원본 열기
            </a>
            <a className="underline" href="/preview/worklog">
              미리보기
            </a>
          </div>
        </li>
      </ul>
    </main>
  )
}
