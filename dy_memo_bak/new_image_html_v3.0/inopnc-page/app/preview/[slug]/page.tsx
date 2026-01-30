'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'

export default function PreviewPage() {
  const params = useParams()
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string)
  const src = useMemo(() => `/raw/${slug}.html`, [slug])

  return (
    <main className="h-[100svh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm underline">
            ← 목록으로
          </a>
          <h1 className="text-lg font-semibold">{slug}.html</h1>
        </div>
        <a className="text-sm underline" href={src} target="_blank" rel="noreferrer">
          새 탭에서 원본 보기
        </a>
      </div>
      <div className="flex-1">
        <iframe src={src} title={slug} className="w-full h-full border-0" />
      </div>
    </main>
  )
}
