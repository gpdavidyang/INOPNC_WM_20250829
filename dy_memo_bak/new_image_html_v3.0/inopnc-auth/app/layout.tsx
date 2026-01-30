export const metadata = {
  title: 'INOPNC Auth',
  description: 'Legacy-auth preserved in Next.js + Tailwind',
}
import './../styles/globals.css'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white">{children}</body>
    </html>
  )
}
